import CortensorModel from "./models/CortensorModel.js";
import GeminiFlashModel from "./models/GeminiFlashModel.js";
import GeminiFlashLiteModel from "./models/GeminiFlashLiteModel.js";
import GeminiProModel from "./models/GeminiProModel.js";
import { LLM_MAX_ATTEMPTS } from "./constants.js";
import { jsonrepair } from "jsonrepair";
import JSON5 from 'json5'


const DEFAULT_PRIORITY_SMALL = [
  "cortensor",
  "geminiflashlite",
  "geminiflash",
  "geminipro",
];

const DEFAULT_PRIORITY_BIG = [
  "cortensor",
  "geminiflashlite",
  "geminiflash",
  "geminipro",
];

const MODEL_REGISTRY = {
  cortensor: CortensorModel,
  geminiflash: GeminiFlashModel,
  geminiflashlite: GeminiFlashLiteModel,
  geminipro: GeminiProModel,
};


function buildPriorityFromEnv(envVarName, defaultPriority) {
  const raw = process.env[envVarName];
  if (!raw) {
    console.log(`[aiProvider] Variável de ambiente '${envVarName}' não encontrada. Usando a prioridade padrão.`);
    return defaultPriority;
  }
  const arr = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  
  if (arr.length > 0) {
    console.log(`[aiProvider] Prioridade carregada de '${envVarName}': [${arr.join(", ")}]`);
    return arr;
  }
  
  return defaultPriority;
}

let modelsPrioritySmall = buildPriorityFromEnv('MODELS_PRIORITY_SMALL', DEFAULT_PRIORITY_SMALL);
let modelsPriorityBig = buildPriorityFromEnv('MODELS_PRIORITY_BIG', DEFAULT_PRIORITY_BIG);

let modelInstancesCache = null;


function initModelInstances() {
  if (modelInstancesCache) return;
  
  const allModelKeys = [...new Set([...modelsPrioritySmall, ...modelsPriorityBig])];
  
  modelInstancesCache = {};

  for (const key of allModelKeys) {
    const Cls = MODEL_REGISTRY[key];
    if (!Cls) {
      console.warn(`[aiProvider] Nenhuma classe de modelo registrada para a chave="${key}"`);
      continue;
    }
    try {
      modelInstancesCache[key] = new Cls({ key });
    } catch (err) {
      console.error(`[aiProvider] Falha ao instanciar o modelo ${key}:`, err);
    }
  }
}


async function tryParseLlmJson(llmText, expectedShape = "array") {
  let processedText = llmText;

  // 1) Novo passo: Remover o '</think>' e tudo que vem antes.
  const thinkTagIndex = processedText.lastIndexOf("</think>");
  if (thinkTagIndex !== -1) {
    processedText = processedText.substring(thinkTagIndex + "</think>".length);
  }

  // 2) Tentar um parse nativo rápido no texto já pré-processado.
  try {
    return JSON.parse(processedText.trim());
  } catch (e) {
    /* falha esperada, continuar para métodos mais robustos */
  }

  // 3) Extrair o bloco JSON mais externo de forma mais inteligente.
  const openChar = expectedShape === "array" ? "[" : "{";
  const closeChar = expectedShape === "array" ? "]" : "}";
  
  const firstOpenIndex = processedText.indexOf(openChar);
  const lastCloseIndex = processedText.lastIndexOf(closeChar);

  let candidate = processedText;
  if (firstOpenIndex !== -1 && lastCloseIndex > firstOpenIndex) {
    candidate = processedText.slice(firstOpenIndex, lastCloseIndex + 1);
  } else {
    // Se não encontrar um bloco válido, pode ser um erro.
    // Mas vamos deixar as próximas tentativas lidarem com isso.
    candidate = processedText;
  }

  // 4) Tentar reparar com jsonrepair
  try {
    const repaired = jsonrepair(candidate);
    return JSON.parse(repaired);
  } catch (eJsonRepair) {
    console.debug("jsonrepair failed:", eJsonRepair.message);
  }

  // 5) Tentar parse com JSON5
  try {
    return JSON5.parse(candidate);
  } catch (eJson5) {
    console.debug("JSON5.parse failed:", eJson5.message);
  }
  
  // 6) Última tentativa com sanitização (como no seu código original)
  const sanitized = candidate
    .replace(/```json[\s\S]*?```/g, "") 
    .replace(/[\u2018\u2019]/g, "'") 
    .replace(/[\u201C\u201D]/g, '"') 
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  try {
    return JSON.parse(sanitized);
  } catch (eFinal) {
    const err = new Error("All JSON parse attempts failed");
    err.cause = {
      originalError: eFinal.message,
      snippet: sanitized.slice(0, 1200),
      rawLength: llmText.length,
    };
    throw err;
  }
}

/**
 * generateText(params, opts)
 * - params: { prompt, maxTokens = 512, temperature = 0.7 }
 * - opts: { sessionSize: 'small' | 'big' } e outros...
 */
export async function generateText(
  { prompt, maxTokens = 512, temperature = 0.7 } = {},
  opts = {}
) {
  if (!prompt || typeof prompt !== "string")
    throw new Error("prompt (string) is required");
  
  initModelInstances();

  // Nenhuma mudança aqui, a lógica continua a mesma.
  const priorityList = opts.sessionSize === 'big' ? modelsPriorityBig : modelsPrioritySmall;
  
  const modelsToTry = priorityList
    .map(key => modelInstancesCache[key])
    .filter(Boolean);

  if (!modelsToTry || modelsToTry.length === 0) {
    throw new Error("Nenhuma instância de modelo disponível para a prioridade selecionada.");
  }

  const errors = [];
  for (const model of modelsToTry) {
    const key = model.key || "unknown";
    try {
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
  throw new Error(`Todos os modelos falharam. Detalhes: ${agg}`);
}

/**
 * generateTextAndParseJson(promptParams, parseOptions = {}, generateOpts = {})
 * - ...
 * - generateOpts: { sessionSize: 'small' | 'big' } e outros...
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
        `Tentativa ${attempt} de ${maxAttempts} para gerar e analisar JSON.`
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
          `O conteúdo analisado não tem o formato esperado ('${expectedShape}').`
        );
      }
    } catch (error) {
      lastError = error;
      console.warn(`Tentativa ${attempt} falhou: ${error.message}`);
    }
  }
  throw new Error(
    `LLM falhou em produzir um JSON válido após ${maxAttempts} tentativas. Último erro: ${lastError.message}`
  );
}