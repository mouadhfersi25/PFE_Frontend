/**
 * Interfaces alignées sur les DTOs / réponses du backend.
 * À utiliser pour consommer les APIs (auth, users, admin).
 */

// ----- Auth (POST /api/auth/*) -----

/** POST /api/auth/login - body */
interface AuthRequest {
  email: string;
  password: string;
}

/** POST /api/auth/login - response */
interface AuthResponse {
  token: string;
  role: string;
  email: string;
}

/** POST /api/auth/register - body (RegisterRequest backend) */
interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  dateDeNaissance: string; // ISO date (YYYY-MM-DD)
  telephone?: string;
}

/** POST /api/auth/forgot-password - body */
interface ForgotPasswordRequest {
  email: string;
}

/** POST /api/auth/reset-password - body */
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/** Réponses message seul (register, verify, forgot, reset, logout) */
interface MessageResponse {
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
  xpToNextLevel?: number | null;
  currentStreakDays?: number | null;
  bestStreakDays?: number | null;
  lastStreakDate?: string | null;
  idRegion: number | null;
  idPays: number | null;
  onboardingCompleted: boolean;
  idGenre: number | null;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  tokenVerification: string | null;
  dateExpirationToken: string | null;
  dateDerniereConnexion: string | null;
  dateCreation: string | null;
  /** Joueur : id du compte PARENT rattaché (défini par l’admin). */
  idParent?: number | null;
}

/** PUT /api/admin/users/{id}/parent-link */
export interface SetParentLinkRequest {
  parentId: number | null;
}

/** GET /api/users/me/linked-children — profil enfant pour un compte PARENT */
export interface LinkedChildProfileDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  dateDeNaissance: string;
  avatarUrl: string | null;
  niveau: number | null;
  scoreTotal: number | null;
  pointsExperience: number | null;
  xpToNextLevel: number | null;
  currentStreakDays: number | null;
  bestStreakDays: number | null;
  skillMath: number | null;
  skillLogic: number | null;
  skillMemory: number | null;
  skillReflex: number | null;
  onboardingCompleted: boolean;
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
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** PATCH /api/users/me/onboarding - body (joueurs uniquement) */
export interface PlayerOnboardingRequest {
  paysNom: string;
  regionNom: string;
  avatarUrl?: string;
}

export interface CreateGameSessionRequest {
  gameId: number;
  modeJeu?: 'INDIVIDUEL' | 'EN_LIGNE' | string;
  roomCode?: string;
  scoreGlobal?: number;
  niveauAtteint?: number;
  etatSession?: 'EN_COURS' | 'TERMINE' | 'ABANDONNE' | string;
  durationSeconds?: number;
  accuracyPercent?: number;
  reactionTimeMs?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  moves?: number;
  matches?: number;
  attempts?: number;
  hintsUsed?: number;
  totalRounds?: number;
  successfulRounds?: number;
  reussite?: boolean;
}

export interface SoloLeaderboardEntryDTO {
  userId: number;
  displayName: string;
  avatarUrl?: string | null;
  level: number;
  totalScore: number;
}

export type LeaderboardScope = 'GLOBAL' | 'COUNTRY' | 'REGION';

export interface SoloLeaderboardResponseDTO {
  scope: LeaderboardScope;
  scopeLabel: string;
  entries: SoloLeaderboardEntryDTO[];
  currentUserRank: number | null;
  currentUserId: number;
  totalPlayers: number;
}

export interface PlayerLeaderboardRanksDTO {
  globalRank: number;
  globalTotal: number;
  countryRankingAvailable: boolean;
  countryRank: number | null;
  countryTotal: number;
  paysId: number | null;
  paysNom: string | null;
  regionRankingAvailable: boolean;
  regionRank: number | null;
  regionTotal: number;
  regionId: number | null;
  regionNom: string | null;
}

export interface CompetitiveRoomPlayerResultDTO {
  playerId: number;
  playerName: string;
  submitted: boolean;
  score?: number | null;
  outcome: 'PENDING' | 'WINNER' | 'LOSER' | 'DRAW';
}

export interface CompetitiveRoomResultDTO {
  roomCode: string;
  gameId: number;
  expectedPlayers: number;
  completedPlayers: number;
  highestScore?: number | null;
  complete: boolean;
  players: CompetitiveRoomPlayerResultDTO[];
}

