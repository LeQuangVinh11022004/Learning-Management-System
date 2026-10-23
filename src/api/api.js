import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3200/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
