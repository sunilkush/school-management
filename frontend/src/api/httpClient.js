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
      clearHttpCache(); // never let the next session read this one's cached responses
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


/* ── GET dedup + short-lived response cache ───────────────────────────────
 * Every screen in the app fetches on mount through this client and nothing
 * above it caches, so moving A → B → A refires the requests A already made
 * seconds earlier and each visit shows a loader for data the browser just had.
 * Two things now sit in front of the network:
 *
 *   - in-flight dedup: identical GETs issued while one is still open share
 *     that one response rather than opening a second connection. Several
 *     components mounting together and each asking for the same reference
 *     data (classes, sections, academic years) is the common case.
 *   - a 30s TTL: a repeat GET within half a minute is answered from memory.
 *
 * Any write clears the whole cache, so a create/update/delete can never be
 * followed by a stale read. Thirty seconds is deliberately short: long enough
 * to cover reading one screen and stepping back to the last one, short enough
 * that a change made elsewhere (another user, a cron job) cannot sit on screen
 * for long. Live views that poll on their own timer — bus tracking — pass
 * `noCache`.
 *
 * Cache hits hand back a copy of the payload, never the stored object: a
 * thunk's result goes into Redux, where RTK deep-freezes it in development,
 * and a second consumer receiving that same frozen object would fail on any
 * in-place edit.
 */
const GET_CACHE_TTL_MS = 30_000;

const responseCache = new Map(); // key -> { at, response }
const inFlightGets = new Map(); // key -> Promise<response>

const cacheKeyFor = (url, config) =>
  `${url}|${config?.params ? JSON.stringify(config.params) : ""}`;

const copyResponse = (response) => {
  try {
    return { ...response, data: structuredClone(response.data) };
  } catch {
    // Non-cloneable payload (a Blob, say). Hand back the original rather than
    // failing the request; those endpoints are not the ones being cached for.
    return response;
  }
};

/** Drop every cached read. Called on writes, and on any change of identity. */
export const clearHttpCache = () => {
  responseCache.clear();
  inFlightGets.clear();
};

const rawGet = httpClient.get.bind(httpClient);

httpClient.get = (url, config = {}) => {
  if (config.noCache) return rawGet(url, config);

  const key = cacheKeyFor(url, config);

  const hit = responseCache.get(key);
  if (hit && Date.now() - hit.at < GET_CACHE_TTL_MS) {
    return Promise.resolve(copyResponse(hit.response));
  }

  const pending = inFlightGets.get(key);
  if (pending) return pending.then(copyResponse);

  const request = rawGet(url, config).then((response) => {
    responseCache.set(key, { at: Date.now(), response });
    return response;
  });

  // Kept out of the chain above so a rejection clears the slot without
  // turning into an unhandled rejection of its own.
  inFlightGets.set(
    key,
    request.finally(() => inFlightGets.delete(key))
  );

  return request.then(copyResponse);
};

// Writes invalidate every cached read. Cleared even when the request fails:
// a rejected write can still have changed something server-side, and the cost
// of being wrong here is only a cache miss.
for (const method of ["post", "put", "patch", "delete"]) {
  const rawWrite = httpClient[method].bind(httpClient);
  httpClient[method] = (...args) => {
    const result = rawWrite(...args);
    result.finally(clearHttpCache).catch(() => {});
    return result;
  };
}
export default httpClient;
