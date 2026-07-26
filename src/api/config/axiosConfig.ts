// Axios Config
import axios, { AxiosError } from "axios";
import { ENV } from "../../config/env";

const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("auth_email");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
