// prompts/runWorkgroupPrompt.js
/**
 * Helpers to build prompts for running the whole workgroup and the integrator.
 *
 * - buildAgentExecutionPrompt({ agent, input, previousOutputs })
 * - buildIntegratorPrompt({ responseformat, outputs, workgroup })
 */

export function buildAgentExecutionPrompt({ agent, input, previousOutputs }) {
  // reuse same structure as single-agent but tuned for full-run usage
  const header = `You are the "${agent.name}" agent in a sequential workgroup.
System note: Agents run in order and each receives the outputs of previous agents.
Follow your role instructions and RETURN ONLY YOUR CONTENT (no meta or commentary).\n\n`;

  let body = `User input:\n${input}\n\nPrevious outputs:\n`;
  if (!previousOutputs || previousOutputs.length === 0) {
    body += "(none)\n\n";
  } else {
    previousOutputs.forEach((o, i) => {
      var o_filter = o.replace("<end_of_turn>", '');
      body += `Agent ${i} output:\n${o_filter}\n\n`;
    });
  }

  body += `Role instructions (below). Execute and return only your content:\n\n${agent.prompt}\n\n`;
  body += `IMPORTANT: Return only your content (no labels, no extra JSON, unless the role explicitly asks for JSON). \n assistant:`;

  return header + body;
}

export function buildIntegratorPrompt({ responseformat, outputs, workgroup }) {
  // responseformat is an object with keys->descriptions
  const rfStr = JSON.stringify(responseformat || {}, null, 2);

  const header = `You are the Integrator agent.
System note: Your job is to merge the outputs of the previous agents (they are provided below, in order)
into a single JSON object that strictly follows the response format specification provided.\n\n`;

  const outputsBlock = `Agent outputs (in order):\n${(outputs || []).map((o, idx) => `Agent ${idx} (${(workgroup?.[idx]?.name)||('Agent'+idx)}):\n${o}\n`).join("\n")}\n\n`;

  const task = `Response format specification (JSON keys and descriptions):\n${rfStr}\n\nTask:
- Produce a single JSON object that exactly matches the keys in the response format.
- Also include a top-level key "final_message" containing a human-readable concise answer for the user.
- Values should be strings or arrays as appropriate; keep them concise and ready-to-use.
- RETURN ONLY THE JSON OBJECT (no explanation, no surrounding text, no code fences). \n assistant:`;

  return header + outputsBlock + task;
}
