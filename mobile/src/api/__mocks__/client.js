// Manual mock — activate per test file with jest.mock('../../api/client') (path relative to the
// test file). Every RTK Query endpoint routes through apiClient.request() via axiosBaseQuery(),
// so mocking it here is enough to keep screen smoke tests from making real network calls.
export const apiClient = {
  request: jest.fn().mockResolvedValue({ data: { data: [] } }),
};

export const setAuthTokens = jest.fn();
export const clearAuthTokens = jest.fn();
export const hydrateAuthTokens = jest.fn().mockResolvedValue({ accessToken: null, refreshToken: null });
export const setSessionExpiredHandler = jest.fn();