export interface PlayerBadgeOverviewItemDTO {
  id: number;
  nom: string;
  description: string | null;
  icone: string | null;
  unlockCondition: string;
  earned: boolean;
  claimable: boolean;
  earnedDate: string | null;
}

export interface PlayerBadgesOverviewDTO {
  total: number;
  earned: number;
  badges: PlayerBadgeOverviewItemDTO[];
}

export interface PlayerRewardOverviewItemDTO {
  id: number;
  claimId?: number | null;
  nom: string;
  description: string | null;
  typeRecompense: string;
  scoreMin: number;
  unlockCondition: string;
  claimable: boolean;
  claimed: boolean;
  requestStatus: string | null;
  requestedDate: string | null;
}

export interface PlayerRewardsOverviewDTO {
  total: number;
  claimable: number;
  claimed: number;
  rewards: PlayerRewardOverviewItemDTO[];
}

export interface PlayerHistorySessionDTO {
  id: number;
  gameId: number | null;
  gameTitle: string;
  gameType: string;
  dateDebut: string;
  dateFin?: string | null;
  durationSeconds?: number | null;
  scoreFinal: number;
  niveauAtteint?: number | null;
  reussite: boolean;
  statut: 'EN_COURS' | 'TERMINEE' | 'ABANDONNEE' | string;
  mode: 'Individual' | 'Online' | string;
  accuracy?: number | null;
  reactionTime?: number | null;
}

interface PlayerProgressPointDTO {
  week: string;
  xp: number;
  score: number;
}

interface PlayerGameTypePerformanceDTO {
  type: string;
  played: number;
  avgScore: number;
  successRate: number;
}

export interface PlayerProgressOverviewDTO {
  currentLevel: number;
  avgSuccessRate: number;
  totalSessions: number;
  weeklyPlaytimeMinutes: number;
  skillMath: number;
  skillLogic: number;
  skillMemory: number;
  skillReflex: number;
  progressData: PlayerProgressPointDTO[];
  performanceByGameType: PlayerGameTypePerformanceDTO[];
}

export interface RealtimeRoomPlayerDTO {
  id: number;
  name: string;
  avatar: string;
  age?: number | null;
  ready: boolean;
  host: boolean;
}

export interface RealtimeRoomStateDTO {
  roomCode: string;
  gameId: number;
  maxPlayers: number;
  createdAt: number;
  startedAt?: number | null;
  allReady: boolean;
  players: RealtimeRoomPlayerDTO[];
}

export interface CreateRoomRequest {
  gameId: number;
}

export interface JoinRoomRequest {
  roomCode: string;
}

export type MotifReclamation =
  | 'CONTENU_INADAPTE_AGE'
  | 'ERREUR_REPONSE'
  | 'IMAGE_TEXTE_CHOQUANT'
  | 'TROP_DIFFICILE'
  | 'BUG_TECHNIQUE'
  | 'AUTRE';

export type StatutReclamation = 'OUVERT' | 'TRAITE' | 'REJETE';

export interface CreateReclamationRequest {
  sessionId: number;
  gameId: number;
  motif: MotifReclamation;
  commentaire?: string;
}

