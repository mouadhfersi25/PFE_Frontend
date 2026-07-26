import api from '../config/axiosConfig';
import { EDUCATOR_ENDPOINTS } from '../config/endpoints';
import type {
  GameDTO,
  QuizQuestionDTO,
  CreateQuizQuestionRequest,
  UpdateQuizQuestionRequest,
  MemoryCardDTO,
  CreateMemoryCardRequest,
  UpdateMemoryCardRequest,
  EducatorDashboardStatsDTO,
  EducatorLearningStatsDTO,
  GenerateQuizPreviewRequest,
  LogicPuzzleDTO,
  CreateLogicPuzzleRequest,
  UpdateLogicPuzzleRequest,
  ReflexSettingsDTO,
  CreateOrUpdateReflexSettingsRequest,
} from '../types/api.types';

const educatorApi = {
  getGames: () => api.get<GameDTO[]>(EDUCATOR_ENDPOINTS.GAMES),
  getGameById: (id: number | string) => api.get<GameDTO>(EDUCATOR_ENDPOINTS.GAME_BY_ID(id)),
  createGame: (data: Record<string, unknown>) => api.post<GameDTO>(EDUCATOR_ENDPOINTS.GAMES, data),
  updateGame: (id: number | string, data: Record<string, unknown>) =>
    api.put<GameDTO>(EDUCATOR_ENDPOINTS.GAME_BY_ID(id), data),
  submitGame: (id: number | string) =>
    api.patch<GameDTO>(EDUCATOR_ENDPOINTS.GAME_SUBMIT(id)),
  generateGameCover: (id: number | string) =>
    api.post<GameDTO>(EDUCATOR_ENDPOINTS.GAME_COVER_GENERATE(id)),
  generateGameCoverPreview: (data: {
    titre?: string;
    description?: string;
    typeJeu?: 'QUIZ' | 'MEMOIRE' | 'LOGIQUE' | 'REFLEXE';
    ageMin?: number;
    ageMax?: number;
    difficulte?: number;
  }) => api.post<{ coverImageUrl: string }>(EDUCATOR_ENDPOINTS.GAME_COVER_GENERATE_PREVIEW, data),
  deleteGameCover: (id: number | string) =>
    api.delete<GameDTO>(EDUCATOR_ENDPOINTS.GAME_COVER_DELETE(id)),
  uploadGameCover: (id: number | string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<GameDTO>(EDUCATOR_ENDPOINTS.GAME_COVER_UPLOAD(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteGame: (id: number | string) => api.delete(EDUCATOR_ENDPOINTS.GAME_BY_ID(id)),
  getQuestions: (gameId: number) =>
    api.get<QuizQuestionDTO[]>(EDUCATOR_ENDPOINTS.QUESTIONS, { params: { gameId } }),
  getQuestionById: (id: number) =>
    api.get<QuizQuestionDTO>(EDUCATOR_ENDPOINTS.QUESTION_BY_ID(id)),
  createQuestion: (data: CreateQuizQuestionRequest) =>
    api.post<QuizQuestionDTO>(EDUCATOR_ENDPOINTS.QUESTIONS, data),
  updateQuestion: (id: number, data: UpdateQuizQuestionRequest) =>
    api.put<QuizQuestionDTO>(EDUCATOR_ENDPOINTS.QUESTION_BY_ID(id), data),
  deleteQuestion: (id: number) => api.delete(EDUCATOR_ENDPOINTS.QUESTION_BY_ID(id)),
  uploadQuestionMedia: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<QuizQuestionDTO>(EDUCATOR_ENDPOINTS.QUESTION_MEDIA_UPLOAD(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadQuestionPromptAudio: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<QuizQuestionDTO>(EDUCATOR_ENDPOINTS.QUESTION_PROMPT_AUDIO_UPLOAD(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  generateQuizPreview: (data: GenerateQuizPreviewRequest) =>
    api.post<QuizQuestionDTO[]>(EDUCATOR_ENDPOINTS.QUESTIONS_AI_GENERATE_PREVIEW, data, {
      timeout: 45000,
    }),
  getLogicPuzzles: (gameId: number) =>
    api.get<LogicPuzzleDTO[]>(EDUCATOR_ENDPOINTS.LOGIC_PUZZLES, { params: { gameId } }),
  createLogicPuzzle: (data: CreateLogicPuzzleRequest) =>
    api.post<LogicPuzzleDTO>(EDUCATOR_ENDPOINTS.LOGIC_PUZZLES, data),
  updateLogicPuzzle: (id: number, data: UpdateLogicPuzzleRequest) =>
    api.put<LogicPuzzleDTO>(`${EDUCATOR_ENDPOINTS.LOGIC_PUZZLES}/${id}`, data),
  deleteLogicPuzzle: (id: number) =>
    api.delete(`${EDUCATOR_ENDPOINTS.LOGIC_PUZZLES}/${id}`),
  getReflexSettings: (gameId: number) =>
    api.get<ReflexSettingsDTO>(EDUCATOR_ENDPOINTS.REFLEX_SETTINGS, { params: { gameId } }),
  upsertReflexSettings: (data: CreateOrUpdateReflexSettingsRequest) =>
    api.put<ReflexSettingsDTO>(EDUCATOR_ENDPOINTS.REFLEX_SETTINGS, data),

  getMemoryCards: (gameId: number) =>
    api.get<MemoryCardDTO[]>(EDUCATOR_ENDPOINTS.MEMORY_CARDS, { params: { gameId } }),
  createMemoryCard: (data: CreateMemoryCardRequest) =>
    api.post<MemoryCardDTO>(EDUCATOR_ENDPOINTS.MEMORY_CARDS, data),
  updateMemoryCard: (id: number, data: UpdateMemoryCardRequest) =>
    api.put<MemoryCardDTO>(EDUCATOR_ENDPOINTS.MEMORY_CARD_BY_ID(id), data),
  deleteMemoryCard: (id: number) => api.delete(EDUCATOR_ENDPOINTS.MEMORY_CARD_BY_ID(id)),

  getDashboardStats: () => api.get<EducatorDashboardStatsDTO>(EDUCATOR_ENDPOINTS.DASHBOARD_STATS),
  getLearningStats: () => api.get<EducatorLearningStatsDTO>(EDUCATOR_ENDPOINTS.LEARNING_STATS),
};

export default educatorApi;
