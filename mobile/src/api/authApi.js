import { apiClient } from './client';

export const authApi = {
  login: (email, password) => apiClient.post('/user/login', { email, password }),

  logout: () => apiClient.post('/user/logout'),

  forgotPassword: (email) => apiClient.post('/user/forgot-password', { email }),

  resetPassword: (token, password) => apiClient.post(`/user/reset-password/${token}`, { password }),

  resendVerification: (email) => apiClient.post('/user/resend-verification', { email }),

  getProfile: () => apiClient.get('/user/me'),

  getMyPermissions: () => apiClient.get('/user/my-permissions'),

  updateProfile: (payload) => apiClient.put('/user/update', payload),

  changePassword: (payload) => apiClient.put('/user/change-password', payload),
};
