/**
 * Centralized API Service for Collab Track AI Backend Communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      throw new Error('Unable to connect to backend server. Please check if the Flask backend is running on port 5000.');
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
