import fetch from "node-fetch";

let GoogleGenAIClient = null;
try {

  const mod = await import("@google/genai");
  GoogleGenAIClient = mod.GoogleGenAI;
} catch (e) {
  GoogleGenAIClient = null;
}

export default class GeminiBase {
  constructor({ key = "gemini-base", modelName = null } = {}) {
    this.key = key;
    this.modelName = modelName || process.env.GENAI_MODEL || "gemini-2.5-flash";
    this.apiKey = process.env.GENAI_API_KEY || null;
    this.apiUrl = process.env.GENAI_API_URL || null; 
    this.client = null;

    if (GoogleGenAIClient && this.apiKey) {
      try {
        this.client = new GoogleGenAIClient({ apiKey: this.apiKey });
      } catch (e) {
        // fallback to REST
        this.client = null;
      }
    }
  }

  async generateText({ prompt, maxTokens = 512, temperature = 0.7 } = {}) {
    if (!prompt) throw new Error("prompt required");
    // prefer SDK if available
    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: prompt,

        });

        if (response && typeof response.text === "string") return response.text;

        if (response && typeof response === "string") return response;

        return JSON.stringify(response);
      } catch (err) {
        throw new Error(`Gemini SDK error: ${err.message || String(err)}`);
      }
    }


    if (this.apiUrl && this.apiKey) {
      try {
        const res = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.modelName,
            prompt,
            maxTokens,
            temperature,
          }),
          timeout: 60_000,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "<no body>");
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        const json = await res.json().catch(() => null);
        if (!json) throw new Error("Empty JSON response from GENAI API");

        if (typeof json.text === "string") return json.text;
        if (json.output?.[0]?.content?.[0]?.text) return json.output[0].content[0].text;

        return typeof json === "string" ? json : JSON.stringify(json);
      } catch (err) {
        throw new Error(`Gemini REST error: ${err.message || String(err)}`);
      }
    }

    throw new Error("No Gemini client configured (set GENAI_API_KEY and install @google/genai or set GENAI_API_URL)");
  }
}