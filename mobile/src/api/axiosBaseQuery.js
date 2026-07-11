import { apiClient } from './client';

// Routes RTK Query through our existing axios instance so every request still goes through
// the Bearer-header injection and 401-refresh-and-retry interceptors set up in client.js.
export function axiosBaseQuery() {
  return async ({ url, method = 'get', data, params }) => {
    try {
      const response = await apiClient.request({ url, method, data, params });
      return { data: response.data?.data };
    } catch (error) {
      return {
        error: {
          status: error?.response?.status,
          message: error?.response?.data?.message || error.message || 'Something went wrong',
        },
      };
    }
  };
}
