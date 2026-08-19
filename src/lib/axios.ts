import axios from "axios";
import { getToken, getRefreshToken, setTokens, clearToken } from "./storage";
import { emitApiError } from "./error-bus";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
  withCredentials: true,
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (!error.response) {
      emitApiError({
        message: "Cannot connect to server. Please check backend status.",
        raw: error,
      });
      return Promise.reject(error);
    }

    const status = error.response.status; 

    // ===============================
      // MAINTENANCE MODE
      // ===============================
      if (status === 503) {

        // Prevent redirect loop
        if (window.location.pathname !== "/maintenance") {
          window.location.href = "/maintenance";
        }

        return Promise.reject(error);
      }

    // ===============================
    // TOKEN EXPIRED → TRY REFRESH
    // ===============================
    if (status === 401 && !error.config._retry) {

      const refreshToken = getRefreshToken();

      // 🚫 If refresh token does not exist, do not attempt refresh
      if (!refreshToken) {
        emitApiError({
          message: error.response.data?.message || "Unauthorized request",
          status,
          raw: error,
        });
        return Promise.reject(error);
      }

      error.config._retry = true;

      try {
        console.warn("🔄 Attempting token refresh...");

        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        const { access_token, refresh_token } = refreshResponse.data;

        if (!access_token) {
          throw new Error("Refresh did not return access token");
        }

        // Store new tokens
        setTokens(access_token, refresh_token);

        // Retry original request with new token
        error.config.headers = error.config.headers || {};
        error.config.headers.Authorization = `Bearer ${access_token}`;

        return api(error.config);

      } catch (refreshError) {
        console.warn("❌ Refresh failed. Logging out.");

        clearToken();
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    // ===============================
    // ACCOUNT DISABLED / TERMINATED
    // ===============================
    if (
      status === 403 &&
      error.response.data?.error === "Account access disabled"
    ) {
      console.warn("🚫 Account disabled. Logging out.");

      clearToken();

      // optional:
      localStorage.clear();
      sessionStorage.clear();

      // prevent redirect loop
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // ===============================
    // OTHER API ERRORS
    // ===============================
    emitApiError({
      message: error.response.data?.message || error.message,
      status,
      raw: error,
    });

    return Promise.reject(error);
  }
);