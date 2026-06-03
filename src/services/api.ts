import axios from 'axios';

// Resolves the API URL dynamically based on the current environment
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const { hostname, port } = window.location;
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  /^(192\.168\.|10\.|172\.)/.test(hostname);

  if (isLocal) {
    // If served by the backend (port 5001), use relative path. Otherwise, point to backend port 5001.
    return port === '5001' ? '/api' : `http://${hostname}:5001/api`;
  }

  // Production fallback
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Doctor Auth token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('doctor_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401 Unauthorized: Log doctor out
      if (error.response.status === 401) {
        localStorage.removeItem('doctor_token');
        localStorage.removeItem('doctor_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Return custom message from server if exists
      const errorMessage = error.response.data?.message || error.message || 'Something went wrong';
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(error);
  }
);

export default api;
