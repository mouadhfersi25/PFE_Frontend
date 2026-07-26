// Auth API
import api from "../config/axiosConfig";
import { AUTH_ENDPOINTS } from "../config/endpoints";

const authApi = {
  register: (data: Record<string, unknown>) => api.post(AUTH_ENDPOINTS.REGISTER, data),
  login: (data: Record<string, unknown>) => api.post(AUTH_ENDPOINTS.LOGIN, data),
  verify: (token: string) =>
    api.get(`${AUTH_ENDPOINTS.VERIFY}?token=${encodeURIComponent(token)}`),
  forgotPassword: (email: string) => api.post(AUTH_ENDPOINTS.FORGOT, { email }),
  resetPassword: (data: Record<string, unknown>) => api.post(AUTH_ENDPOINTS.RESET, data),
  logout: () => api.post(AUTH_ENDPOINTS.LOGOUT),
};

export default authApi;
