// lib/aiProvider.js
// Multi-model manager for text generation with retry logic.

import CortensorModel from "./models/CortensorModel.js";
import GeminiFlashModel from "./models/GeminiFlashModel.js";
import GeminiFlashLiteModel from "./models/GeminiFlashLiteModel.js";
import GeminiProModel from "./models/GeminiProModel.js";
import { LLM_MAX_ATTEMPTS } from "./constants.js"; // <<< IMPORTAÇÃO CORRIGIDA

const DEFAULT_PRIORITY = ["cortensor", "geminiflash", "geminiflashlite", "geminipro"];

const MODEL_REGISTRY = {
  cortensor: CortensorModel,
  geminiflash: GeminiFlashModel,
  geminiflashlite: GeminiFlashLiteModel,
  geminipro: GeminiProModel,
};

function buildPriorityFromEnv() {
  const raw = process.env.MODELS_PRIORITY;
  if (!raw) return DEFAULT_PRIORITY;
  const arr = raw.split(",").map(s => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : DEFAULT_PRIORITY;
}

let modelsPriority = buildPriorityFromEnv();
let modelInstances = null;

function initModelInstances() {
  if (modelInstances) return;
  modelInstances = modelsPriority.map(key => {
    const Cls = MODEL_REGISTRY[key];
    if (!Cls) {
      console.warn(`[aiProvider] No registered model class for key="${key}"`);
      return null;
    }
    try {
      return new Cls({ key });
    } catch (err) {
      console.error(`[aiProvider] Failed to instantiate model ${key}:`, err);
      return null;
    }
  }).filter(Boolean);
}


/**
 * generateText(params, opts)
 * - params: { prompt, maxTokens = 512, temperature = 0.7 }
 * - opts: optional object forwarded to model.generateText as second parameter (e.g. { executorJobId })
 *
 * Backwards-compatible: callers that don't provide opts behave exactly as before.
 */
export async function generateText({ prompt, maxTokens = 512, temperature = 0.7 } = {}, opts = {}) {
  if (!prompt || typeof prompt !== "string") throw new Error("prompt (string) is required");
  initModelInstances();
  if (!modelInstances || modelInstances.length === 0) {
    throw new Error("No model instances available.");
  }

  const errors = [];
  for (const model of modelInstances) {
    const key = model.key || "unknown";
    try {
      // Forward opts as second argument to model.generateText so models that support it can use it.
      // Models that do not declare/use a second parameter will simply ignore it (JS allows extra args).
      const out = await model.generateText({ prompt, maxTokens, temperature }, opts);
      if (typeof out === "string" && out.trim().length > 0) return out;
      errors.push({ model: key, reason: "empty response" });
    } catch (err) {
      errors.push({ model: key, reason: err.message || String(err) });
    }
  }

  const agg = errors.map(e => `${e.model}: ${e.reason}`).join(" | ");
  throw new Error(`All models failed. Details: ${agg}`);
}


/**
 * generateTextAndParseJson(promptParams, parseOptions = {}, generateOpts = {})
 * - promptParams: { prompt, maxTokens, temperature }
 * - parseOptions: { maxAttempts = LLM_MAX_ATTEMPTS, expectedShape = 'array' }
 * - generateOpts: optional object forwarded to generateText (e.g. { executorJobId })
 *
 * Returns { parsedJson, rawText } on success, otherwise throws after attempts.
 */
export async function generateTextAndParseJson(
  { prompt, maxTokens, temperature } = {},
  { maxAttempts = LLM_MAX_ATTEMPTS, expectedShape = 'array' } = {},
  generateOpts = {}
) {
  let lastError = null;
  let lastRawText = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxAttempts} to generate and parse JSON.`);
      const llmText = await generateText({ prompt, maxTokens, temperature }, generateOpts);
      lastRawText = llmText;

      let parsed = null;
      try {
        parsed = JSON.parse(llmText);
      } catch (e) {
        const first = llmText.indexOf(expectedShape === 'array' ? '[' : '{');
        const last = llmText.lastIndexOf(expectedShape === 'array' ? ']' : '}');
        if (first !== -1 && last > first) {
          parsed = JSON.parse(llmText.slice(first, last + 1));
        } else {
          throw new Error("Could not find valid JSON markers in the response.");
        }
      }

      const isCorrectShape = expectedShape === 'array' ? Array.isArray(parsed) : (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed));
      if (isCorrectShape) {
        return { parsedJson: parsed, rawText: lastRawText };
      } else {
        throw new Error(`Parsed content is not the expected shape ('${expectedShape}').`);
      }
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
    }
  }
  throw new Error(`LLM failed to produce valid JSON after ${maxAttempts} attempts. Last error: ${lastError.message}`);
}