export interface ReclamationDTO {
  id: number;
  gameId: number;
  gameTitle: string;
  gameType: string;
  sessionId: number;
  playerId: number;
  playerPrenom: string;
  playerNom: string;
  playerEmail: string;
  motif: MotifReclamation;
  commentaire: string | null;
  statut: StatutReclamation;
  reponseAdmin: string | null;
  adminId: number | null;
  adminPrenom: string | null;
  adminNom: string | null;
  traitee: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateReclamationRequest {
  statut?: StatutReclamation;
  reponseAdmin?: string;
}

export interface CreateGameSessionResponse {
  sessionId: number;
  scoreGlobal: number;
  scoreBase?: number;
  scoreFinal?: number;
  scoreMaxPossible?: number;
  aiAdjustment?: number;
  totalScore: number;
  xpGained: number;
  previousLevel: number;
  newLevel: number;
  previousXp: number;
  newXp: number;
  xpToNextLevel: number;
  durationSeconds?: number;
  dateDebut?: string;
  dateFin?: string;
  levelUp: boolean;
  scoringRulesVersion?: string;
  anomalyNotes?: string;
  adjustmentSource?: string;
  explanationCode?: string;
  roomResult?: CompetitiveRoomResultDTO | null;
  message: string;
}

export interface AdminScoringDistributionDTO {
  gameId: number;
  gameTitle: string;
  gameType: 'QUIZ' | 'MEMOIRE' | 'LOGIQUE' | 'REFLEXE' | string;
  sessions: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  avgXp: number;
  totalXp: number;
  avgAdjustmentDelta?: number;
  anomalySessions?: number;
}

export interface AdminDaySessionCountDTO {
  day: string;
  date: string;
  sessions: number;
}

export interface AdminRecentActivityDTO {
  id: string;
  player: string;
  action: string;
  game: string;
  occurredAt: string;
}

interface AdminGamePerformanceDTO {
  name: string;
  plays: number;
  avgScore: number;
  completion: number;
}

interface AdminAgeGroupStatDTO {
  age: string;
  avgScore: number;
  players: number;
}

interface AdminGlobalMetricsDTO {
  overallCompletionRatePercent: number;
  activePlayers: number;
  avgPlaytimeMinutesPerUser: number;
}

export interface AdminStatisticsOverviewDTO {
  gamePerformance: AdminGamePerformanceDTO[];
  ageGroups: AdminAgeGroupStatDTO[];
  metrics: AdminGlobalMetricsDTO;
}

export interface SponsorPubliciteDTO {
  id: number;
  contenu: string;
  status?: string | null;
  typePublicite?: string | null;
  imageUrl?: string | null;
  adDurationSeconds?: number | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  budgetUtilise?: number | null;
  nbVues?: number | null;
  nbClics?: number | null;
  sponsorNom?: string | null;
}

export interface SponsorRecompenseDTO {
  id: number;
  nom: string;
  description?: string | null;
  scoreMin?: number | null;
  typeRecompense?: string | null;
  sponsorNom?: string | null;
  stockTotal?: number | null;
  stockRemaining?: number | null;
  distributedCount?: number | null;
  valeur?: number | null;
  devise?: string | null;
  partenaireNom?: string | null;
  dateEvenement?: string | null;
  lieuEvenement?: string | null;
  modeRemise?: string | null;
  instructionsRemise?: string | null;
  imageUrl?: string | null;
  status?: string | null;
}

export interface SponsorRewardRequestDTO {
  id: number;
  rewardId?: number | null;
  rewardName?: string | null;
  rewardScoreMin?: number | null;
  playerId?: number | null;
  playerName?: string | null;
  playerEmail?: string | null;
  playerScoreTotal?: number | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string | null;
  requestedDate?: string | null;
}

interface CreatePubliciteInteractionRequest {
  typeInteraction: 'VIEW' | 'CLICK' | string;
}

// ----- Admin Games (POST /api/admin/games) -----

/** Valeurs possibles pour typeJeu (backend enum TypeJeu) */
export type TypeJeu = 'QUIZ' | 'MEMOIRE' | 'REFLEXE' | 'LOGIQUE';

export type QuizPlayMode = 'CLASSIC' | 'BLITZ_60S';

export type QuizVariant =
  | 'DEFAULT'
  | 'TRUE_FALSE'
  | 'CLOZE'
  | 'IMAGE_WORD'
  | 'SYNONYM_ANTONYM'
  | 'COLOR_TRANSLATION'
  | 'AUDIO_COLOR';


/** Valeurs possibles pour modeJeu (backend enum ModeJeu) */
export type ModeJeu = 'INDIVIDUEL' | 'EN_LIGNE';

/** Valeurs possibles pour l'état du jeu (backend enum EtatJeu) */
export type EtatJeu = 'BROUILLON' | 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';

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
  coverImageUrl?: string;
  actif?: boolean;
  quizPlayMode?: QuizPlayMode;
  quizVariant?: QuizVariant;
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
  coverImageUrl?: string;
  actif?: boolean;
  quizPlayMode?: QuizPlayMode;
  quizVariant?: QuizVariant;
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
  quizPlayMode?: QuizPlayMode | null;
  quizVariant?: QuizVariant | null;
  actif: boolean;
  dureeMinutes: number | null;
  icone: string | null;
  coverImageUrl: string | null;
  etat: EtatJeu;
  latestRefusalReason: string | null;
  dateCreation: string | null;
}

export interface ChangeGameStatusRequest {
  etat: EtatJeu;
  motifRefus?: string;
}

