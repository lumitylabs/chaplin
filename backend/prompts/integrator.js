// prompts/integrator.js
/**
 * Hardcoded Integrator prompt builder (updated).
 *
 * - responseformat: object with keys -> descriptions (from user)
 * - outputs: array of strings (agent outputs in order)
 * - workgroup: array of agents (optional, used for naming)
 *
 * IMPORTANT: This prompt instructs the integrator to RETURN ONLY a valid JSON object
 * that contains EXACTLY the top-level keys present in responseformat (no more, no less).
 * Values should be strings or arrays as appropriate. No surrounding text, no code fences, no commentary.
 */
export default function buildHardcodedIntegratorPrompt({ responseformat, outputs, workgroup }) {
  const rfPretty = JSON.stringify(responseformat || {}, null, 2);

  const outputsBlock = (outputs || []).map((o, i) => {
    const name = (workgroup && workgroup[i] && workgroup[i].name) ? workgroup[i].name : `Agent${i}`;
    return `--- Agent ${i} (${name}) output:\n${o}\n`;
  }).join("\n");

  return `System: You are the Integrator agent.
Your job: synthesize the textual outputs from previous agents into a SINGLE JSON OBJECT.

Response format (keys -> descriptions):
${rfPretty}

Agent outputs (in order):
${outputsBlock}

STRICT REQUIREMENTS:
1) Produce ONLY one valid JSON object as the entire response. No additional text, no explanation, no markdown, no code fences.
2) The JSON object MUST contain exactly the top-level keys present in the response format (no extra keys, no missing keys).
3) For each required key, provide a value (string or array) that matches the description. Keep values concise and relevant.
4) Ensure the JSON is syntactically valid (proper quoting, no trailing commas).
5) If uncertain, prioritize brevity and relevance.

Return ONLY the JSON object (no surrounding text).`;
}