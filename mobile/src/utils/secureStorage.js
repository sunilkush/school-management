import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const isWeb = Platform.OS === 'web';

// expo-secure-store has no native web implementation — its web module is an empty stub, so
// every SecureStore.*Async call throws there. That broke login on web (the request itself
// succeeded, but persisting the returned tokens threw, so the whole flow surfaced as "Unable
// to sign in" and nothing past the login screen could ever render). AsyncStorage (backed by
// localStorage on web) is the standard fallback for web/dev preview; native builds keep using
// the real Keychain/Keystore-backed SecureStore.
const getItem = (key) => (isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key));
const setItem = (key, value) => (isWeb ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value));
const removeItem = (key) => (isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key));

export const secureStorage = {
  async getAccessToken() {
    return getItem(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return getItem(REFRESH_TOKEN_KEY);
  },
  async setTokens({ accessToken, refreshToken }) {
    await Promise.all([
      accessToken ? setItem(ACCESS_TOKEN_KEY, accessToken) : Promise.resolve(),
      refreshToken ? setItem(REFRESH_TOKEN_KEY, refreshToken) : Promise.resolve(),
    ]);
  },
  async clearTokens() {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
