// lib/aiProvider.js
//
// Multi-model manager for text generation. Tries models in priority order until one succeeds.
// Exports:
//   - async generateText({ prompt, maxTokens, temperature }) -> string
//   - setModelsPriority(arrayOfKeys) // optional runtime override
//
// Model implementations are located under lib/models/ and must implement:
//   - constructor(opts)
//   - key (string) unique identifier
//   - async generateText({ prompt, maxTokens, temperature }) -> string
//
// Default priority is read from process.env.MODELS_PRIORITY (comma-separated keys) or fallbacks to:
//   ['cortensor','geminiflash','geminipro']

import CortensorModel from "./models/CortensorModel.js";
import GeminiFlashModel from "./models/GeminiFlashModel.js";
import GeminiProModel from "./models/GeminiProModel.js";

const DEFAULT_PRIORITY = ["cortensor", "geminiflash", "geminipro"];

// registry maps keys -> class (not instance)
const MODEL_REGISTRY = {
  cortensor: CortensorModel,
  // geminiflash: GeminiFlashModel,
  // geminipro: GeminiProModel,
};

function buildPriorityFromEnv() {
  const raw = process.env.MODELS_PRIORITY;
  if (!raw) return DEFAULT_PRIORITY;
  try {
    const arr = raw.split(",").map(s => s.trim()).filter(Boolean);
    if (arr.length === 0) return DEFAULT_PRIORITY;
    return arr;
  } catch (e) {
    return DEFAULT_PRIORITY;
  }
}

let modelsPriority = buildPriorityFromEnv();

// instantiate model instances (lazy)
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

// public API: override priority at runtime
export function setModelsPriority(arr) {
  if (!Array.isArray(arr)) throw new Error("setModelsPriority expects an array");
  modelsPriority = arr;
  modelInstances = null;
  initModelInstances();
}

// primary function
export async function generateText({ prompt, maxTokens = 512, temperature = 0.7 } = {}) {
  if (!prompt || typeof prompt !== "string") throw new Error("prompt (string) is required");
  initModelInstances();
  if (!modelInstances || modelInstances.length === 0) {
    throw new Error("No model instances available. Register models in lib/models and set MODELS_PRIORITY env var if needed.");
  }

  const errors = [];
  for (const model of modelInstances) {
    const key = model.key || model.constructor?.name || "unknown";
    try {
      const out = await model.generateText({ prompt, maxTokens, temperature });
      if (typeof out === "string" && out.trim().length > 0) {
        // success
        return out;
      } else if (typeof out === "string") {
        // empty string — treat as error
        errors.push({ model: key, reason: "empty response" });
      } else {
        // non-string
        errors.push({ model: key, reason: "non-string response" });
      }
    } catch (err) {
      errors.push({ model: key, reason: String(err && err.message ? err.message : err) });
      // continue to next model
    }
  }

  const agg = errors.map(e => `${e.model}: ${e.reason}`).join(" | ");
  const message = `All models failed. Attempts: ${errors.length}. Details: ${agg}`;
  const err = new Error(message);
  err.details = errors;
  throw err;
}

export default {
  generateText,
  setModelsPriority,
};
