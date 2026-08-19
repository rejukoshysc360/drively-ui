// ===============================
// TOKEN STORAGE HELPERS
// ===============================

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// -------------------------------
// Get access token
// -------------------------------
export const getToken = (): string => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
};

// -------------------------------
// Get refresh token
// -------------------------------
export const getRefreshToken = (): string => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
};

// -------------------------------
// Save access token only
// (used by AuthProvider)
// -------------------------------
export const setToken = (token: string): void => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

// -------------------------------
// Save both tokens
// (used by refresh interceptor)
// -------------------------------
export const setTokens = (access: string, refresh: string): void => {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
};

// -------------------------------
// Clear tokens
// -------------------------------
export const clearToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// -------------------------------
// Helper
// -------------------------------
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
};