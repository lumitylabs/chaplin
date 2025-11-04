import { generateText, generateTextAndParseJson } from "./aiProvider.js";
import { LLM_MAX_ATTEMPTS } from "./constants.js";
import { buildAgentExecutionPrompt } from "../prompts/runWorkgroupPrompt.js";
import buildHardcodedIntegratorPrompt from "../prompts/integrator.js";

function normName(name) {
  return String(name || "").trim().toLowerCase();
}

export async function runAgentsSequentially({ input, workgroup, workgroupResponseMap = {}, options = {} }) {
  const { stopAtAgentName = null, maxTokens = 800, temperature = 0.7, executorJobId = null, onProgress = null } = options;

  const normalizedMap = {};
  Object.keys(workgroupResponseMap || {}).forEach(k => {
    normalizedMap[normName(k)] = workgroupResponseMap[k];
  });

  const updatedMap = { ...workgroupResponseMap };
  const generated = [];
  const perAgent = [];

  const stopNorm = stopAtAgentName ? normName(stopAtAgentName) : null;

  for (let i = 0; i < workgroup.length; i++) {
    const agent = workgroup[i];
    const agentNorm = normName(agent.name);

    if (normalizedMap[agentNorm]) {
      const out = normalizedMap[agentNorm];
      perAgent.push({ name: agent.name, output: out, source: "prefilled" });
      const existingKey = Object.keys(workgroupResponseMap || {}).find(k => normName(k) === agentNorm) || agent.name;
      updatedMap[existingKey] = out;
      if (stopNorm && agentNorm === stopNorm) {
        return { updatedWorkgroupResponse: updatedMap, generated, perAgent };
      }
      continue;
    }

    const agentPrompt = buildAgentExecutionPrompt({ agent, input, previousOutputs: perAgent.map(p => p.output) });
    const generateOpts = { executorJobId, agentName: agent.name, onProgress };

    // <<< MUDANÇA: Adicionado loop de retry para robustez em cada agente >>>
    let output = null;
    let lastError = null;
    for (let attempt = 1; attempt <= LLM_MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`[workgroupEngine] Agente '${agent.name}', Tentativa ${attempt}/${LLM_MAX_ATTEMPTS}`);
            output = await generateText({ prompt: agentPrompt, maxTokens, temperature }, generateOpts);
            if (output) break; // Sucesso, sai do loop
        } catch (err) {
            console.warn(`[workgroupEngine] Agente '${agent.name}' falhou na tentativa ${attempt}: ${err.message}`);
            lastError = err;
        }
    }

    if (!output) {
        // Se todas as tentativas falharem, lança o último erro capturado
        throw new Error(`Agente '${agent.name}' falhou após ${LLM_MAX_ATTEMPTS} tentativas. Último erro: ${lastError.message}`);
    }

    updatedMap[agent.name] = output;
    normalizedMap[agentNorm] = output;

    generated.push({ name: agent.name, output: output });
    perAgent.push({ name: agent.name, output: output, source: "generated" });

    if (stopNorm && agentNorm === stopNorm) {
      break;
    }
  }

  return { updatedWorkgroupResponse: updatedMap, generated, perAgent };
}


