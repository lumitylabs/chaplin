import fs from "fs";
import path from "path";
// import { db } from "../firebase.js"; // Removido, não estava em uso

const ABIS_DIR = path.join(process.cwd(), "abis");
const SESSION_V2_ABI = JSON.parse(
  fs.readFileSync(path.join(ABIS_DIR, "SessionV2.json"), "utf8")
);
const SESSION_QUEUE_V2_ABI = JSON.parse(
  fs.readFileSync(path.join(ABIS_DIR, "SessionQueueV2.json"), "utf8")
);

class CortensorModel {
  constructor(config = {}) {
    this.name = "cortensor";
    this.rpcUrl = config.rpcUrl || process.env.CORTENSOR_RPC_URL;
    this.sessionAddress = config.sessionAddress || process.env.SESSION_V2_ADDRESS;
    this.queueAddress = config.queueAddress || process.env.SESSION_QUEUE_V2_ADDRESS;
    this.privateKey = config.privateKey || process.env.CORTENSOR_PRIVATE_KEY;
    this.sessionIdSmall = process.env.CORTENSOR_SESSION_ID_SMALL || null;
    this.sessionIdBig = process.env.CORTENSOR_SESSION_ID_BIG || null;
    this._provider = null;
    this._signer = null;
    this._sessionContract = null;
    this._queueContract = null;
  }

  async _importEthers() {
    const ethers = await import("ethers");
    if (!ethers.JsonRpcProvider) throw new Error("Invalid ethers import");
    return ethers;
  }

  async _initProviderAndSigner() {
    if (this._provider && this._signer) return;
    const ethers = await this._importEthers();
    this._provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this._signer = new ethers.Wallet(this.privateKey, this._provider);
    this._sessionContract = new ethers.Contract(this.sessionAddress, SESSION_V2_ABI, this._signer);
    this._queueContract = new ethers.Contract(this.queueAddress, SESSION_QUEUE_V2_ABI, this._signer);
    console.log(`[CortensorModel] Connected with address: ${await this._signer.getAddress()}`);
  }

  async getSessionId(sessionSize = 'small') {
    await this._initProviderAndSigner();
    const id = (sessionSize === 'big' && this.sessionIdBig) ? this.sessionIdBig : this.sessionIdSmall;
    if (id) return Number(id);
    throw new Error("No valid session ID available for the required size.");
  }

  async submitTask(sessionId, promptText) {
    await this._initProviderAndSigner();
    const llmParams = [2048, 35, 90, 40, 60, 20, 0];
    console.log(`[CortensorModel] Submitting task for session ${sessionId}...`);
    const tx = await this._sessionContract.submit(
      Number(sessionId), 2, promptText.prompt, 1, "", llmParams,
      [240, 0, 0, 0, 0, 0], "my-client-side-reference"
    );
    const receipt = await tx.wait();
    if (receipt.status === 0) throw new Error(`Task submission transaction failed`);
    
    const ethers = await this._importEthers();
    const iface = new ethers.Interface(SESSION_V2_ABI);
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === this.sessionAddress.toLowerCase()) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed.name === "TaskSubmitted") {
            const taskId = Number(parsed.args.taskId.toString());
            console.log(`[CortensorModel] TaskSubmitted successfully. Task ID: ${taskId}`);
            return { taskId };
          }
        } catch {}
      }
    }
    throw new Error("TaskSubmitted event not parsed from transaction receipt.");
  }

  async getTaskResults(sessionId, taskId) {
    await this._initProviderAndSigner();
    // Esta é a chamada que pode causar o 'panic'
    const [miners, results] = await this._sessionContract.getTaskResults(Number(sessionId), Number(taskId));
    return { miners, results };
  }

  async generateText(prompt, opts = {}) {
    const agentNameToFail = "__FAIL_AGENT__";
    if (opts && opts.agentName === agentNameToFail) {
      console.warn(`[TESTE] GATILHO DE FALHA ATIVADO PARA O AGENTE: ${agentNameToFail}`);
      throw new Error(`[TESTE] Falha simulada para o agente '${agentNameToFail}'.`);
    }
    
    await this._initProviderAndSigner();
    const promptObj = (typeof prompt === "string") ? { prompt } : prompt;
    if (!promptObj?.prompt) throw new Error("Invalid prompt parameter.");

    const sessionId = await this.getSessionId(opts.sessionSize);
    const friendlyName = opts?.agentName || "Cortensor";
    const { taskId } = await this.submitTask(sessionId, promptObj);

    const maxAttempts = 24; // ~2 minutos de espera total
    const pollInterval = 5000; // 5 segundos

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (opts.onProgress) {
        await opts.onProgress({ type: "agent_attempt", data: { name: friendlyName, attempt, maxAttempts } });
      }

      // <<< CORREÇÃO AQUI: A chamada que pode falhar está agora dentro de um try...catch >>>
      try {
        console.log(`[CortensorModel] Attempt ${attempt}/${maxAttempts}: Fetching results for task ${taskId}...`);
        const { results } = await this.getTaskResults(sessionId, taskId);

        if (results && results.length > 0) {
          const firstValidResult = results.find(r => r && r.trim() !== "");
          if (firstValidResult) {
            console.log(`[CortensorModel] ✅ Success on attempt ${attempt}. Found valid result for task ${taskId}.`);
            try {
              const parsed = JSON.parse(firstValidResult);
              return parsed.result || parsed.message || firstValidResult;
            } catch {
              return firstValidResult;
            }
          }
        }
        // Se o resultado for vazio, não fazemos nada, apenas esperamos a próxima tentativa.
      } catch (err) {
        // Se o erro for o 'panic' esperado, nós o registramos como um aviso e permitimos que o loop continue.
        if (err.message.includes("ARRAY_RANGE_ERROR") || err.code === 'CALL_EXCEPTION') {
          console.warn(`[CortensorModel] Attempt ${attempt} caught a transient RPC error (e.g., Panic). Retrying after delay...`);
        } else {
          // Se for um erro diferente e inesperado, o lançamos para cima para falhar a execução.
          console.error(`[CortensorModel] A critical error occurred: ${err.message}`);
          throw err;
        }
      }

      // Espera antes da próxima tentativa
      await new Promise(r => setTimeout(r, pollInterval));
    }

    // Se o loop terminar sem retornar um resultado, então o timeout ocorreu.
    throw new Error(`Timeout: No valid result found for task ${taskId} after ${maxAttempts} attempts.`);
  }
}

export default CortensorModel;