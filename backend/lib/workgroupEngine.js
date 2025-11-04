import { generateText, generateTextAndParseJson } from "./aiProvider.js";
import { LLM_MAX_ATTEMPTS } from "./constants.js";
import { buildAgentExecutionPrompt } from "../prompts/runWorkgroupPrompt.js";
import buildHardcodedIntegratorPrompt from "../prompts/integrator.js";

// Função auxiliar para normalizar nomes de agentes
function normName(name) {
  return String(name || "").trim().toLowerCase();
}

// O gerador de stream é a função principal que precisa estar correta.
export async function* executeWorkgroupStream({ input, description, instructions, workgroup, responseformat, options = {} }) {
  const {
    maxTokens = 800, temperature = 0.7,
    integratorMaxAttempts = 3, integratorMaxTokens = 900, integratorTemperature = 0.5,
    executorJobId = null, onProgress = null, existingProgress = [],
  } = options;

  let finalPerAgent = [];

  // Lógica para retomar um job a partir de resultados existentes
  const existingAgentResults = new Map(
    existingProgress.filter(p => p.type === 'agent_result' && p.data?.name).map(p => [normName(p.data.name), p.data])
  );
  
  if (existingAgentResults.size > 0) {
    console.log(`[workgroupEngine] Retomando job. Encontrados ${existingAgentResults.size} resultados de agentes pré-existentes.`);
  }

  // Loop principal para executar cada agente em sequência
  for (const agent of workgroup) {
    const agentNorm = normName(agent.name);
    
    // Pula agentes que já têm um resultado (parte da lógica de 'retry job')
    if (existingAgentResults.has(agentNorm)) {
      const existingResult = existingAgentResults.get(agentNorm);
      console.log(`[workgroupEngine] Pulando agente '${agent.name}' pois já possui resultado.`);
      yield { type: 'agent_start', data: { name: agent.name } };
      finalPerAgent.push(existingResult);
      yield { type: 'agent_result', data: existingResult };
      continue;
    }

    // Inicia a execução do agente
    yield { type: 'agent_start', data: { name: agent.name } };
    const agentPrompt = buildAgentExecutionPrompt({ agent, input, previousOutputs: finalPerAgent.map(p => p.output) });
    const generateOpts = { executorJobId, agentName: agent.name, onProgress };

    let output = null;
    let lastError = null;

    // Loop de retry para o agente. Damos ao agente até 3 chances de sucesso.
    // Cada chance invoca o CortensorModel, que tem seu próprio loop interno de 2 minutos.
    for (let attempt = 1; attempt <= LLM_MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`[workgroupEngine] Executando agente '${agent.name}', Tentativa ${attempt}/${LLM_MAX_ATTEMPTS}`);
        
        // Chamamos generateText. Esta chamada agora é robusta e pode demorar até 2 minutos.
        output = await generateText({ prompt: agentPrompt, maxTokens, temperature }, generateOpts);
        
        // Se recebermos uma resposta válida, o agente teve sucesso.
        if (output && output.trim() !== "") {
          console.log(`[workgroupEngine] Agente '${agent.name}' teve sucesso na tentativa ${attempt}.`);
          break; // Sai do loop de retry
        }
        
        // Se a resposta for vazia, tratamos como uma falha para forçar uma nova tentativa.
        throw new Error("Received empty response from the model.");

      } catch (err) {
        // Se CortensorModel atingir o timeout ou tiver um erro crítico, este catch será acionado.
        console.warn(`[workgroupEngine] Agente '${agent.name}' falhou na tentativa ${attempt}: ${err.message}`);
        lastError = err;
        // O loop continuará para a próxima tentativa.
      }
    }

    // Se após todas as tentativas do workgroupEngine ainda não houver resultado, o agente falhou definitivamente.
    if (!output) {
      const errorMessage = `Agente '${agent.name}' falhou após ${LLM_MAX_ATTEMPTS} tentativas. Último erro: ${lastError?.message || 'Unknown error'}`;
      yield { type: 'agent_error', data: { name: agent.name, error: errorMessage } };
      // Lançar o erro aqui encerra o processamento do job.
      throw new Error(errorMessage);
    }

    const result = { name: agent.name, output, source: "generated" };
    finalPerAgent.push(result);
    yield { type: 'agent_result', data: result };
  }

  // Lógica do Integrador (esta parte já estava correta, usando a função robusta com retries)
  yield { type: 'integrator_start' };
  try {
    const outputsInOrder = finalPerAgent.map(p => p.output);
    const integratorPrompt = buildHardcodedIntegratorPrompt({ responseformat, outputs: outputsInOrder, workgroup, description, instructions, input });
    const integratorGenerateOpts = { executorJobId, agentName: "Integrator", sessionSize: 'big', onProgress };

    const { parsedJson, rawText } = await generateTextAndParseJson(
        { prompt: integratorPrompt, maxTokens: integratorMaxTokens, temperature: integratorTemperature },
        { retries: integratorMaxAttempts, expectedShape: 'object' },
        integratorGenerateOpts
    );

    const finalResult = { final: parsedJson, validation: { success: true }, raw: rawText };
    yield { type: 'integrator_result', data: finalResult };
  } catch (error) {
    const errorMessage = `Integrator failed after all attempts: ${error.message}`;
    console.error(`[workgroupEngine] ${errorMessage}`);
    const finalResult = { final: { error: errorMessage }, validation: { success: false }, attempts: integratorMaxAttempts };
    yield { type: 'integrator_result', data: finalResult };
    throw new Error(errorMessage);
  }
}

// A função runAgentsSequentially não é usada pelo seu worker principal, mas é bom mantê-la consistente.
export async function runAgentsSequentially({ input, workgroup, workgroupResponseMap = {}, options = {} }) {
  const { stopAtAgentName = null, maxTokens = 800, temperature = 0.7, executorJobId = null, onProgress = null } = options;
  let finalPerAgent = [];
  const updatedMap = { ...workgroupResponseMap };

  // Esta parte do código não precisou de mudanças significativas, o loop de retry já estava ok.
  for (const agent of workgroup) {
    const agentPrompt = buildAgentExecutionPrompt({ agent, input, previousOutputs: finalPerAgent.map(p => p.output) });
    const generateOpts = { executorJobId, agentName: agent.name, onProgress };

    let output = null;
    let lastError = null;
    for (let attempt = 1; attempt <= LLM_MAX_ATTEMPTS; attempt++) {
      try {
        output = await generateText({ prompt: agentPrompt, maxTokens, temperature }, generateOpts);
        if (output && output.trim() !== "") break;
        throw new Error("Received empty response.");
      } catch (err) {
        lastError = err;
      }
    }

    if (!output) {
      throw new Error(`Agente '${agent.name}' falhou após ${LLM_MAX_ATTEMPTS} tentativas. Último erro: ${lastError?.message}`);
    }
    
    updatedMap[agent.name] = output;
    finalPerAgent.push({ name: agent.name, output, source: 'generated' });
  }

  return { updatedWorkgroupResponse: updatedMap, perAgent: finalPerAgent };
}