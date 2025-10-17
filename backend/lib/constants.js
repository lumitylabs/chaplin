// lib/constants.js

// Limites de input da Persona/Tarefa
export const NAME_MAX = 25;
export const DESCRIPTION_MAX = 200;
export const CATEGORY_OPTIONS = [
  "Assistant", "Anime", "Creativity & Writing", "Entertainment & Gaming",
  "History", "Humor", "Learning",
];

// Limites do 'responseformat' (Step 2)
export const RESPONSE_KEY_MAX = 25;
export const RESPONSE_DESC_MAX = 100;
export const MAX_RESPONSE_PAIRS = 5;

// Limites do Workgroup (Agentes)
export const AGENT_NAME_MAX = 25;
export const AGENT_PROMPT_MAX = 3000;

// Limites do Servidor e da API
export const MAX_WORKGROUP_MEMBERS = 5;
export const MAX_PREV = 5;
export const MAX_FORMAT_BYTES = 2048;
export const LLM_MAX_ATTEMPTS = 3; // <<< NOME PADRONIZADO

// Limites para runagent/runworkgroup
export const MAX_RESPONSE_ENTRIES = 5;