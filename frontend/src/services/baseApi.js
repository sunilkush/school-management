import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";
import { clearAccessToken, getAccessToken } from "../api/authToken";
import { getErrorMessage } from "../utils/errorMessage";

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

  if (result.error?.status === 401) {
    clearAccessToken();
    api.dispatch({ type: "auth/forceLogout" });
    toast.error("Session expired. Please login again.");
  }

  if (result.error && result.error.status !== 401) {
    const message = getErrorMessage(result.error, "Request failed");
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
