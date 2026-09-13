import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";
import { clearAccessToken, getAccessToken } from "../api/authToken";
import { clearHttpCache } from "../api/httpClient";

const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.accessToken || getAccessToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithGlobalHandling = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // RTK Query talks to the API over fetch, not the axios client, so its writes
  // would otherwise leave that client's cached reads of the same data in place.
  const method = (typeof args === "string" ? "GET" : args?.method || "GET").toUpperCase();
  if (method !== "GET") clearHttpCache();

  if (result.error?.status === 401) {
    clearAccessToken();
    api.dispatch({ type: "auth/forceLogout" });
    toast.error("Session expired. Please login again.");
  }

  if (result.error && result.error.status !== 401) {
    const message = result.error.data?.message || "Request failed";
    toast.error(message);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithGlobalHandling,
  tagTypes: ["Profile", "Subject", "Class"],
  endpoints: () => ({}),
});
