import axios from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";

const API_URL_V1 = import.meta.env.VITE_API_URL || "/api/v1";

const httpClient = axios.create({
  baseURL: API_URL_V1,
  withCredentials: true,
});

let authStore;

export const attachAuthStore = (store) => {
  authStore = store;
};

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise = null;

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;

    if (!isUnauthorized || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const endpoint = originalRequest.url || "";
    if (endpoint.includes("/user/login") || endpoint.includes("/user/refresh-token")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise = refreshPromise || axios.post(`${API_URL_V1}/user/refresh-token`, {}, { withCredentials: true });
      const refreshResponse = await refreshPromise;
      const payload = refreshResponse.data?.data || {};
      const refreshedToken = payload.accessToken;

      if (!refreshedToken) {
        throw new Error("Missing access token after refresh");
      }

      setAccessToken(refreshedToken);
      authStore?.dispatch({
        type: "auth/setCredentials",
        payload: {
          user: payload.user ?? authStore?.getState()?.auth?.user ?? null,
          accessToken: refreshedToken,
        },
      });

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;

      return httpClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      authStore?.dispatch({ type: "auth/forceLogout" });

      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }

      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export default httpClient;