export async function* executeWorkgroupStream({ input, description, instructions, workgroup, workgroupResponseMap = {}, responseformat, options = {} }) {
  const {
    maxTokens = 800, temperature = 0.7,
    integratorMaxAttempts = 3, integratorMaxTokens = 900, integratorTemperature = 0.5,
    executorJobId = null,
    onProgress = null
  } = options;

  let finalPerAgent = [];

  for (const agent of workgroup) {
    yield { type: 'agent_start', data: { name: agent.name }};

    const agentPrompt = buildAgentExecutionPrompt({ agent, input, previousOutputs: finalPerAgent.map(p => p.output) });
    const generateOpts = { executorJobId, agentName: agent.name, onProgress };

    // <<< MUDANÇA: Adicionado loop de retry para robustez em cada agente >>>
    let output = null;
    let lastError = null;
    for (let attempt = 1; attempt <= LLM_MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`[workgroupEngine] Agente '${agent.name}', Tentativa ${attempt}/${LLM_MAX_ATTEMPTS}`);
            output = await generateText({ prompt: agentPrompt, maxTokens, temperature }, generateOpts);
            if (output) break; // Sucesso
        } catch (err) {
            console.warn(`[workgroupEngine] Agente '${agent.name}' falhou na tentativa ${attempt}: ${err.message}`);
            lastError = err;
        }
    }

    if (!output) {
       const errorMessage = `Agente '${agent.name}' falhou após ${LLM_MAX_ATTEMPTS} tentativas. Último erro: ${lastError.message}`;
       yield { type: 'agent_error', data: { name: agent.name, error: errorMessage } };
       // Lançar o erro encerra o stream e o processo
       throw new Error(errorMessage);
    }

    const result = { name: agent.name, output, source: "generated" };
    finalPerAgent.push(result);
    
    yield { type: 'agent_result', data: result };
  }

  yield { type: 'integrator_start' };
  
  const outputsInOrder = finalPerAgent.map(p => p.output);
  let finalResult = null;
  
  // <<< MUDANÇA: Substituído o loop 'while' manual por uma única chamada à função robusta >>>
  try {
    const integratorPrompt = buildHardcodedIntegratorPrompt({ responseformat, outputs: outputsInOrder, workgroup, description, instructions, input });

    const integratorGenerateOpts = {
        executorJobId,
        agentName: "Integrator",
        sessionSize: 'big',
        onProgress,
    };

    const { parsedJson, rawText } = await generateTextAndParseJson(
        { prompt: integratorPrompt, maxTokens: integratorMaxTokens, temperature: integratorTemperature },
        { retries: integratorMaxAttempts, expectedShape: 'object' },
        integratorGenerateOpts
    );

    // Se chegou aqui, o JSON é válido e tem o formato correto
    finalResult = {
        final: parsedJson,
        validation: { success: true },
        // A contagem de tentativas agora é interna ao aiProvider, mas podemos indicar sucesso.
        attempts: 'N/A (Sucesso dentro dos retries)',
        raw: rawText
    };
  } catch (error) {
    console.error(`[workgroupEngine] O Integrador falhou em todas as tentativas: ${error.message}`);
    finalResult = {
        final: { error: `Integrator failed after all attempts: ${error.message}` },
        validation: { success: false, error: error.message },
        attempts: integratorMaxAttempts,
    };
  }
  
  yield { type: 'integrator_result', data: finalResult };
}


// <<< MUDANÇA: Esta função foi inteiramente refatorada para usar a nova lógica >>>
export async function runWorkgroupAndIntegrate({ input, workgroup, workgroupResponseMap = {}, responseformat, options = {} }) {
  const {
    maxTokens = 800,
    temperature = 0.7,
    integratorMaxAttempts = 3,
    integratorMaxTokens = 900,
    integratorTemperature = 0.5,
    executorJobId = null,
    onProgress = null
  } = options;

  // 1. Executa os agentes em sequência (a função já foi corrigida acima com retries)
  const runResult = await runAgentsSequentially({
    input,
    workgroup,
    workgroupResponseMap,
    options: { maxTokens, temperature, executorJobId, onProgress }
  });

  const outputsInOrder = runResult.perAgent.map(p => p.output);
  
  let finalParsed = null;
  let validation = null;
  let lastRaw = null;

  // 2. Executa o Integrador usando a função com retry e parse automático
  try {
      const integratorPrompt = buildHardcodedIntegratorPrompt({ responseformat, outputs: outputsInOrder, workgroup });
      const integratorGenerateOpts = { executorJobId, agentName: "Integrator", sessionSize: 'big', onProgress };

      const { parsedJson, rawText } = await generateTextAndParseJson(
          { prompt: integratorPrompt, maxTokens: integratorMaxTokens, temperature: integratorTemperature },
          { retries: integratorMaxAttempts, expectedShape: 'object' },
          integratorGenerateOpts
      );
      
      finalParsed = parsedJson;
      validation = { success: true };
      lastRaw = rawText;

  } catch (error) {
      console.error(`[workgroupEngine] O Integrador falhou em todas as tentativas: ${error.message}`);
      finalParsed = { error: `Integrator failed: ${error.message}` };
      validation = { success: false, error: error.message };
  }

  return {
    ...runResult,
    final: finalParsed,
    validation,
    lastRaw
  };
}