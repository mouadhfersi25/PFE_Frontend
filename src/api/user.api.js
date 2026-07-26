// User API
import api from "./axiosConfig";
import { USER_ENDPOINTS } from "./endpoints";

const userApi = {
  getMe: () => api.get(USER_ENDPOINTS.ME),
  
  updateProfile: (data) => api.put(USER_ENDPOINTS.UPDATE_PROFILE, data),
  
  changePassword: (data) => api.put(USER_ENDPOINTS.CHANGE_PASSWORD, data),
};

export default userApi;
