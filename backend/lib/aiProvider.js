// lib/aiProvider.js
// Multi-model manager for text generation with retry logic.

import CortensorModel from "./models/CortensorModel.js";
import GeminiFlashModel from "./models/GeminiFlashModel.js";
import GeminiFlashLiteModel from "./models/GeminiFlashModel.js";
import GeminiProModel from "./models/GeminiProModel.js";
import { LLM_MAX_ATTEMPTS } from "./constants.js"; // <<< IMPORTAÇÃO CORRIGIDA

const DEFAULT_PRIORITY = ["geminiflash", "geminiflashlite", "geminipro", "cortensor"];

const MODEL_REGISTRY = {
  geminiflash: GeminiFlashModel,
  geminiflashlite: GeminiFlashLiteModel,
  geminipro: GeminiProModel,
  cortensor: CortensorModel,
  
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


export async function generateText({ prompt, maxTokens = 512, temperature = 0.7 } = {}) {
  if (!prompt || typeof prompt !== "string") throw new Error("prompt (string) is required");
  initModelInstances();
  if (!modelInstances || modelInstances.length === 0) {
    throw new Error("No model instances available.");
  }

  const errors = [];
  for (const model of modelInstances) {
    const key = model.key || "unknown";
    try {
      const out = await model.generateText({ prompt, maxTokens, temperature });
      if (typeof out === "string" && out.trim().length > 0) return out;
      errors.push({ model: key, reason: "empty response" });
    } catch (err) {
      errors.push({ model: key, reason: err.message || String(err) });
    }
  }

  const agg = errors.map(e => `${e.model}: ${e.reason}`).join(" | ");
  throw new Error(`All models failed. Details: ${agg}`);
}


export async function generateTextAndParseJson(
  { prompt, maxTokens, temperature },
  { maxAttempts = LLM_MAX_ATTEMPTS, expectedShape = 'array' } = {} // <<< USA A CONSTANTE CORRETA
) {
  let lastError = null;
  let lastRawText = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxAttempts} to generate and parse JSON.`);
      const llmText = await generateText({ prompt, maxTokens, temperature });
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