import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export const secureStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens({ accessToken, refreshToken }) {
    await Promise.all([
      accessToken ? SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken) : Promise.resolve(),
      refreshToken ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken) : Promise.resolve(),
    ]);
  },
  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
