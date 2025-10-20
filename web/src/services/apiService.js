// src/services/apiService.js

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

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

export const createChaplin = async (chaplinData) => {
  if (!API_BASE_URL) {
    const errorMessage = "VITE_APP_API_BASE_URL is not defined in your .env file.";
    console.error(errorMessage);
    return { data: null, error: errorMessage };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/createchaplin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chaplinData),
    });

    const data = await handleResponse(response);
    return { data, error: null };

  } catch (error) {
    console.error("Failed to create chaplin in service:", error);
    return { data: null, error: error.message };
  }
};



export const getChaplins = async () => {
  if (!API_BASE_URL) {
    const errorMessage = "VITE_APP_API_BASE_URL is not defined in your .env file.";
    console.error(errorMessage);
    return { data: null, error: errorMessage };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chaplins`, {
      method: 'GET',
    });
    const data = await handleResponse(response);
    return { data, error: null };
  } catch (error) {
    console.error("Failed to fetch chaplins in service:", error);
    return { data: null, error: error.message };
  }
};


export const generateWorkgroup = async ({ name, category, description, instruction, responseformat }) => { // <<< ADICIONADO responseformat
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
        instruction,
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