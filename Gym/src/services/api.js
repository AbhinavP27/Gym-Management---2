import axios from "axios";
import { AUTH_KEYS, clearAuthStorage, getAuthItem } from "../utils/authStorage";

const API_BASE_URL = "http://localhost:8000/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = getAuthItem(AUTH_KEYS.accessToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh (optional refinement later)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't redirect if we are specifically trying to log in
      if (originalRequest.url.includes("token/")) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      clearAuthStorage();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
