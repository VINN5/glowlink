import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Users
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  getUser: (id: string) => api.get(`/users/${id}`),
  uploadProfilePicture: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/users/me/profile-picture', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Specialists
export const specialistsAPI = {
  list: (params?: any) => api.get('/specialists/', { params }),
  getById: (id: string) => api.get(`/specialists/${id}`),
  getAvailability: (id: string) => api.get(`/specialists/${id}/availability`),
  getMyProfile: () => api.get('/specialists/me'),
  createProfile: (data: any) => api.post('/specialists/profile', data),
  updateProfile: (data: any) => api.put('/specialists/me', data),
};

// Services
export const servicesAPI = {
  create: (data: any) => api.post('/services/', data),
  getBySpecialist: (specialistId: string) => api.get(`/services/specialist/${specialistId}`),
  getById: (id: string) => api.get(`/services/${id}`),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// Bookings
export const bookingsAPI = {
  create: (data: any) => api.post('/bookings/', data),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, data: any) => api.put(`/bookings/${id}/status`, data),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
};

// Portfolio
export const portfolioAPI = {
  upload: (file: File, caption = '', price = '') => {
    const form = new FormData();
    form.append('file', file);
    form.append('caption', caption);
    form.append('price', price);
    return api.post('/portfolio/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMine: () => api.get('/portfolio/me/items'),
  getBySpecialist: (specialistId: string) => api.get(`/portfolio/${specialistId}`),
  delete: (itemId: string) => api.delete(`/portfolio/${itemId}`),
};

// Reviews
export const reviewsAPI = {
  submit: (data: any) => api.post('/reviews/', data),
  getBySpecialist: (specialistId: string) => api.get(`/reviews/specialist/${specialistId}`),
  checkReviewed: (bookingId: string) => api.get(`/reviews/check/${bookingId}`),
};

// Messages
export const messagesAPI = {
  startConversation: (data: any) => api.post('/messages/conversations', data),
  listConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string) => api.get(`/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/messages/conversations/${conversationId}/messages`, { content }),
  getUnreadCount: () => api.get('/messages/unread'),
};

// Admin
export const adminAPI = {
  // Stats
  getStats: () =>
    api.get('/admin/stats'),

  // Users
  getUsers: (params?: { role?: string; search?: string; limit?: number; sort?: string }) =>
    api.get('/admin/users', { params }),

  updateUser: (userId: string, data: { role?: string; is_active?: boolean }) =>
    api.patch(`/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),

  // Specialists
  getSpecialists: (params?: { search?: string; verified?: boolean }) =>
    api.get('/admin/specialists', { params }),

  verifySpecialist: (specialistId: string, verify: boolean) =>
    api.patch(`/admin/specialists/${specialistId}/verify`, { is_verified: verify }),

  deleteSpecialist: (specialistId: string) =>
    api.delete(`/admin/specialists/${specialistId}`),

  // Verification queue (unverified specialists)
  getPendingVerifications: () =>
    api.get('/admin/specialists', { params: { verified: false } }),

  // Bookings (kept from your original)
  listBookings: () =>
    api.get('/admin/bookings'),
};


export const paymentsAPI = {
  initiate: (bookingId: string, phone: string) =>
    api.post('/payments/pay', { booking_id: bookingId, phone }),

  status: (bookingId: string) =>
    api.get(`/payments/status/${bookingId}`),
};

export default api;