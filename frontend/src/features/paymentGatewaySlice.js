import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/httpClient";

/**
 * The school's online payment gateways (School Admin). Results go straight back to the settings
 * screen that asked — nothing else in the app reads them — so there is no reducer.
 */

const message = (err, fallback) => err.response?.data?.message || fallback;

export const fetchSchoolGateways = createAsyncThunk("paymentGateways/fetch", async (_, { rejectWithValue }) => {
  try {
    return (await apiClient.get("/payment-gateways")).data?.data;
  } catch (err) {
    return rejectWithValue(message(err, "Failed to load payment gateways"));
  }
});

export const saveSchoolGateway = createAsyncThunk("paymentGateways/save", async ({ provider, mode, credentials }, { rejectWithValue }) => {
  try {
    return (await apiClient.put(`/payment-gateways/${provider}`, { mode, credentials })).data;
  } catch (err) {
    return rejectWithValue(message(err, "Failed to save gateway details"));
  }
});

export const testSchoolGateway = createAsyncThunk("paymentGateways/test", async (provider, { rejectWithValue }) => {
  try {
    return (await apiClient.post(`/payment-gateways/${provider}/test`)).data?.data;
  } catch (err) {
    return rejectWithValue(message(err, "Connection test failed"));
  }
});

export const activateSchoolGateway = createAsyncThunk("paymentGateways/activate", async (provider, { rejectWithValue }) => {
  try {
    return (await apiClient.post(`/payment-gateways/${provider}/activate`)).data;
  } catch (err) {
    return rejectWithValue(message(err, "Failed to activate gateway"));
  }
});

export const deactivateSchoolGateway = createAsyncThunk("paymentGateways/deactivate", async (provider, { rejectWithValue }) => {
  try {
    return (await apiClient.post(`/payment-gateways/${provider}/deactivate`)).data;
  } catch (err) {
    return rejectWithValue(message(err, "Failed to disable gateway"));
  }
});
