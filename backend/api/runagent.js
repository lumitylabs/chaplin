// api/runagent.js
// Updated to use withMiddleware (parsing, Content-Type check, rate limiting centralized).
// Pure handler expects req.body already parsed by middleware.

import { withMiddleware } from "../lib/withMiddleware.js";
import { runAgentsSequentially } from "../lib/workgroupEngine.js";

/* Limits */
const MAX_WORKGROUP = 5;
const MAX_RESPONSE_ENTRIES = 5;

async function runAgentHandler(req, res) {
  try {
    const body = req.body || {};
    const { input, workgroup, workgroupresponse = {}, targetAgentName = null } = body;

    // Basic validation
    if (typeof input === "undefined") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing input" }));
      return;
    }

    if (!Array.isArray(workgroup) || workgroup.length === 0 || workgroup.length > MAX_WORKGROUP) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `workgroup must be a non-empty array (max ${MAX_WORKGROUP})` }));
      return;
    }

    if (typeof workgroupresponse !== "object" || workgroupresponse === null) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "workgroupresponse must be an object mapping agentName -> output" }));
      return;
    }

    if (Object.keys(workgroupresponse).length > MAX_RESPONSE_ENTRIES) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `workgroupresponse too large (max ${MAX_RESPONSE_ENTRIES} entries)` }));
      return;
    }

    // Normalize agent names for matching (case-insensitive)
    const workgroupNames = workgroup.map(w => String(w.name || "").trim());
    const wgNameSetLower = new Set(workgroupNames.map(n => n.toLowerCase()));

    // If targetAgentName provided, ensure it exists in workgroup (case-insensitive)
    let stopAt = targetAgentName;
    if (targetAgentName) {
      if (!wgNameSetLower.has(String(targetAgentName).trim().toLowerCase())) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "targetAgentName not found in provided workgroup" }));
        return;
      }
    } else {
      // find first missing agent by checking workgroupresponse map keys (case-insensitive)
      const filled = new Set(Object.keys(workgroupresponse || {}).map(k => String(k).trim().toLowerCase()));
      const firstMissing = workgroup.find(w => !filled.has(String(w.name).trim().toLowerCase()));
      stopAt = firstMissing ? firstMissing.name : null;
    }

    if (!stopAt) {
      // nothing to do: compose perAgent list showing prefilled outputs where available
      const perAgent = workgroup.map(w => {
        const keyExact = Object.keys(workgroupresponse).find(k => String(k).trim().toLowerCase() === String(w.name).trim().toLowerCase());
        const output = typeof keyExact !== "undefined" ? workgroupresponse[keyExact] : null;
        return { name: w.name, output, source: "prefilled" };
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        message: "All agents already filled",
        updatedWorkgroupResponse: workgroupresponse,
        generated: [],
        perAgent
      }));
      return;
    }

    // Run agents sequentially until stopAt (inclusive), skipping already filled agents
    const result = await runAgentsSequentially({
      input,
      workgroup,
      workgroupResponseMap: workgroupresponse,
      options: { stopAtAgentName: stopAt, maxTokens: 800, temperature: 0.7 }
    });

    // Return the merged mapping and generated outputs
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      updatedWorkgroupResponse: result.updatedWorkgroupResponse,
      generated: result.generated,
      perAgent: result.perAgent
    }));
    return;
  } catch (err) {
    console.error("runagent handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error", detail: String(err) }));
    } else {
      try { res.end(); } catch (e) {}
    }
  }
}

/**
 * Export wrapped handler using withMiddleware
 * - parseJson: true => middleware will parse body and set req.body
 * - requireJson: true => enforce Content-Type
 * - allowedMethods: POST only
 * - rateLimit: simple in-memory throttle (dev); swap with Redis in prod
 */
export default withMiddleware(runAgentHandler, {
  allowedMethods: ["POST"],
  requireJson: true,
  parseJson: true,
  maxBodyBytes: 200 * 1024,
  rateLimit: { windowMs: 60_000, max: 30 } // 30 requests per minute per IP (dev default)
});