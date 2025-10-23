// lib/workgroupEngine.js

import { generateText } from "./aiProvider.js";
import { buildAgentExecutionPrompt } from "../prompts/runWorkgroupPrompt.js";
import buildHardcodedIntegratorPrompt from "../prompts/integrator.js";

function normName(name) {
  return String(name || "").trim().toLowerCase();
}

/**
 * Runs agents sequentially, skipping those already present in workgroupResponseMap.
 *
 * Parameters:
 *  - input: user input string
 *  - workgroup: array [{ name, prompt }, ...] (order matters)
 *  - workgroupResponseMap: object { "AgentName": "output", ... } (may be empty)
 *  - options:
 *      - stopAtAgentName: string | null. If provided, run up to and including this agent (but still skip already answered).
 *      - maxTokens, temperature for generateText
 *      - executorJobId: optional string - if present, will be forwarded to generateText as part of opts (so models can write progress)
 *
 * Returns:
 *  {
 *    updatedWorkgroupResponse: { name: output, ... }, // merged original + newly generated
 *    generated: [ { name, output }, ... ], // only newly generated in this call (in order)
 *    perAgent: [ { name, output }, ... ] // final outputs in order (including prefilled)
 *  }
 */
export async function runAgentsSequentially({ input, workgroup, workgroupResponseMap = {}, options = {} }) {
  const { stopAtAgentName = null, maxTokens = 800, temperature = 0.7, executorJobId = null } = options;

  // Map normal names -> original names for matching
  const normalizedMap = {};
  Object.keys(workgroupResponseMap || {}).forEach(k => {
    normalizedMap[normName(k)] = workgroupResponseMap[k];
  });

  const updatedMap = { ...workgroupResponseMap }; // will be mutated
  const generated = [];
  const perAgent = [];

  // Determine stopAt normalized if provided
  const stopNorm = stopAtAgentName ? normName(stopAtAgentName) : null;

  for (let i = 0; i < workgroup.length; i++) {
    const agent = workgroup[i];
    const agentNorm = normName(agent.name);

    // If already present in incoming map, use it and continue (but include in perAgent)
    if (normalizedMap[agentNorm]) {
      const out = normalizedMap[agentNorm];
      perAgent.push({ name: agent.name, output: out, source: "prefilled" });
      // Ensure updatedMap has original key name (preserve provided key)
      const existingKey = Object.keys(workgroupResponseMap || {}).find(k => normName(k) === agentNorm) || agent.name;
      updatedMap[existingKey] = out;
      if (stopNorm && agentNorm === stopNorm) {
        return { updatedWorkgroupResponse: updatedMap, generated, perAgent };
      }
      continue;
    }

    // Not present -> must generate this agent now
    const agentPrompt = buildAgentExecutionPrompt({
      agent,
      input,
      previousOutputs: perAgent.map(p => p.output) // pass only outputs in order
    });

    // Pass executorJobId (if any) as opts to generateText so models (like Cortensor) can write progress.
    const generateOpts = executorJobId ? { executorJobId, agentName: agent.name } : undefined;
    const out = await generateText({ prompt: agentPrompt, maxTokens, temperature }, generateOpts);

    // Save in maps
    updatedMap[agent.name] = out;
    normalizedMap[agentNorm] = out;

    generated.push({ name: agent.name, output: out });
    perAgent.push({ name: agent.name, output: out, source: "generated" });

    // If stopAtAgentName is set and we've just executed it, stop
    if (stopNorm && agentNorm === stopNorm) {
      break;
    }
  }

  return { updatedWorkgroupResponse: updatedMap, generated, perAgent };
}

export async function* executeWorkgroupStream({ input, workgroup, workgroupResponseMap = {}, responseformat, options = {} }) {
  const {
    maxTokens = 800, temperature = 0.7,
    integratorMaxAttempts = 3, integratorMaxTokens = 900, integratorTemperature = 0.5,
    executorJobId = null
  } = options;

  let finalPerAgent = [];

  // --- Etapa 1: Execução dos Agentes ---
  for (const agent of workgroup) {
    const agentNorm = normName(agent.name);
    
    // Notify agent started (stream chunk)
    yield { type: 'agent_start', data: { name: agent.name }};

    const agentPrompt = buildAgentExecutionPrompt({ agent, input, previousOutputs: finalPerAgent.map(p => p.output) });

    // pass executorJobId (if present) so model can record attempt progress into DB
    const generateOpts = executorJobId ? { executorJobId, agentName: agent.name } : undefined;
    const output = await generateText({ prompt: agentPrompt, maxTokens, temperature }, generateOpts);

    const result = { name: agent.name, output, source: "generated" };
    finalPerAgent.push(result);
    
    yield { type: 'agent_result', data: result };
  }

  // --- Etapa 2: Execução do Integrador ---
  yield { type: 'integrator_start' };
  
  const outputsInOrder = finalPerAgent.map(p => p.output);
  const requiredKeys = Object.keys(responseformat || {}).sort();

  let attempt = 0, lastRaw = null, finalParsed = null, validation = null;
  
  while (attempt < integratorMaxAttempts) {
    attempt++;
    const integratorPrompt = buildHardcodedIntegratorPrompt({ responseformat, outputs: outputsInOrder, workgroup });

    const integratorGenerateOpts = executorJobId ? { executorJobId, agentName: "Integrator", attempt, maxAttempts: integratorMaxAttempts } : undefined;
    lastRaw = await generateText({ prompt: integratorPrompt, maxTokens: integratorMaxTokens, temperature: integratorTemperature }, integratorGenerateOpts);
    
    let parsed = null;
    try {
      const firstBrace = lastRaw.indexOf("{");
      const lastBrace = lastRaw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(lastRaw.slice(firstBrace, lastBrace + 1));
      }
    } catch (e) {}

    if (parsed && typeof parsed === "object") {
      const parsedKeys = Object.keys(parsed).sort();
      const missing = requiredKeys.filter(k => !parsedKeys.includes(k));
      const extras = parsedKeys.filter(k => !requiredKeys.includes(k));

      if (missing.length === 0 && extras.length === 0) {
        finalParsed = parsed;
        validation = { success: true, attempts: attempt };
        break; // Sucesso
      } else {
        validation = { missing_keys: missing, extra_keys: extras };
      }
    } else {
      validation = { parse_error: "Integrator output not parseable as JSON object." };
    }
  }
  
  const finalResult = {
    final: finalParsed || { error: "Integrator failed after all attempts.", raw: lastRaw },
    validation,
    attempts: attempt,
  };
  yield { type: 'integrator_result', data: finalResult };
}

