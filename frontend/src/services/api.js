import axios from "axios";
import { supabase } from "../utils/supabase";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Create axios instance with retry configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Use JWT tokens from localStorage instead of Supabase session
      const accessToken = localStorage.getItem("blood_warriors_access_token");

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log("Added JWT token to request:", config.url);
      } else {
        console.log("No JWT token found for request:", config.url);
      }
    } catch (error) {
      console.error("Error getting JWT token for API request:", error);
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

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
      // Only redirect to login if we're not already on login page
      // and if this is not a chat history request (which can fail gracefully)
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === "/login" || currentPath === "/";
      const isChatHistoryRequest = error.config?.url?.includes(
        "/ai/carebot/history"
      );

      if (!isLoginPage && !isChatHistoryRequest) {
        console.log(
          "Authentication failed, clearing tokens and redirecting to login"
        );
        // Clear invalid tokens
        localStorage.removeItem("blood_warriors_access_token");
        localStorage.removeItem("blood_warriors_refresh_token");
        window.location.href = "/login";
      } else {
        console.log("Authentication failed but not redirecting:", {
          currentPath,
          isChatHistoryRequest,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