export interface GameAiReviewDTO {
  gameId: number;
  gameTitle: string;
  model: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  suggestedAction: 'REVIEW_OK' | 'REVIEW_REQUIRED' | 'HIGH_RISK' | string;
  summary: string;
  strengths: string[];
  issues: string[];
  recommendations: string[];
}

// ----- Admin Badges (GET/POST/PUT/DELETE /api/admin/badges) -----

/** Types de condition prédéfinis (alignés backend TypeConditionBadge). */
export type TypeConditionBadge =
  | 'SCORE_MIN'
  | 'FIRST_WIN'
  | 'GAMES_PLAYED'
  | 'STREAK_DAYS'
  | 'QUIZ_WIN'
  | 'PERFECT_GAME';

/** GET /api/admin/badges, GET /api/admin/badges/:id - response. Aligné BadgeDTO backend (table badges). */
export interface BadgeDTO {
  id: number;
  nom: string;
  description: string | null;
  typeCondition: string | null;
  scoreCondition: number | null;
  icone: string | null;
}

/** POST /api/admin/badges - body */
export interface CreateBadgeRequest {
  nom: string;
  description?: string;
  typeCondition: string;
  scoreCondition?: number;
  icone?: string;
}

/** PUT /api/admin/badges/:id - body (champs optionnels) */
export interface UpdateBadgeRequest {
  nom?: string;
  description?: string;
  typeCondition?: string;
  scoreCondition?: number;
  icone?: string;
}

/** Liste des conditions pour le select admin (value = typeCondition). */
export const BADGE_CONDITION_OPTIONS: { value: TypeConditionBadge; label: string; needsValue: boolean }[] = [
  { value: 'SCORE_MIN', label: 'Score total minimum', needsValue: true },
  { value: 'FIRST_WIN', label: 'Première victoire', needsValue: false },
  { value: 'GAMES_PLAYED', label: 'Nombre de parties jouées', needsValue: true },
  { value: 'STREAK_DAYS', label: 'Série de jours (connexion)', needsValue: true },
  { value: 'QUIZ_WIN', label: 'Gagner une partie Quiz', needsValue: false },
  { value: 'PERFECT_GAME', label: 'Partie sans erreur', needsValue: false },
];

// ----- Educator (GET/POST/PUT/DELETE /api/educator/*) - synchronisés backend (controller/DTO/entity/service) -----

/** GET /api/educator/questions?gameId= - response. QuizQuestionDTO backend (table questions). */
export interface QuizQuestionDTO {
  id: number;
  jeuId: number;
  jeuTitre: string;
  contenu: string;
  bonneReponse: string;
  options: string[] | null;
  sousType?: 'DEFAULT' | 'TRUE_FALSE' | 'CLOZE' | 'IMAGE_WORD' | 'SYNONYM_ANTONYM' | 'COLOR_TRANSLATION' | 'AUDIO_COLOR' | string | null;
  mediaUrl?: string | null;
  promptAudioUrl?: string | null;
  explication: string | null;
  difficulte: number | null;
}

/** POST /api/educator/questions - body. Aligné CreateQuizQuestionRequest backend. */
export interface CreateQuizQuestionRequest {
  jeuId: number;
  contenu: string;
  bonneReponse: string;
  options?: string[];
  sousType?: 'DEFAULT' | 'TRUE_FALSE' | 'CLOZE' | 'IMAGE_WORD' | 'SYNONYM_ANTONYM' | 'COLOR_TRANSLATION' | 'AUDIO_COLOR' | string;
  mediaUrl?: string;
  promptAudioUrl?: string;
  explication?: string;
  difficulte?: number;
}

/** PUT /api/educator/questions/:id - body. Aligné UpdateQuizQuestionRequest backend. */
export interface UpdateQuizQuestionRequest {
  contenu?: string;
  bonneReponse?: string;
  options?: string[];
  sousType?: 'DEFAULT' | 'TRUE_FALSE' | 'CLOZE' | 'IMAGE_WORD' | 'SYNONYM_ANTONYM' | 'COLOR_TRANSLATION' | 'AUDIO_COLOR' | string;
  mediaUrl?: string;
  promptAudioUrl?: string;
  explication?: string;
  difficulte?: number;
}

export interface GenerateQuizPreviewRequest {
  gameId: number;
  count?: number;
}

