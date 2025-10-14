// api/generateimage.js
import buildGenerateImagePrompt from "../prompts/generateImagePrompt.js";
import { generateText } from "../lib/aiProvider.js";
import fetch from "node-fetch";
import { withMiddleware } from "../lib/withMiddleware.js";

const MAX_STRING = 3000;

async function handler(req, res) {
  try {
    // req.body is already parsed by withMiddleware (parseJson: true)
    const { name, description, category, workgroup = [] } = req.body || {};

    if (!name || !description || !category) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing name/description/category" }));
      return;
    }

    if (!Array.isArray(workgroup)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "workgroup must be an array" }));
      return;
    }

    const personaName = String(name).slice(0, MAX_STRING);
    const personaDesc = String(description).slice(0, MAX_STRING);
    const personaCat = String(category).slice(0, MAX_STRING);

    // Build image prompt via prompt builder + LLM
    const promptForImage = buildGenerateImagePrompt({
      name: personaName,
      description: personaDesc,
      category: personaCat,
      workgroup
    });

    let imagePrompt;
    try {
      imagePrompt = await generateText({ prompt: promptForImage, maxTokens: 200, temperature: 0.8 });
      if (typeof imagePrompt !== "string") imagePrompt = String(imagePrompt || "");
      imagePrompt = imagePrompt.trim();
    } catch (err) {
      console.error("image prompt generation error:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Image prompt generation failed", detail: String(err) }));
      return;
    }

    // Call the external image API (the worker URL), convert to base64
    const url = process.env.IMAGE_WORKER_URL +`/?prompt=${encodeURIComponent(imagePrompt)}`;

    let resp;
    try {
      resp = await fetch(url);
    } catch (err) {
      console.error("fetch to image worker failed:", err);
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Image worker request failed", detail: String(err) }));
      return;
    }

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "<no-body>");
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Image API error", status: resp.status, detail: txt }));
      return;
    }

    const buffer = await resp.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = resp.headers.get("content-type") || "image/png";

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      imagePrompt,
      mime,
      base64: `data:${mime};base64,${base64}`
    }));
  } catch (err) {
    console.error("generateimage error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error", detail: String(err) }));
    } else {
      try { res.end(); } catch (e) {}
    }
  }
}

export default withMiddleware(handler, {
  allowedMethods: ["POST"],
  requireJson: true,
  parseJson: true,             // middleware will parse body and set req.body
  maxBodyBytes: 200 * 1024,
  rateLimit: { windowMs: 60_000, max: 20 }
});
