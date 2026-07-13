import axios from 'axios';

// Create an Axios instance with a dynamic baseURL.
// If VITE_API_URL is set in env (e.g., pointing to Render), it will be used.
// If not set, it defaults to empty string (which uses relative paths and Vite dev proxy/same-origin routing).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export default api;
