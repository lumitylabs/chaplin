// CortensorModel.js
import fs from "fs";
import path from "path";

const ABIS_DIR = path.join(process.cwd(), "abis");
const SESSION_V2_ABI = JSON.parse(fs.readFileSync(path.join(ABIS_DIR, "SessionV2.json"), "utf8"));
const SESSION_QUEUE_V2_ABI = JSON.parse(fs.readFileSync(path.join(ABIS_DIR, "SessionQueueV2.json"), "utf8"));

class CortensorModel {
  constructor(config = {}) {
    this.name = "cortensor";
    this.rpcUrl = config.rpcUrl || process.env.CORTENSOR_RPC_URL;
    this.sessionAddress = config.sessionAddress || process.env.SESSION_V2_ADDRESS;
    this.queueAddress = config.queueAddress || process.env.SESSION_QUEUE_V2_ADDRESS;
    this.privateKey = config.privateKey || process.env.CORTENSOR_PRIVATE_KEY;
    this.sessionIdEnv = config.sessionId || process.env.CORTENSOR_SESSION_ID || null;
    this.defaultSessionParams = config.defaultSessionParams || {};
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

  async _waitForSessionCreated(txHash) {
    const ethers = await this._importEthers();
    console.log(`[CortensorModel] Waiting for transaction ${txHash} to be mined...`);
    const receipt = await this._provider.waitForTransaction(txHash, 1, 120000); 
    if (!receipt) throw new Error(`Transaction receipt not found for tx ${txHash}`);
    if (receipt.status === 0) throw new Error(`Transaction ${txHash} failed (reverted)`);

    const iface = new ethers.Interface(SESSION_V2_ABI);

    for (const log of receipt.logs) {

      if (log.address.toLowerCase() === this.sessionAddress.toLowerCase()) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === "SessionCreated") {
            const sessionId = Number(parsed.args.sessionId.toString());
            console.log(`[CortensorModel] Event 'SessionCreated' parsed successfully! Session ID: ${sessionId}`);
            return sessionId;
          }
        } catch (e) {

        }
      }
    }

    console.warn("[CortensorModel] Could not parse event from receipt logs, trying fallback with queryFilter...");
    const ownerAddress = await this._signer.getAddress();
    const filter = this._sessionContract.filters.SessionCreated(null, null, ownerAddress);
    const latestBlock = await this._provider.getBlockNumber();
    const events = await this._sessionContract.queryFilter(filter, latestBlock - 100, 'latest');
    
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.transactionHash === txHash) {
          const sessionId = Number(lastEvent.args.sessionId.toString());
          console.log(`[CortensorModel] Fallback successful! Found Session ID: ${sessionId}`);
          return sessionId;
      }
    }

    throw new Error(`SessionCreated event not found or parsed for TxHash: ${txHash}`);
  }
async checkSessionHealth(sessionId) {
    await this._initProviderAndSigner();
    console.log(`[CortensorModel] Checking health of session ${sessionId}...`);

    try {

        const session = await this._sessionContract.getSession(sessionId);
        

        const ephemeralNodes = session.ephemeralNodes;
        const dedicatedNodes = session.dedicatedNodes;
        const totalNodes = ephemeralNodes.length + dedicatedNodes.length;
        
        const minNumOfNodes = Number(session.minNumOfNodes.toString());

        console.log(`[CortensorModel] Session Health Report for ID ${sessionId}:`);
        console.log(`  - Minimum nodes required: ${minNumOfNodes}`);
        console.log(`  - Ephemeral nodes connected: ${ephemeralNodes.length}`);
        console.log(`  - Dedicated nodes connected: ${dedicatedNodes.length}`);
        console.log(`  - Total nodes connected: ${totalNodes}`);

        if (totalNodes < minNumOfNodes) {
            console.error(`[CortensorModel] ❌ Health Check Failed: Not enough nodes are connected to the session. (Connected: ${totalNodes}, Required: ${minNumOfNodes})`);
            return false;
        }

        console.log(`[CortensorModel] ✅ Health Check Passed: Session is ready for tasks.`);
        return true;

    } catch (e) {
        console.error(`[CortensorModel] ❌ Failed to check session health:`, e.message);
        return false;
    }
}

  async createSession() {
    await this._initProviderAndSigner();

    console.log("[CortensorModel] Creating a new session...");
    const params = {
      name: "Generated Session",
      metadata: "Created by backend",
      variableAddress: await this._signer.getAddress(),
      minNumOfNodes: 1,
      maxNumOfNodes: 3,
      redundant: 1,
      numOfValidatorNodes: 0,
      mode: 0, 
      reserveEphemeralNodes: false,
      sla: 0,
      modelIdentifier: 9,
      reservePeriod: 300,
      maxTaskExecutionCount: 5, 
      ...this.defaultSessionParams,
    };
    
    const tx = await this._sessionContract.create(...Object.values(params));
    console.log(`[CortensorModel] Session creation transaction sent. Hash: ${tx.hash}`);

    const sid = await this._waitForSessionCreated(tx.hash);
    console.log(`[CortensorModel] Session created successfully. ID=${sid}`);
    this.sessionIdEnv = sid; 
    return sid;
  }
  
  async getSessionId() {
      await this._initProviderAndSigner();
      if (this.sessionIdEnv) {
          console.log(`[CortensorModel] Using existing session ID: ${this.sessionIdEnv}`);
          return Number(this.sessionIdEnv);
      }

      return await this.createSession();
  }


  async submitTask(sessionId, promptText) {
  await this._initProviderAndSigner();
  const taskData = JSON.stringify({data:promptText.prompt});
  
  const llmParams = [512, 70, 100, 40, 100, 0, 0];

  console.log(`[CortensorModel] Submitting task for session ${sessionId}...`);

  // ========================== A CORREÇÃO ESTÁ AQUI ==========================
  const tx = await this._sessionContract.submit(
    Number(sessionId),
    0, // nodeType 
    promptText.prompt,
    1, // promptType 
    "", // promptTemplate
    llmParams,
    [90,0,0,0,0,0],
    "my-client-side-reference"
  );
  // ========================================================================
  
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
    const [miners, results] = await this._sessionContract.getTaskResults(Number(sessionId), Number(taskId));
    return { miners, results };
  }

  async generateText(prompt) {
    await this._initProviderAndSigner();
    const sessionId = await this.getSessionId();

    const { taskId } = await this.submitTask(sessionId, prompt);

    let attempts = 0;
    const maxAttempts = 20; // ~200 segundos
    const pollInterval = 10000; // 10 segundos

    console.log(`[CortensorModel] Polling for the first available result of Task ID ${taskId}...`);
    while (attempts < maxAttempts) {

      const { miners, results } = await this.getTaskResults(sessionId, taskId);
      

      if (results && results.length > 0) {

        const firstValidResult = results.find(result => result && result.trim() !== "");

        if (firstValidResult) {

          const minerIndex = results.indexOf(firstValidResult);
          const respondingMiner = miners[minerIndex] || 'unknown';
          console.log(`[CortensorModel] First result received for Task ${taskId} from miner: ${respondingMiner}`);
          
          try {
            const parsedResult = JSON.parse(firstValidResult);
            return parsedResult.result || parsedResult.message || firstValidResult;
          } catch (e) {

            return firstValidResult;
          }
        }
      }
      // =================================================================

      attempts++;
      console.log(`[CortensorModel] Attempt ${attempts}/${maxAttempts}: No result yet. Waiting ${pollInterval / 1000}s...`);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error(`Timeout waiting for result of task ${taskId} in session ${sessionId}.`);
  }
}

export default CortensorModel;