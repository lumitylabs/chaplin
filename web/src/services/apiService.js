// src/services/apiService.js

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

/**
 * Lida com a resposta da API, tratando erros de rede e HTTP.
 * Esta função agora lança um erro com uma mensagem detalhada,
 * que será capturado dentro da função de chamada (ex: generateWorkgroup).
 * @param {Response} response - O objeto de resposta do fetch.
 * @returns {Promise<any>} O corpo da resposta em JSON.
 */
async function handleResponse(response) {
  if (response.ok) {
    return response.json();
  }

  // Se a resposta não for OK, tentamos extrair uma mensagem de erro útil.
  let errorDetail = `HTTP error! Status: ${response.status} - ${response.statusText}`;
  try {
    // O backend envia um JSON com a chave 'error' ou 'detail'.
    const errorBody = await response.json();
    errorDetail = errorBody.detail || errorBody.error || JSON.stringify(errorBody);
  } catch (e) {
    // Se o corpo do erro não for JSON, o 'errorDetail' inicial já é suficiente.
    console.warn("Could not parse error response body as JSON.");
  }

  // Lança um erro com a mensagem detalhada para ser pego pelo catch local.
  throw new Error(errorDetail);
}

/**
 * Gera um novo workgroup.
 * Retorna um objeto no formato { data, error }.
 * 'data' é o workgroup em caso de sucesso, 'error' é a mensagem de erro em caso de falha.
 * @param {object} personaData
 * @returns {Promise<{data: Array | null, error: string | null}>}
 */
export const generateWorkgroup = async ({ name, category, description }) => {
  if (!API_BASE_URL) {
    const errorMessage = "VITE_APP_API_BASE_URL is not defined in your .env file.";
    console.error(errorMessage);
    return { data: null, error: errorMessage };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/createworkgroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, description, max_members: 3 }),
    });

    const data = await handleResponse(response);
    return { data: data.workgroup || [], error: null };

  } catch (error) {
    console.error("Failed to generate workgroup in service:", error);
    return { data: null, error: error.message };
  }
};

/**
 * Gera uma imagem de avatar para a persona.
 * Retorna um objeto { data, error }.
 * 'data' contém a imagem base64 em caso de sucesso.
 * @param {object} personaData - { name, category, description }
 * @returns {Promise<{data: { base64: string } | null, error: string | null}>}
 */
export const generateImage = async ({ name, category, description }) => {
  if (!API_BASE_URL) {
    const errorMessage = "VITE_APP_API_BASE_URL is not defined in your .env file.";
    console.error(errorMessage);
    return { data: null, error: errorMessage };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/generateimage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, description }),
    });
    const data = await handleResponse(response);
    // A API retorna um objeto com a chave "base64"
    return { data, error: null };

  } catch (error) {
    console.error("Failed to generate image in service:", error);
    return { data: null, error: error.message };
  }
};

/**
 * Executa um ou mais agentes de um workgroup.
 * Retorna um objeto { data, error }.
 * 'data' contém o mapa de respostas atualizado.
 * @param {object} runData - { input, workgroup, workgroupresponse, targetAgentName }
 * @returns {Promise<{data: object | null, error: string | null}>}
 */
export const runAgent = async ({ input, workgroup, workgroupresponse, targetAgentName }) => {
  if (!API_BASE_URL) {
    const errorMessage = "VITE_APP_API_BASE_URL is not defined in your .env file.";
    console.error(errorMessage);
    return { data: null, error: errorMessage };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/runagent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, workgroup, workgroupresponse, targetAgentName }),
    });
    const data = await handleResponse(response);
    return { data: data.updatedWorkgroupResponse || {}, error: null };
  } catch (error) {
    console.error("Failed to run agent in service:", error);
    return { data: null, error: error.message };
  }
};