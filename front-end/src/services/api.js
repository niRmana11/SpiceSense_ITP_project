import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log('Request Config:', config);
  return config;
});

export default api;