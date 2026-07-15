import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { secureStorage } from '../utils/secureStorage';

// In-memory cache so every request doesn't have to await SecureStore.
let accessToken = null;
let refreshToken = null;
let refreshInFlight = null;
let onSessionExpired = null;

export function setAuthTokens(tokens) {
  accessToken = tokens?.accessToken ?? accessToken;
  refreshToken = tokens?.refreshToken ?? refreshToken;
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
}

export async function hydrateAuthTokens() {
  const [storedAccess, storedRefresh] = await Promise.all([
    secureStorage.getAccessToken(),
    secureStorage.getRefreshToken(),
  ]);
  accessToken = storedAccess;
  refreshToken = storedRefresh;
  return { accessToken, refreshToken };
}

// Registered once by the store so a failed refresh can dispatch logout
// without api/client.js importing the store directly (avoids a circular import).
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.headers?.skipAuth) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function performRefresh() {
  if (!refreshToken) throw new Error('No refresh token available');
  const response = await axios.post(`${API_BASE_URL}/user/refresh-token`, { refreshToken });
  const newAccessToken = response.data?.data?.accessToken;
  const newRefreshToken = response.data?.data?.refreshToken ?? refreshToken;
  if (!newAccessToken) throw new Error('Refresh response missing accessToken');

  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  await secureStorage.setTokens({ accessToken, refreshToken });
  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthRoute = config?.url?.includes('/user/login') || config?.url?.includes('/user/refresh-token');

    if (response?.status === 401 && !config._retry && !isAuthRoute) {
      config._retry = true;
      try {
        refreshInFlight = refreshInFlight ?? performRefresh();
        const freshToken = await refreshInFlight;
        refreshInFlight = null;
        config.headers.Authorization = `Bearer ${freshToken}`;
        return apiClient(config);
      } catch (refreshError) {
        refreshInFlight = null;
        clearAuthTokens();
        await secureStorage.clearTokens();
        if (onSessionExpired) onSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