/**
 * Runs whole workgroup filling missing outputs (skipping prefilled), then runs hardcoded Integrator.
 *
 * - input
 * - workgroup
 * - workgroupResponseMap: { name: output } (can be empty)
 * - responseformat: object (keys->descriptions) required by integrator
 * - options: maxAttempts (integrator), generateText params, executorJobId (forwarded)
 *
 * Returns:
 * {
 *   perAgent: [ { name, output, source }, ... ], // full ordering (prefilled + generated)
 *   generated: [ { name, output } ... ], // those created now
 *   final: parsed JSON or object with parse_error & raw if failed after attempts,
 *   validation: info about missing/extra keys or success,
 *   attempts: number,
 *   lastRaw: string (last integrator raw output)
 * }
 */
export async function runWorkgroupAndIntegrate({ input, workgroup, workgroupResponseMap = {}, responseformat, options = {} }) {
  const {
    maxTokens = 800,
    temperature = 0.7,
    integratorMaxAttempts = 3,
    integratorMaxTokens = 900,
    integratorTemperature = 0.5,
    executorJobId = null
  } = options;

  // First, run agents sequentially to fill missing ones
  const runResult = await runAgentsSequentially({
    input,
    workgroup,
    workgroupResponseMap,
    options: { maxTokens, temperature, executorJobId }
  });

  const perAgent = runResult.perAgent; // includes prefilled + generated, in order
  const generated = runResult.generated;
  const updatedMap = runResult.updatedWorkgroupResponse;

  // Prepare outputs array for integrator (strings in order)
  const outputsInOrder = perAgent.map(p => p.output);

  // Build strict required keys
  const requiredKeys = Object.keys(responseformat || {}).map(String).sort();

  // Attempt integrator up to integratorMaxAttempts times
  let attempt = 0;
  let lastRaw = null;
  let finalParsed = null;
  let validation = null;

  while (attempt < integratorMaxAttempts) {
    attempt++;
    const integratorPrompt = buildHardcodedIntegratorPrompt({
      responseformat,
      outputs: outputsInOrder,
      workgroup
    });

    const finalRaw = await generateText({
      prompt: integratorPrompt,
      maxTokens: integratorMaxTokens,
      temperature: integratorTemperature
    }, executorJobId ? { executorJobId, agentName: "Integrator", attempt, maxAttempts: integratorMaxAttempts } : undefined);
    lastRaw = finalRaw;

    // Try parse
    let parsed = null;
    try {
      parsed = JSON.parse(finalRaw);
    } catch (err) {
      // attempt to extract first JSON object
      const firstBrace = finalRaw.indexOf("{");
      const lastBrace = finalRaw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const maybe = finalRaw.slice(firstBrace, lastBrace + 1);
        try {
          parsed = JSON.parse(maybe);
        } catch (err2) {
          parsed = null;
        }
      } else {
        parsed = null;
      }
    }

    if (!parsed || typeof parsed !== "object") {
      validation = { parse_error: "Integrator output not parseable as JSON" };
      if (attempt >= integratorMaxAttempts) {
        finalParsed = { parse_error: "Integrator failed to produce valid JSON after attempts", raw: lastRaw };
        break;
      } else {
        continue;
      }
    }

    // Validate exact keys: no missing, no extras
    const parsedKeys = Object.keys(parsed).map(String).sort();
    const missing = requiredKeys.filter(k => !parsedKeys.includes(k));
    const extras = parsedKeys.filter(k => !requiredKeys.includes(k));

    if (missing.length === 0 && extras.length === 0) {
      finalParsed = parsed;
      validation = { success: true, attempts: attempt };
      break;
    } else {
      validation = { missing_keys: missing, extra_keys: extras };
      if (attempt >= integratorMaxAttempts) {
        finalParsed = { ...parsed, _validation: validation, raw: lastRaw };
        break;
      }
      // otherwise loop and retry
    }
  }

  return {
    perAgent,
    generated,
    updatedWorkgroupResponse: updatedMap,
    final: finalParsed,
    validation,
    attempts: attempt,
    lastRaw
  };
}
