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

  let errorDetail = `HTTP error! Status: ${response.status} - ${response.statusText}`;
  try {
    const errorBody = await response.json();
    errorDetail = errorBody.detail || errorBody.error || JSON.stringify(errorBody);
  } catch (e) {
    console.warn("Could not parse error response body as JSON.");
  }

  throw new Error(errorDetail);
}

/**
 * Gera um novo workgroup.
 * Retorna um objeto no formato { data, error }.
 * 'data' é o workgroup em caso de sucesso, 'error' é a mensagem de erro em caso de falha.
 * @param {object} personaData - Inclui name, category, description, e o novo responseformat
 * @returns {Promise<{data: Array | null, error: string | null}>}
 */
export const generateWorkgroup = async ({ name, category, description, responseformat }) => { // <<< ADICIONADO responseformat
  if (!API_BASE_URL) {
    const errorMessage = "VITE_APP_API_BASE_URL is not defined in your .env file.";
    console.error(errorMessage);
    return { data: null, error: errorMessage };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/createworkgroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category,
        description,
        responseformat, 
        max_members: 3, 
      }),
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
    return { data, error: null };

  } catch (error) {
    console.error("Failed to generate image in service:", error);
    return { data: null, error: error.message };
  }
};

/**
 * Executa um ou mais agentes de um workgroup.
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