// Axios Config
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { ENV } from "../../config/env";
import storage from "../../utils/storage";

const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = storage.get("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Plusieurs requêtes peuvent échouer en 401 quasi simultanément (polling, appels parallèles) :
// on ne redirige/notifie qu'une seule fois pour éviter le spam de toasts.
let redirectingToLogin = false;

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (
      err.response?.status === 401 &&
      !redirectingToLogin &&
      !window.location.pathname.includes("/login")
    ) {
      redirectingToLogin = true;
      storage.remove("jwt_token");
      storage.remove("auth_role");
      storage.remove("auth_email");
      toast.error("Session expirée. Veuillez vous reconnecter.");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
