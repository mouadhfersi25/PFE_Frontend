// Admin API (appels réservés au rôle ADMIN)
import api from "./axiosConfig";
import { ADMIN_ENDPOINTS } from "./endpoints";

const adminApi = {
  /** GET /api/admin/users - liste tous les utilisateurs (UserDTO) */
  getUsers: () => api.get(ADMIN_ENDPOINTS.USERS),
  /** GET /api/admin/users/:id - profil d'un utilisateur (UserDTO), sans cache pour afficher les données à jour */
  getUserById: (id) => api.get(ADMIN_ENDPOINTS.USER_BY_ID(id), { params: { _t: Date.now() } }),
  /** POST /api/admin/users/suspend/:id - suspendre un utilisateur */
  suspendUser: (id) => api.post(ADMIN_ENDPOINTS.SUSPEND_USER(id)),
  /** POST /api/admin/users/reactivate/:id - réactiver un utilisateur */
  reactivateUser: (id) => api.post(ADMIN_ENDPOINTS.REACTIVATE_USER(id)),
  /** PUT /api/admin/users/:id/change-role - changer le rôle (body: { role: "JOUEUR" | "PARENT" | "EDUCATEUR" }) */
  updateUserRole: (id, role) => api.put(ADMIN_ENDPOINTS.USER_ROLE(id), { role: String(role) }),
  /** GET /api/admin/games - liste tous les jeux (GameDTO[]) */
  getGames: () => api.get(ADMIN_ENDPOINTS.GAMES),
  /** GET /api/admin/games/:id - détail d'un jeu (GameDTO) */
  getGameById: (id) => api.get(ADMIN_ENDPOINTS.GAME_BY_ID(id)),
  /** POST /api/admin/games - créer un jeu (body: CreateGameRequest), response: GameDTO */
  createGame: (data) => api.post(ADMIN_ENDPOINTS.GAMES, data),
  /** PUT /api/admin/games/:id - mettre à jour un jeu (body: UpdateGameRequest), response: GameDTO */
  updateGame: (id, data) => api.put(ADMIN_ENDPOINTS.GAME_BY_ID(id), data),
  /** DELETE /api/admin/games/:id - supprimer un jeu */
  deleteGame: (id) => api.delete(ADMIN_ENDPOINTS.GAME_BY_ID(id)),
};

export default adminApi;
