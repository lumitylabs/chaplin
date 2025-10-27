// lib/aiProvider.js
// Multi-model manager for text generation with retry logic.

import CortensorModel from "./models/CortensorModel.js";
import GeminiFlashModel from "./models/GeminiFlashModel.js";
import GeminiFlashLiteModel from "./models/GeminiFlashLiteModel.js";
import GeminiProModel from "./models/GeminiProModel.js";
import { LLM_MAX_ATTEMPTS } from "./constants.js"; // <<< IMPORTAÇÃO CORRIGIDA
import { jsonrepair } from "jsonrepair";
import JSON5 from 'json5'

const DEFAULT_PRIORITY = [
  "cortensor",
  "geminiflash",
  "geminiflashlite",
  "geminipro",
];

const MODEL_REGISTRY = {
  cortensor: CortensorModel,
  geminiflash: GeminiFlashModel,
  geminiflashlite: GeminiFlashLiteModel,
  geminipro: GeminiProModel,
};

// coloque no topo do arquivo (CommonJS)

async function tryParseLlmJson(llmText, expectedShape = "array") {
  // 1) quick native parse
  try {
    return JSON.parse(llmText);
  } catch (e) {
    /* continue */
  }

  // 2) try extract outermost JSON block
  const open = expectedShape === "array" ? "[" : "{";
  const close = expectedShape === "array" ? "]" : "}";
  const first = llmText.indexOf(open);
  const last = llmText.lastIndexOf(close);
  let candidate = llmText;
  if (first !== -1 && last > first) candidate = llmText.slice(first, last + 1);

  // 3) try jsonrepair
  try {
    const repaired = jsonrepair(candidate);
    return JSON.parse(repaired);
  } catch (eJsonRepair) {
    // fallthrough to next attempts
    console.debug("jsonrepair failed:", eJsonRepair.message);
  }

  // 4) try JSON5.parse (accepts single quotes, trailing commas, comments)
  try {
    return JSON5.parse(candidate);
  } catch (eJson5) {
    console.debug("JSON5.parse failed:", eJson5.message);
  }

  // 5) last-resort: a small sanitizer (escape smart quotes + remove code fences + remove control chars)
  const sanitized = candidate
    .replace(/```json[\s\S]*?```/g, "") // strip fenced blocks if any
    .replace(/[\u2018\u2019]/g, "'") // smart single -> '
    .replace(/[\u201C\u201D]/g, '"') // smart double -> "
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ""); // remove control chars

  try {
    return JSON.parse(sanitized);
  } catch (eFinal) {
    // give up — return meaningful diagnostic
    const err = new Error("All JSON parse attempts failed");
    err.cause = {
      originalError: eFinal.message,
      snippet: sanitized.slice(0, 1200),
      rawLength: llmText.length,
    };
    throw err;
  }
}

function buildPriorityFromEnv() {
  const raw = process.env.MODELS_PRIORITY;
  if (!raw) return DEFAULT_PRIORITY;
  const arr = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : DEFAULT_PRIORITY;
}

let modelsPriority = buildPriorityFromEnv();
let modelInstances = null;

function initModelInstances() {
  if (modelInstances) return;
  modelInstances = modelsPriority
    .map((key) => {
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
    })
    .filter(Boolean);
}

/**
 * generateText(params, opts)
 * - params: { prompt, maxTokens = 512, temperature = 0.7 }
 * - opts: optional object forwarded to model.generateText as second parameter (e.g. { executorJobId })
 *
 * Backwards-compatible: callers that don't provide opts behave exactly as before.
 */
export async function generateText(
  { prompt, maxTokens = 512, temperature = 0.7 } = {},
  opts = {}
) {
  if (!prompt || typeof prompt !== "string")
    throw new Error("prompt (string) is required");
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
      const out = await model.generateText(
        { prompt, maxTokens, temperature },
        opts
      );
      if (typeof out === "string" && out.trim().length > 0) return out;
      errors.push({ model: key, reason: "empty response" });
    } catch (err) {
      errors.push({ model: key, reason: err.message || String(err) });
    }
  }

  const agg = errors.map((e) => `${e.model}: ${e.reason}`).join(" | ");
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
  { maxAttempts = LLM_MAX_ATTEMPTS, expectedShape = "array" } = {},
  generateOpts = {}
) {
  let lastError = null;
  let lastRawText = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Attempt ${attempt} of ${maxAttempts} to generate and parse JSON.`
      );
      const llmText = await generateText(
        { prompt, maxTokens, temperature },
        generateOpts
      );
      lastRawText = llmText;

      let parsed = null;
      try {
        parsed = await tryParseLlmJson(llmText, expectedShape);
      } catch (e) {
        // rethrow/retry logic do seu loop principal
        throw e;
      }

      const isCorrectShape =
        expectedShape === "array"
          ? Array.isArray(parsed)
          : typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed);
      if (isCorrectShape) {
        return { parsedJson: parsed, rawText: lastRawText };
      } else {
        throw new Error(
          `Parsed content is not the expected shape ('${expectedShape}').`
        );
      }
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
    }
  }
  throw new Error(
    `LLM failed to produce valid JSON after ${maxAttempts} attempts. Last error: ${lastError.message}`
  );
}
