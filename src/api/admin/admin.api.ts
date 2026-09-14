// Admin API
import api from "../config/axiosConfig";
import { ADMIN_ENDPOINTS } from "../config/endpoints";
import type {
  CreateBadgeRequest,
  UpdateBadgeRequest,
  EtatJeu,
  ChangeGameStatusRequest,
  CreateGameRequest,
  UpdateGameRequest,
  GameDTO,
  QuizQuestionDTO,
  MemoryCardDTO,
  LogicPuzzleDTO,
  ReflexSettingsDTO,
  GameAiReviewDTO,
  AdminScoringDistributionDTO,
  AdminDaySessionCountDTO,
  AdminRecentActivityDTO,
  AdminStatisticsOverviewDTO,
  UserDTO,
  SetParentLinkRequest,
  ReclamationDTO,
  UpdateReclamationRequest,
} from "../types/api.types";

const adminApi = {
  getUsers: () => api.get(ADMIN_ENDPOINTS.USERS),
  createStaffUser: (data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    dateDeNaissance: string;
    role: 'EDUCATEUR' | 'SPONSOR';
    telephone: string;
    genre: 'HOMME' | 'FEMME';
  }) => api.post<UserDTO>(ADMIN_ENDPOINTS.USERS, data),
  getUserById: (id: number | string) =>
    api.get(ADMIN_ENDPOINTS.USER_BY_ID(id), { params: { _t: Date.now() } }),
  suspendUser: (id: number | string) => api.post(ADMIN_ENDPOINTS.SUSPEND_USER(id)),
  reactivateUser: (id: number | string) => api.post(ADMIN_ENDPOINTS.REACTIVATE_USER(id)),
  updateUserRole: (id: number | string, role: string) =>
    api.put(ADMIN_ENDPOINTS.USER_ROLE(id), { role: String(role) }),
  setUserParentLink: (childUserId: number | string, body: SetParentLinkRequest) =>
    api.put<UserDTO>(ADMIN_ENDPOINTS.USER_PARENT_LINK(childUserId), body),
  getActiveSessionsCount: () =>
    api.get<{ activeSessions: number }>(ADMIN_ENDPOINTS.ACTIVE_SESSIONS_COUNT),
  getScoringDistribution: () =>
    api.get<AdminScoringDistributionDTO[]>(ADMIN_ENDPOINTS.SCORING_DISTRIBUTION),
  getStatisticsSessionsByDay: () =>
    api.get<AdminDaySessionCountDTO[]>(ADMIN_ENDPOINTS.STATISTICS_SESSIONS_BY_DAY),
  getStatisticsRecentActivity: (limit = 20) =>
    api.get<AdminRecentActivityDTO[]>(ADMIN_ENDPOINTS.STATISTICS_RECENT_ACTIVITY, { params: { limit } }),
  getStatisticsOverview: () =>
    api.get<AdminStatisticsOverviewDTO>(ADMIN_ENDPOINTS.STATISTICS_OVERVIEW),
  getGames: () => api.get<GameDTO[]>(ADMIN_ENDPOINTS.GAMES),
  getGameById: (id: number | string) => api.get<GameDTO>(ADMIN_ENDPOINTS.GAME_BY_ID(id)),
  getGameAiReview: (id: number | string) => api.get<GameAiReviewDTO>(ADMIN_ENDPOINTS.GAME_AI_REVIEW(id)),
  createGame: (data: CreateGameRequest) => api.post<GameDTO>(ADMIN_ENDPOINTS.GAMES, data),
  updateGame: (id: number | string, data: UpdateGameRequest) =>
    api.put<GameDTO>(ADMIN_ENDPOINTS.GAME_BY_ID(id), data),
  updateGameStatus: (id: number | string, etat: EtatJeu, motifRefus?: string) => {
    const payload: ChangeGameStatusRequest = {
      etat,
      ...(motifRefus ? { motifRefus } : {}),
    };
    return api.patch(ADMIN_ENDPOINTS.GAME_STATUS(id), payload);
  },
  getGameQuestions: (id: number | string) => api.get<QuizQuestionDTO[]>(ADMIN_ENDPOINTS.GAME_QUESTIONS(id)),
  getGameMemoryCards: (id: number | string) => api.get<MemoryCardDTO[]>(ADMIN_ENDPOINTS.GAME_MEMORY_CARDS(id)),
  getGameLogicPuzzles: (id: number | string) => api.get<LogicPuzzleDTO[]>(ADMIN_ENDPOINTS.GAME_LOGIC_PUZZLES(id)),
  getGameReflexSettings: (id: number | string) => api.get<ReflexSettingsDTO | null>(ADMIN_ENDPOINTS.GAME_REFLEX_SETTINGS(id)),
  deleteGame: (id: number | string) => api.delete(ADMIN_ENDPOINTS.GAME_BY_ID(id)),
  getBadges: () => api.get(ADMIN_ENDPOINTS.BADGES),
  getBadgeById: (id: number | string) => api.get(ADMIN_ENDPOINTS.BADGE_BY_ID(id)),
  createBadge: (data: CreateBadgeRequest) => api.post(ADMIN_ENDPOINTS.BADGES, data),
  updateBadge: (id: number | string, data: UpdateBadgeRequest) =>
    api.put(ADMIN_ENDPOINTS.BADGE_BY_ID(id), data),
  deleteBadge: (id: number | string) => api.delete(ADMIN_ENDPOINTS.BADGE_BY_ID(id)),
  getReclamations: (pending?: boolean) =>
    api.get<ReclamationDTO[]>(ADMIN_ENDPOINTS.RECLAMATIONS, {
      params: pending === undefined ? {} : { pending },
    }),
  getReclamationsPendingCount: () =>
    api.get<{ count: number }>(ADMIN_ENDPOINTS.RECLAMATIONS_PENDING_COUNT),
  updateReclamation: (id: number | string, data: UpdateReclamationRequest) =>
    api.patch<ReclamationDTO>(ADMIN_ENDPOINTS.RECLAMATION_BY_ID(id), data),
  deactivateGame: (id: number | string, motif: string) =>
    api.patch(ADMIN_ENDPOINTS.GAME_DEACTIVATE(id), { motif }),
  activateGame: (id: number | string) =>
    api.patch(ADMIN_ENDPOINTS.GAME_ACTIVATE(id)),
  acceptReactivation: (id: number | string) =>
    api.patch(ADMIN_ENDPOINTS.GAME_REACTIVATION_ACCEPT(id)),
  rejectReactivation: (id: number | string, motif: string) =>
    api.patch(ADMIN_ENDPOINTS.GAME_REACTIVATION_REJECT(id), { motif }),
};

export default adminApi;
