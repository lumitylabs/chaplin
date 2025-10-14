// prompts/createWorkgroupInstruction.js
export default function buildCreateWorkgroupInstruction({
  name,
  category,
  description,
  maxMembers = 5,
  previousWorkgroup = [],
  generateAgentName = null,
  generateAgentIndex = null
}) {
  // brief context summary for previousWorkgroup
  const prevSummary = (previousWorkgroup || []).map((a, i) => {
    const n = a.name ? a.name.trim() : `Agent${i}`;
    const p = typeof a.prompt === "string" ? a.prompt.replace(/\s+/g, " ").slice(0, 300) : "";
    return `- ${n}: ${p}`;
  }).join("\n") || "No previous agents provided.";

  // Mode: single agent generation or full (missing ones)
  let modeInstruction = "";
  if (generateAgentName) {
    modeInstruction = `
MODE: Generate ONLY ONE agent with the exact role name "${generateAgentName}".
- Output MUST be a JSON ARRAY with a single object: [{ "name": "ExactlyThisName", "prompt": "..." }].
- Do NOT include other agents, do NOT include an Integrator.
- Ensure the role is coherent with the existing team and persona context.
`;
  } else if (typeof generateAgentIndex === "number") {
    modeInstruction = `
MODE: Generate ONLY ONE agent to occupy position index ${generateAgentIndex} (0-based) in the team ordering.
- Output MUST be a JSON ARRAY with a single object: [{ "name": "RoleName", "prompt": "..." }].
- Do NOT include other agents or an Integrator.
- The generated prompt must be appropriate to the persona and consistent with previous agents.
`;
  } else {
    modeInstruction = `
MODE: Generate the missing agents (in order) that are not present in the provided previousWorkgroup.
- Output MUST be a JSON ARRAY of objects, each object exactly: { "name": "ShortRoleName", "prompt": "English prompt with System: preface ..." }.
- The array length must be <= ${maxMembers}.
- Do NOT include Integrator or any non-agent wrapper. Return only the array.
`;
  }

  const instruction = `
You are a prompt-engineering assistant. Use the persona context and the existing team context to produce agent role prompts.

STRICT OUTPUT RULES (do not break them):
1) Output EXACTLY a JSON ARRAY and NOTHING ELSE.
2) Each item must be an object with EXACTLY these keys: "name" (string), "prompt" (string).
3) Prompts MUST be in ENGLISH and the "prompt" value MUST include a "System:" preface clarifying that agents run SEQUENTIALLY and will receive outputs from previous agents. Example start: "System: You are part of a sequential workgroup..."
4) DO NOT include any "Integrator" agent. Integrator is handled separately.
5) Max number of agents returned must be <= ${maxMembers}.

Persona context:
- name: "${name}"
- category: "${category}"
- description: "${description}"

Existing team (previousWorkgroup):
${prevSummary}

${modeInstruction}

Additional instructions for composing each agent prompt:
- Make prompts actionable and explicit: describe role responsibility, expected output format (plain text unless otherwise stated), tone, any constraints (length, style).
- Keep each prompt focused (one agent per object); avoid duplication across roles.
- Make sure each prompt tells the agent to "Return only their content (no meta or commentary)".

Now output only the JSON array as specified.
`;

  return instruction;
}
