import axios from 'axios';
import { toast } from 'react-toastify';

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

// A 401 on these means "wrong credentials" or "no valid session yet", which
// the calling page handles itself. AuthContext's profile check must not
// bounce a visitor with a stale token off the public pages.
const NO_SESSION_REDIRECT = ['/auth/login', '/auth/register', '/auth/profile'];

let redirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if (status === 401 && !NO_SESSION_REDIRECT.some(path => url.includes(path))) {
      localStorage.removeItem('token');
      // Several requests usually fail together; redirect once
      if (!redirectingToLogin && window.location.pathname !== '/login') {
        redirectingToLogin = true;
        window.location.assign('/login?expired=1');
      }
    } else if (status === 429) {
      toast.error(error.response?.data?.error || 'Too many requests, please wait a moment and try again', {
        toastId: 'rate-limited'
      });
    }

    return Promise.reject(error);
  }
);

// Requests cancelled by an AbortController (a newer request replaced them)
// are not failures and should not show an error
export const isCancelled = (error) => axios.isCancel(error);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  googleLoginUrl: () => `${API_URL}/auth/google`
};

export const fishingAPI = {
  getLocations: () => api.get('/fishing/locations'),
  getEnvironmentalData: (date, time, locationId, { signal } = {}) => {
    // The form's date and time are Mauritius wall-clock time
    const referenceTime = new Date(`${date}T${time}:00+04:00`).toISOString();
    return api.get('/fishing/environmental-data', { params: { date, locationId, referenceTime }, signal });
  },
  createLog: (logData) => api.post('/fishing/logs', logData),
  getLogs: (limit) => api.get('/fishing/logs', { params: { limit } }),
  getLog: (id) => api.get(`/fishing/logs/${id}`),
  deleteLog: (id) => api.delete(`/fishing/logs/${id}`),
  getStatistics: () => api.get('/fishing/statistics'),
  getLeaderboard: (period = 'week', { signal } = {}) => api.get('/fishing/leaderboard', { params: { period }, signal }),
  getBestConditions: (params, { signal } = {}) => api.get('/fishing/best-conditions', { params, signal }),
  getLocationStats: (locationId) => api.get(`/fishing/location-stats/${locationId}`),
  getGlobalPredictions: () => api.get('/fishing/global-predictions'),
  getTripRecommendations: (tripData) => api.post('/fishing/trip-recommendations', tripData),
  submitCustomOption: (submission) => api.post('/fishing/custom-submission', submission)
};

// Active options for the log/plan forms (admins manage them in adminAPI)
export const dropdownAPI = {
  fishingTypes: () => api.get('/fishing/dropdown/fishing-types'),
  fishingMethods: () => api.get('/fishing/dropdown/fishing-methods'),
  baits: () => api.get('/fishing/dropdown/baits'),
  fishSpecies: () => api.get('/fishing/dropdown/fish-species')
};

export const eventsAPI = {
  list: (scope) => api.get('/events', { params: scope ? { scope } : {} }),
  get: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  remove: (id) => api.delete(`/events/${id}`),
  join: (id, note) => api.post(`/events/${id}/join`, { note }),
  leave: (id) => api.delete(`/events/${id}/join`)
};

// Public endpoints work without a token, so they are called through the same
// axios instance (the interceptor simply adds no Authorization header)
export const publicAPI = {
  getConditions: (params, { signal } = {}) => api.get('/public/conditions', { params, signal }),
  // Counts only — the ranked names require a session (fishingAPI.getLeaderboard)
  getLeaderboardSummary: (period = 'week', { signal } = {}) =>
    api.get('/public/leaderboard/summary', { params: { period }, signal }),
  getUpcomingEvents: (limit = 5) => api.get('/public/events/upcoming', { params: { limit } }),
  submitContact: (message) => api.post('/contact/submit', message)
};

export default api;
