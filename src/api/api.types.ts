/**
 * Interfaces alignées sur les DTOs / réponses du backend.
 * À utiliser pour consommer les APIs (auth, users, admin).
 *
 * Correspondance backend <-> frontend :
 * - POST /api/auth/register     body: RegisterRequest       response: MessageResponse
 * - GET  /api/auth/verify      query: token                 response: MessageResponse
 * - POST /api/auth/login       body: AuthRequest            response: AuthResponse
 * - POST /api/auth/forgot-password  body: ForgotPasswordRequest  response: MessageResponse
 * - POST /api/auth/reset-password   body: ResetPasswordRequest   response: MessageResponse
 * - POST /api/auth/logout      -                            response: MessageResponse
 * - GET  /api/users/me         -                            response: UserDTO
 * - PUT  /api/users/update-profile  body: UpdateProfileRequest   response: UserDTO
 * - PUT  /api/users/change-password body: ChangePasswordRequest  response: MessageResponse
 * - GET  /api/admin/users     -                            response: UserDTO[]
 * - GET  /api/admin/users/:id -                            response: UserDTO
 */

// ----- Auth (POST /api/auth/*) -----

/** POST /api/auth/login - body */
export interface AuthRequest {
  email: string;
  password: string;
}

/** POST /api/auth/login - response */
export interface AuthResponse {
  token: string;
  role: string;
  email: string;
}

/** POST /api/auth/register - body (RegisterRequest backend) */
export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  dateDeNaissance: string; // ISO date (YYYY-MM-DD)
  telephone?: string;
  avatarUrl?: string;
}

/** POST /api/auth/forgot-password - body */
export interface ForgotPasswordRequest {
  email: string;
}

/** POST /api/auth/reset-password - body */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/** Réponses message seul (register, verify, forgot, reset, logout) */
export interface MessageResponse {
  message: string;
}

// ----- User (GET/PUT /api/users/*) -----

/** GET /api/users/me - response. Aligné UserDTO backend (table users). */
export interface UserDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  password: string | null;
  telephone: string | null;
  avatarUrl: string | null;
  role: string;
  etatCompte: string;
  enabled: boolean;
  dateDeNaissance: string;
  niveau: number | null;
  scoreTotal: number | null;
  pointsExperience: number | null;
  idRegion: number | null;
  idGenre: number | null;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  tokenVerification: string | null;
  dateExpirationToken: string | null;
  dateDerniereConnexion: string | null;
  dateCreation: string | null;
}

/** PUT /api/users/update-profile - body */
export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  avatarUrl?: string | null;
  email?: string;
}

/** PUT /api/users/change-password - body */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ----- Admin (GET /api/admin/users) -----

/** GET /api/admin/users - response: UserDTO[] */
/** GET /api/admin/users/:id - response: UserDTO */
// (Utiliser UserDTO ci-dessus pour les deux.)

// ----- Admin Games (POST /api/admin/games) -----

/** Valeurs possibles pour typeJeu (backend enum TypeJeu) */
export type TypeJeu = 'QUIZ' | 'MEMOIRE' | 'REFLEXE' | 'LOGIQUE';

/** Valeurs possibles pour modeJeu (backend enum ModeJeu) */
export type ModeJeu = 'INDIVIDUEL' | 'COLLECTIF';

/** POST /api/admin/games - body */
export interface CreateGameRequest {
  titre: string;
  description?: string;
  difficulte?: number;
  ageMin?: number;
  ageMax?: number;
  typeJeu: TypeJeu;
  modeJeu: ModeJeu;
  dureeMinutes?: number;
  icone?: string;
  actif?: boolean;
}

/** PUT /api/admin/games/:id - body (champs optionnels) */
export interface UpdateGameRequest {
  titre?: string;
  description?: string;
  difficulte?: number;
  ageMin?: number;
  ageMax?: number;
  typeJeu?: TypeJeu;
  modeJeu?: ModeJeu;
  dureeMinutes?: number;
  icone?: string;
  actif?: boolean;
}

/** POST /api/admin/games - response (GET /api/admin/games, GET /api/admin/games/:id) */
export interface GameDTO {
  id: number;
  titre: string;
  description: string | null;
  difficulte: number | null;
  ageMin: number | null;
  ageMax: number | null;
  typeJeu: TypeJeu;
  modeJeu: ModeJeu;
  actif: boolean;
  dureeMinutes: number | null;
  icone: string | null;
  dateCreation: string | null;
}
