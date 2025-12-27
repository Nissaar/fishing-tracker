import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile')
};

export const fishingAPI = {
  getLocations: () => api.get('/fishing/locations'),
  getEnvironmentalData: (date, locationId) => api.get('/fishing/environmental-data', { params: { date, locationId } }),
  createLog: (logData) => api.post('/fishing/logs', logData),
  getLogs: (limit) => api.get('/fishing/logs', { params: { limit } }),
  getLog: (id) => api.get(`/fishing/logs/${id}`),
  updateLog: (id, logData) => api.put(`/fishing/logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/fishing/logs/${id}`),
  getStatistics: () => api.get('/fishing/statistics')
};

export default api;