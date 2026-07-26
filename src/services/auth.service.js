// Auth Service
import authApi from "../api/auth.api";
import storage from "../utils/storage";

const TOKEN_KEY = "jwt_token";

export const authService = {
  async login(data) {
    const res = await authApi.login(data);
    const responseData = res.data;

    // Sauvegarde du token dans localStorage
    const token = responseData.accessToken || responseData.token;
    if (token) {
      storage.set(TOKEN_KEY, token);
    }

    // Sauvegarder le rôle (toujours en majuscules) et l'email pour la redirection
    if (responseData.role != null && responseData.role !== "") {
      storage.set("auth_role", String(responseData.role).toUpperCase());
    }
    if (responseData.email) {
      storage.set("auth_email", responseData.email);
    }

    return responseData;
  },

  async register(data) {
    const res = await authApi.register(data);
    return res.data;
  },

  async verify(token) {
    const res = await authApi.verify(token);
    return res.data;
  },

  async forgotPassword(email) {
    const res = await authApi.forgotPassword(email);
    return res.data;
  },

  async resetPassword(data) {
    const res = await authApi.resetPassword(data);
    return res.data;
  },

  async logout() {
    // Nettoyer le storage local (le backend n'a pas d'endpoint logout pour JWT stateless)
    storage.remove("jwt_token");
    storage.remove("auth_role");
    storage.remove("auth_email");
    
    // Optionnel : appeler le backend si l'endpoint existe (actuellement désactivé)
    // try {
    //   await authApi.logout();
    // } catch (e) {
    //   // Ignorer l'erreur si l'endpoint n'existe pas
    // }
  },

  isAuthenticated() {
    return storage.get(TOKEN_KEY) !== null;
  },

  getToken() {
    return storage.get(TOKEN_KEY);
  },

  getRole() {
    return storage.get("auth_role");
  },

  isAdmin() {
    return (this.getRole() || "").toUpperCase() === "ADMIN";
  }
};
