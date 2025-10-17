// api/createworkgroup.js
// Clean handler that uses withMiddleware for parsing, rate-limiting and common checks.
// It implements both: normal generation flow and "enhance" flow with summarization of previousWorkgroup.

import { withMiddleware } from "../lib/withMiddleware.js";
import buildCreateWorkgroupInstruction from "../prompts/createWorkgroupInstruction.js";
import buildEnhanceAgentPrompt from "../prompts/enhanceAgentPrompt.js";
import buildSummarizePrevPrompt from "../prompts/summarizePreviousWorkgroup.js";
import { generateText } from "../lib/aiProvider.js";
import { withCors } from "../lib/withCors.js";

/**
 * Limits and defaults
 */
const MAX_MEMBERS = 5;
const MAX_PREV = 5;
const MAX_STRING = 5000;
const MAX_FORMAT_BYTES = 2048; // Max size for responseformat object

/**
 * Pure handler: assumes req.body is already parsed by middleware
 */
async function createWorkgroupHandler(req, res) {
  try {
    const {
      name,
      category,
      description,
      max_members,
      responseformat = null, // <<< NOVO: Recebe o formato da resposta
      previousWorkgroup = [],
      generateAgentName = null,
      generateAgentIndex = null,
      style = null,          // "enhance" optionally
      existingPrompt = null  // optional: direct prompt text to enhance
    } = req.body || {};

    // Basic validation
    if (!name || !category || !description) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing required fields: name, category, description" }));
      return;
    }
    if (typeof name !== "string" || typeof category !== "string" || typeof description !== "string") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "name/category/description must be strings" }));
      return;
    }

    // <<< NOVO: Validação para responseformat
    if (responseformat) {
      if (typeof responseformat !== 'object' || responseformat === null || Array.isArray(responseformat)) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "responseformat must be a JSON object." }));
        return;
      }
      if (JSON.stringify(responseformat).length > MAX_FORMAT_BYTES) {
        res.statusCode = 413; // Payload too large
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: `responseformat is too large (max ${MAX_FORMAT_BYTES} bytes)` }));
        return;
      }
    }

    // sanitize / truncate persona fields
    const personaName = name.trim().slice(0, MAX_STRING);
    const personaCategory = category.trim().slice(0, MAX_STRING);
    const personaDescription = description.trim().slice(0, MAX_STRING);

    // normalize maxMembers
    let maxMembers = Number.isInteger(max_members) ? max_members : parseInt(max_members || `${MAX_MEMBERS}`, 10);
    if (Number.isNaN(maxMembers) || maxMembers < 1) maxMembers = 1;
    if (maxMembers > MAX_MEMBERS) maxMembers = MAX_MEMBERS;

    // previousWorkgroup validation & normalization
    if (!Array.isArray(previousWorkgroup)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "previousWorkgroup must be an array" }));
      return;
    }
    if (previousWorkgroup.length > MAX_PREV) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `previousWorkgroup too large (max ${MAX_PREV})` }));
      return;
    }

    const prev = previousWorkgroup.map((a, idx) => {
      if (!a || typeof a !== "object") return null;
      const n = (a.name && String(a.name).trim().slice(0, 80)) || `Agent${idx}`;
      const p = (a.prompt && String(a.prompt).trim().slice(0, MAX_STRING)) || "";
      return { name: n, prompt: p };
    }).filter(Boolean);

    // validate generateAgentName/index
    let genName = null, genIndex = null;
    if (typeof generateAgentName !== "undefined" && generateAgentName !== null) {
      if (typeof generateAgentName !== "string" || !generateAgentName.trim()) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "generateAgentName must be non-empty string" }));
        return;
      }
      genName = generateAgentName.trim().slice(0, 80);
    }
    if (typeof generateAgentIndex !== "undefined" && generateAgentIndex !== null) {
      const idx = Number(generateAgentIndex);
      if (!Number.isFinite(idx) || idx < 0 || Math.floor(idx) !== idx) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "generateAgentIndex must be a non-negative integer" }));
        return;
      }
      genIndex = idx;
    }
    if (genName && typeof genIndex === "number") genName = null; // prefer index if both provided

    const isEnhance = String(style || "").toLowerCase() === "enhance";

    if (isEnhance) {
      // ENHANCE flow: (Lógica original mantida, pois o responseformat não se aplica aqui)
      let targetAgentName = genName;
      if (!targetAgentName && typeof genIndex === "number") {
        if (prev[genIndex] && prev[genIndex].name) targetAgentName = prev[genIndex].name;
      }
      if (!targetAgentName) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "To enhance, provide generateAgentName or generateAgentIndex (or include agent in previousWorkgroup)." }));
        return;
      }

      const existingFromPrev = prev.find(p => p.name.toLowerCase() === targetAgentName.toLowerCase());
      const existingText = existingFromPrev ? existingFromPrev.prompt : (typeof existingPrompt === "string" ? existingPrompt.trim().slice(0, MAX_STRING) : null);

      if (!existingText || existingText.length === 0) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "No existing prompt found to enhance. Provide it in previousWorkgroup or via existingPrompt." }));
        return;
      }

      let prevSummary = "";
      if (prev.length > 0) {
        try {
          const summarizeInstruction = buildSummarizePrevPrompt({ previousWorkgroup: prev, personaName, personaCategory });
          const summaryText = await generateText({ prompt: summarizeInstruction, maxTokens: 250, temperature: 0.1 });
          prevSummary = (typeof summaryText === "string" ? summaryText.trim() : String(summaryText)).slice(0, 1200);
          if (!prevSummary) {
            prevSummary = prev.map(p => `- ${p.name}: ${p.prompt.slice(0, 120)}`).join("\n");
          }
        } catch (err) {
          console.error("summarization error:", err);
          prevSummary = prev.map(p => `- ${p.name}: ${p.prompt.slice(0, 120)}`).join("\n");
        }
      } else {
        prevSummary = "No previous agents provided.";
      }

      const enhanceInstruction = buildEnhanceAgentPrompt({
        personaName,
        personaCategory,
        personaDescription,
        agentName: targetAgentName,
        existingPrompt: existingText,
        previousWorkgroupSummary: prevSummary
      });

      let improved;
      try {
        improved = await generateText({ prompt: enhanceInstruction, maxTokens: 400, temperature: 0.2 });
      } catch (err) {
        console.error("LLM enhance error:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "LLM error during enhancement", detail: String(err) }));
        return;
      }

      const finalPrompt = String(improved || "").trim().slice(0, MAX_STRING);
      if (!finalPrompt) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "LLM returned empty enhancement" }));
        return;
      }
      
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        workgroup: [ { name: targetAgentName, prompt: finalPrompt } ],
        raw: improved
      }));
      return;
    }

    // NORMAL generation flow
    const instruction = buildCreateWorkgroupInstruction({
      name: personaName,
      category: personaCategory,
      description: personaDescription,
      maxMembers,
      responseformat, // <<< NOVO: Passa o formato para o prompt
      previousWorkgroup: prev,
      generateAgentName: genName,
      generateAgentIndex: genIndex
    });

    let llmText;
    try {
      llmText = await generateText({ prompt: instruction, maxTokens: 1200, temperature: 0.18 }); // Aumentado para acomodar prompts maiores
    } catch (err) {
      console.error("LLM generate error:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "LLM error", detail: String(err) }));
      return;
    }

    // parse & normalize LLM output
    let parsed = null;
    try {
      parsed = JSON.parse(llmText);
    } catch (e) {
      const first = llmText.indexOf("[");
      const last = llmText.lastIndexOf("]");
      if (first !== -1 && last !== -1 && last > first) {
        try { parsed = JSON.parse(llmText.slice(first, last + 1)); } catch (e2) { parsed = null; }
      }
    }

    if (!Array.isArray(parsed)) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "LLM output could not be parsed as JSON array", raw: llmText }));
      return;
    }

    const normalized = parsed
      .filter(i => i && typeof i === "object")
      .map((it, idx) => {
        const n = String(it.name || `Agent${idx}`).trim().slice(0, 80);
        const p = String(it.prompt || "").trim().slice(0, MAX_STRING);
        return { name: n, prompt: p };
      })
      .filter(item => !/integrator/i.test(item.name))
      .slice(0, maxMembers); // Mantém como segurança, mas o prompt deve garantir o número exato

    // single-agent requested adjustments
    if ((genName || typeof genIndex === "number") && normalized.length > 1) {
      if (genName) {
        const found = normalized.find(n => n.name.toLowerCase() === genName.toLowerCase());
        const result = found ? [found] : [normalized[0]];
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ workgroup: result, raw: llmText, warning: found ? undefined : "Requested single agent not found exactly; returning first generated." }));
        return;
      } else {
        if (genIndex >= 0 && genIndex < normalized.length) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ workgroup: [normalized[genIndex]], raw: llmText }));
          return;
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ workgroup: [normalized[0]], raw: llmText, warning: "Requested index out of range; returning first generated agent." }));
          return;
        }
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ workgroup: normalized, raw: llmText }));
    return;

  } catch (err) {
    console.error("createworkgroup general error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error", detail: String(err) }));
    } else {
      try { res.end(); } catch (e) {}
    }
  }
}

export default withCors(withMiddleware(createWorkgroupHandler, {
  allowedMethods: ["POST"],
  requireJson: true,
  parseJson: true,
  maxBodyBytes: 200 * 1024,
  rateLimit: { windowMs: 60_000, max: 30 }
}));