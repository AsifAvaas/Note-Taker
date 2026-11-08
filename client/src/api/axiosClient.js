import axios from 'axios';

// Dynamically sets baseURL:
// In production on Vercel, uses VITE_API_URL (e.g. https://your-backend.vercel.app/api/v1)
// In local development, falls back to '/api/v1' using Vite's server proxy
const getBaseURL = () => {
  const customUrl = import.meta.env.VITE_API_URL;
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    return `${customUrl.trim().replace(/\/$/, '')}/api/v1`;
  }
  return '/api/v1';
};

const axiosClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach JWT token to outgoing requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatically handle 401 Unauthorized responses
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
