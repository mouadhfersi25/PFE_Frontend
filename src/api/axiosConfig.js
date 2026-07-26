// Axios Config
import axios from "axios";
import { ENV } from "../config/env";

const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 30000, // 30 secondes de timeout (pour laisser le temps même si l'email prend du temps)
});

// ➤ Injecter automatiquement le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ➤ Gestion automatique des erreurs 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Ne pas rediriger si on est déjà sur la page de login
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("auth_email");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