type LogicPuzzleType = 'SUITE_LOGIQUE' | 'INTRUS' | 'DEDUCTION' | 'COLOR_MATCH' | string;

export interface LogicPuzzleData {
  type?: LogicPuzzleType;
  sequence?: Array<string | number>;
  options?: string[];
  colorPairs?: Array<{ color: string; word: string }>;
}

export interface LogicPuzzleDTO {
  id: number;
  jeuId: number;
  jeuTitre: string;
  enonce: string;
  sousType?: LogicPuzzleType | null;
  donnees: string | null;
  bonneReponse: string;
  indice: string | null;
  difficulte: number | null;
}

export interface CreateLogicPuzzleRequest {
  jeuId: number;
  enonce: string;
  sousType?: LogicPuzzleType;
  donnees?: string | null;
  bonneReponse: string;
  indice?: string | null;
  difficulte?: number;
}

export interface UpdateLogicPuzzleRequest {
  enonce?: string;
  sousType?: LogicPuzzleType;
  donnees?: string | null;
  bonneReponse?: string;
  indice?: string | null;
  difficulte?: number;
}

export interface ReflexSettingsDTO {
  id: number;
  jeuId: number;
  jeuTitre: string;
  nombreRounds: number;
  tempsReactionMaxMs: number | null;
  typeStimuli: string | null;
  modeleReflexe: 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION' | 'STROOP_INVERSE' | string;
  noGoRatio: number | null;
  choiceTargetCount: number | null;
  difficulte: number | null;
}

export interface CreateOrUpdateReflexSettingsRequest {
  jeuId: number;
  nombreRounds: number;
  tempsReactionMaxMs?: number;
  typeStimuli?: string;
  modeleReflexe?: 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION' | 'STROOP_INVERSE' | string;
  noGoRatio?: number | null;
  choiceTargetCount?: number | null;
  difficulte?: number;
}

// ----- Educator Memory (GET/POST/PUT/DELETE /api/educator/memory-cards) -----

/** GET /api/educator/memory-cards?gameId= - response. */
export interface MemoryCardDTO {
  id: number;
  jeuId: number;
  jeuTitre: string;
  symbole: string;
  cardType?: 'EMOJI' | 'TEXT' | 'IMAGE' | 'COLOR' | string | null;
  cardValue?: string | null;
  sousType?: 'DEFAULT' | 'IMAGE_WORD_PAIR' | 'COLOR_WORD_PAIR' | 'BILINGUAL_WORD_PAIR' | string | null;
  pairKey: string | null;
  categorie: string | null;
}

/** POST /api/educator/memory-cards - body. */
export interface CreateMemoryCardRequest {
  jeuId: number;
  symbole: string;
  cardType?: 'EMOJI' | 'TEXT' | 'IMAGE' | 'COLOR' | string;
  cardValue?: string | null;
  sousType?: 'DEFAULT' | 'IMAGE_WORD_PAIR' | 'COLOR_WORD_PAIR' | 'BILINGUAL_WORD_PAIR' | string;
  pairKey?: string | null;
  categorie?: string | null;
}

/** PUT /api/educator/memory-cards/:id - body. */
export interface UpdateMemoryCardRequest {
  symbole?: string;
  cardType?: 'EMOJI' | 'TEXT' | 'IMAGE' | 'COLOR' | string;
  cardValue?: string | null;
  sousType?: 'DEFAULT' | 'IMAGE_WORD_PAIR' | 'COLOR_WORD_PAIR' | 'BILINGUAL_WORD_PAIR' | string;
  pairKey?: string | null;
  categorie?: string | null;
}

// ----- Educator Dashboard (GET /api/educator/dashboard/stats) - EducatorDashboardStatsDTO backend -----

export interface EducatorDashboardStatsDTO {
  totalQuestionsCreated: number;
  assignedGames: number;
  avgSuccessRate: number;
  studentActivity: number;
  difficultyDistribution: { name: string; value: number; color: string }[];
}

export interface EducatorGameTypeStatsDTO {
  gameType: string;
  label: string;
  sessions: number;
  avgSuccessRate: number;
  color: string;
}

export interface EducatorLearningStatsDTO {
  avgSuccessRate: number;
  totalAnswers: number;
  improvementPercent: number;
  sessionsByGameType: EducatorGameTypeStatsDTO[];
}
