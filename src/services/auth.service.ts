// Auth Service
import authApi from "../api/auth";
import storage from "../utils/storage";

const TOKEN_KEY = "jwt_token";

export const authService = {
  async login(data: Record<string, unknown>, remember = true) {
    const res = await authApi.login(data);
    const responseData = res.data as Record<string, unknown>;
    storage.setRemember(remember);
    const token = (responseData.accessToken ?? responseData.token) as string | undefined;
    if (!token) {
      throw new Error("Réponse de connexion invalide (jeton manquant)");
    }
    storage.set(TOKEN_KEY, token);
    if (responseData.role != null && responseData.role !== "") {
      storage.set("auth_role", String(responseData.role).toUpperCase());
    }
    if (responseData.email) {
      storage.set("auth_email", String(responseData.email));
    }
    return responseData;
  },

  async register(data: Record<string, unknown>) {
    const res = await authApi.register(data);
    return res.data;
  },

  async verify(token: string) {
    const res = await authApi.verify(token);
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await authApi.forgotPassword(email);
    return res.data;
  },

  async resetPassword(data: Record<string, unknown>) {
    const res = await authApi.resetPassword(data);
    return res.data;
  },

  logout() {
    storage.remove("jwt_token");
    storage.remove("auth_role");
    storage.remove("auth_email");
    storage.remove("auth_prenom");
    storage.remove("auth_nom");
  },

  isAuthenticated(): boolean {
    return storage.get(TOKEN_KEY) !== null;
  },

  getToken(): string | null {
    return storage.get(TOKEN_KEY);
  },

  getRole(): string | null {
    return storage.get("auth_role");
  },

  isAdmin(): boolean {
    return (this.getRole() || "").toUpperCase() === "ADMIN";
  },

  isSponsor(): boolean {
    return (this.getRole() || "").toUpperCase() === "SPONSOR";
  },
};
