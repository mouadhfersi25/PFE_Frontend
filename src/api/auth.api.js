// Auth API
import api from "./axiosConfig";
import { AUTH_ENDPOINTS } from "./endpoints";

const authApi = {
  register: (data) => api.post(AUTH_ENDPOINTS.REGISTER, data),
  login: (data) => api.post(AUTH_ENDPOINTS.LOGIN, data),
  verify: (token) => api.get(`${AUTH_ENDPOINTS.VERIFY}?token=${encodeURIComponent(token)}`),
  forgotPassword: (email) => api.post(AUTH_ENDPOINTS.FORGOT, { email }),
  resetPassword: (data) => api.post(AUTH_ENDPOINTS.RESET, data),
  logout: () => api.post(AUTH_ENDPOINTS.LOGOUT),


};

export default authApi;
