// lib/aiProvider.js
import { GoogleGenAI } from "@google/genai";


/**
 * Thin wrapper around the Google GenAI client.
 * Exposes generateText({ prompt, maxTokens, temperature })
 * and generateImagePrompt({ context })
 */

const client = new GoogleGenAI({
  // If your environment requires an explicit API key, add it here:
  apiKey: process.env.GENAI_API_KEY || undefined
});

export async function generateText({ prompt, maxTokens = 512, temperature = 0.7 }) {
  if (!prompt) throw new Error("Missing prompt");
  try {
    const response = await client.models.generateContent({
      model: process.env.GENAI_MODEL || "gemini-flash-lite-latest",
      contents: prompt,
      // Many GenAI SDKs accept additional params; if yours accepts other keys, add them.
      // This example uses the minimal shape from your snippet.
    });

    // Try common shapes (user sample used response.text)
    if (response?.text) return response.text;
    if (typeof response === "string") return response;
    // some SDKs return object with output or outputs
    if (response?.output?.text) return response.output.text;
    if (Array.isArray(response?.outputs) && response.outputs[0]?.content) return response.outputs[0].content;
    // fallback: stringify
    return JSON.stringify(response);
  } catch (err) {
    // rethrow so caller can handle
    throw err;
  }
}

export async function generateImagePrompt({ context }) {
  // Reuse the text generator to craft a concise image prompt
  const prompt = `You are an expert image prompt engineer. Given this context, produce a single concise text-to-image prompt (<= 40 words) that describes the subject, mood, color palette and two detailed visual elements. Output ONLY the prompt string.\n\nContext:\n${context}`;
  return generateText({ prompt, maxTokens: 128, temperature: 0.85 });
}
