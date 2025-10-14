// prompts/generateImagePrompt.js
export default function buildGenerateImagePrompt({ name, description, category, workgroup }) {
  return `
System: You are an AI specialized in prompt creation for text-to-image generation.
Analyze all the provided context and produce ONE detailed English image prompt.

RULES:
- Focus on visual composition, style, lighting, and atmosphere.
- Capture the essence of the description and category.
- Use fantasy or realistic style depending on the category.
- Avoid meta text (no “AI-generated” or “image of”).
- Output only a SINGLE image prompt string.

Context:
Name: ${name}
Category: ${category}
Description: ${description}

Team context summary (if relevant):
${workgroup?.map(w => `- ${w.name}: ${w.prompt?.slice(0, 150)}...`).join("\n") || "No team context provided"}

Now return the most descriptive and artistic image prompt possible.
`;
}
