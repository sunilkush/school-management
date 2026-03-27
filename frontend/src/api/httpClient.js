import axios from "axios";
import { forceLogout, setCredentials } from "../features/authSlice";

const API_URL = import.meta.env.VITE_API_URL;

const httpClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 🔥 IMPORTANT
});

let store;

export const attachStore = (_store) => {
  store = _store;
};

// ✅ REQUEST → no token needed (cookie auto send)
httpClient.interceptors.request.use((config) => {
  return config;
});

// 🔁 RESPONSE → refresh logic
let refreshPromise = null;

httpClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise =
        refreshPromise ||
        axios.post(
          `${API_URL}/user/refresh-token`,
          {},
          { withCredentials: true }
        );

      const res = await refreshPromise;
      const { accessToken, user } = res.data.data;

      store?.dispatch(setCredentials({ user, accessToken }));

      return httpClient(originalRequest);
    } catch (err) {
      store?.dispatch(forceLogout());
      return Promise.reject(err);
    } finally {
      refreshPromise = null;
    }
  }
);
export default  httpClient