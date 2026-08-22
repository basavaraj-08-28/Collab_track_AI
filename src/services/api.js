/**
 * Centralized API Service for Collab Track AI Backend Communication
 */

const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = (rawApiUrl && rawApiUrl.trim() !== '')
  ? rawApiUrl
  : (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const getAuthHeaders = () => {
  const token = localStorage.getItem('collab_track_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function handleRequest(requestFn) {
  let response;
  try {
    response = await requestFn();
  } catch (err) {
    if (err.message && (err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
      throw new Error('Unable to connect to backend server. Please verify network connection or backend availability.');
    }
    throw err;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.message || `Server error (Status: ${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  async get(endpoint) {
    return handleRequest(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
    );
  },

  async post(endpoint, body) {
    return handleRequest(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body || {})
      })
    );
  },

  async put(endpoint, body) {
    return handleRequest(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body || {})
      })
    );
  },

  async delete(endpoint) {
    return handleRequest(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
    );
  }
};

export default api;
