// api/runworkgroup.js
import { withMiddleware } from "../lib/withMiddleware.js";
import { runWorkgroupAndIntegrate } from "../lib/workgroupEngine.js";

/**
 * Pure handler: expects req.body to be parsed (middleware.parseJson = true)
 * Focus: validates semantic inputs and calls the engine.
 */
async function runworkgroupHandler(req, res) {
  // req.body is provided by middleware
  const { input, workgroup, workgroupresponse = {}, responseformat } = req.body || {};

  if (typeof input === "undefined") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Missing input" }));
    return;
  }
  if (!Array.isArray(workgroup) || workgroup.length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "workgroup must be a non-empty array" }));
    return;
  }
  if (typeof workgroupresponse !== "object" || workgroupresponse === null) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "workgroupresponse must be an object" }));
    return;
  }
  if (typeof responseformat !== "object" || responseformat === null) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "responseformat must be an object" }));
    return;
  }

  try {
    const result = await runWorkgroupAndIntegrate({
      input,
      workgroup,
      workgroupResponseMap: workgroupresponse,
      responseformat,
      options: {
        maxTokens: 800,
        temperature: 0.7,
        integratorMaxAttempts: 3,
        integratorMaxTokens: 900,
        integratorTemperature: 0.5
      }
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      perAgent: result.perAgent,
      generated: result.generated,
      updatedWorkgroupResponse: result.updatedWorkgroupResponse,
      final: result.final,
      validation: result.validation,
      attempts: result.attempts,
      lastRaw: result.lastRaw
    }));
  } catch (err) {
    console.error("runworkgroup handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error", detail: String(err) }));
  }
}

/**
 * Export default wrapped handler.
 * Options:
 *  - parseJson true => middleware will parse body and set req.body
 *  - requireJson true => middleware ensures Content-Type: application/json
 *  - allowedMethods restricts to POST
 *  - rateLimit { windowMs, max } : simple in-memory rate limit
 *
 * Replace in production the rate limiter with a central store (Redis) and set requireAuth + authFn.
 */
export default withMiddleware(runworkgroupHandler, {
  allowedMethods: ["POST"],
  requireJson: true,
  parseJson: true,
  maxBodyBytes: 300 * 1024,
  rateLimit: { windowMs: 60_000, max: 30 }, // 30 requests per minute per IP (dev default)
  requireAuth: false // set true + authFn in prod
});