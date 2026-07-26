// User Service
import userApi from "../api/user";
import storage from "../utils/storage";

export const userService = {
  async getProfile() {
    const res = await userApi.getMe();
    return res.data;
  },

  async updateProfile(data: Record<string, unknown>) {
    const res = await userApi.updateProfile(data);
    if (res.data?.email) storage.set("auth_email", res.data.email as string);
    if (res.data?.prenom != null) storage.set("auth_prenom", res.data.prenom as string);
    if (res.data?.nom != null) storage.set("auth_nom", res.data.nom as string);
    return res.data;
  },

  async changePassword(data: Record<string, unknown>) {
    const res = await userApi.changePassword(data);
    return res.data;
  },
};
