import api from './api';

// Dropdown lists an admin manages, keyed as the Admin page's tabs are
export const DROPDOWN_ENDPOINTS = {
  baits: '/admin/fishing-baits',
  types: '/admin/fishing-types',
  methods: '/admin/fishing-methods',
  species: '/admin/fish-species',
  locations: '/admin/locations'
};

// The admin list endpoints answer either with an array or with the list
// wrapped under a key, depending on the route
const RESPONSE_KEYS = {
  baits: 'fishingBaits',
  types: 'fishingTypes',
  methods: 'fishingMethods',
  species: 'fishSpecies',
  locations: 'locations'
};

const unwrapList = (kind, data) => (Array.isArray(data) ? data : (data?.[RESPONSE_KEYS[kind]] || []));

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),

  getUsers: () => api.get('/admin/users'),
  updateUser: (userId, data) => api.patch(`/admin/users/${userId}`, data),
  setAdmin: (userId, isAdmin) => api.patch(`/admin/users/${userId}/admin`, { isAdmin }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  getUserEntries: (userId) => api.get(`/admin/user-entries/${userId}`),
  updateEntry: (entryId, data) => api.patch(`/admin/fishing-logs/${entryId}`, data),
  deleteEntry: (entryId) => api.delete(`/admin/fishing-logs/${entryId}`),

  getSubmissions: (status) => api.get('/admin/submissions', { params: { status } }),
  reviewSubmission: (submissionId, status) => api.patch(`/admin/submissions/${submissionId}`, { status }),

  getContactMessages: (status) => api.get('/contact/all', { params: { status } }),
  getContactStats: () => api.get('/contact/stats/summary'),
  updateContactMessage: (messageId, status, adminNotes) =>
    api.patch(`/contact/${messageId}/status`, { status, adminNotes }),
  deleteContactMessage: (messageId) => api.delete(`/contact/${messageId}`),

  getLogFiles: () => api.get('/logs/files'),
  getLogFile: (filename, lines = 1000) =>
    api.get(`/logs/content/${encodeURIComponent(filename)}`, { params: { lines } }),

  getDropdownList: async (kind) => unwrapList(kind, (await api.get(DROPDOWN_ENDPOINTS[kind])).data),
  addDropdownItem: (kind, item) => api.post(DROPDOWN_ENDPOINTS[kind], item),
  updateDropdownItem: (kind, id, item) => api.put(`${DROPDOWN_ENDPOINTS[kind]}/${id}`, item),
  deleteDropdownItem: (kind, id) => api.delete(`${DROPDOWN_ENDPOINTS[kind]}/${id}`)
};
