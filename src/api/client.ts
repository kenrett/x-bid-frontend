import axios, { type AxiosError, type AxiosInstance } from "axios";
import { showToast } from "@/services/toast";

const baseURL =
  typeof import.meta.env.VITE_API_URL === "string"
    ? import.meta.env.VITE_API_URL
    : undefined;

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // set true if using cookies for auth
}) as AxiosInstance;

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error?.response?.status;
    if (status === 503) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/maintenance")) {
        window.location.assign("/maintenance");
      }
    } else if (status === 401 || status === 403) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionTokenId");
      showToast("Your session expired; please sign in again.", "error");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default client;
