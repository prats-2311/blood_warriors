import axios from "axios";
import { supabase } from "../utils/supabase";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Create axios instance with retry configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Connection: "keep-alive",
  },
  timeout: 30000, // 30 second timeout
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Add retry logic for network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Check if it's a network error that should be retried
    const isNetworkError =
      error.code === "ECONNRESET" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT" ||
      error.code === "NETWORK_ERROR" ||
      !error.response;

    // Retry logic
    if (isNetworkError && config && !config.__isRetryRequest) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < (config.retry || 3)) {
        config.__retryCount++;
        config.__isRetryRequest = true;

        const delay =
          (config.retryDelay || 1000) * Math.pow(2, config.__retryCount - 1);
        console.log(
          `Network error, retrying request in ${delay}ms... (attempt ${config.__retryCount})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // Handle auth errors
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
