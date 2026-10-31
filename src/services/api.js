/**
 * Centralized API Service for Collab Track AI Backend Communication
 */

const rawApiUrl = import.meta.env.VITE_API_URL;
const cleanRawUrl = rawApiUrl && rawApiUrl.trim() ? rawApiUrl.trim().replace(/\/+$/, '') : '';
export const API_BASE_URL = cleanRawUrl
  ? cleanRawUrl
  : (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const getAuthHeaders = () => {
  const token = localStorage.getItem('collab_track_auth_token');
  const activeRole = localStorage.getItem('collab_track_active_role');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(activeRole ? { 'X-Active-Role': activeRole } : {})
  };
};

async function handleRequest(requestFn, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await requestFn(controller.signal);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Server request timed out. The backend is waking up, please retry in a moment.');
    }
    if (err.message && (err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
      throw new Error('Unable to connect to backend server. Please verify network connection or backend availability.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
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
    return handleRequest((signal) =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal
      })
    );
  },

  async post(endpoint, body) {
    return handleRequest((signal) =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body || {}),
        signal
      })
    );
  },

  async put(endpoint, body) {
    return handleRequest((signal) =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body || {}),
        signal
      })
    );
  },

  async delete(endpoint) {
    return handleRequest((signal) =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        signal
      })
    );
  }
};

export default api;
