// User Service
import userApi from "../api/user.api";
import storage from "../utils/storage";

export const userService = {
  async getProfile() {
    const res = await userApi.getMe();
    return res.data;
  },

  async updateProfile(data) {
    const res = await userApi.updateProfile(data);
    // Mettre à jour le storage si nécessaire
    if (res.data.email) {
      storage.set("auth_email", res.data.email);
    }
    if (res.data.prenom != null) {
      storage.set("auth_prenom", res.data.prenom);
    }
    if (res.data.nom != null) {
      storage.set("auth_nom", res.data.nom);
    }
    return res.data;
  },

  async changePassword(data) {
    const res = await userApi.changePassword(data);
    return res.data;
  },
};
