export type VoiceSeriesState = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
export type VoicePromptSubtype = 'READ_ALOUD' | 'REPEAT_AFTER';
export type VoiceTolerance = 'STRICT' | 'NORMAL' | 'SOUPLE';

export interface VoicePromptDTO {
  id: number;
  seriesId: number;
  ordre: number;
  texteReference: string;
  sousType: VoicePromptSubtype;
  tolerance: VoiceTolerance;
  indice?: string | null;
  dureeMaxSecondes: number;
}

export interface VoiceSeriesDTO {
  id: number;
  titre: string;
  description?: string | null;
  langue: string;
  difficulte?: number | null;
  etat: VoiceSeriesState;
  educateurId?: number;
  educateurNom?: string | null;
  promptsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  prompts?: VoicePromptDTO[];
}

export interface CreateVoiceSeriesRequest {
  titre: string;
  description?: string;
  langue?: string;
  difficulte?: number;
}

export interface UpdateVoiceSeriesRequest {
  titre?: string;
  description?: string;
  langue?: string;
  difficulte?: number;
}

export interface CreateVoicePromptRequest {
  seriesId: number;
  texteReference: string;
  ordre?: number;
  sousType?: VoicePromptSubtype;
  tolerance?: VoiceTolerance;
  indice?: string;
  dureeMaxSecondes?: number;
}

export interface UpdateVoicePromptRequest {
  texteReference?: string;
  ordre?: number;
  sousType?: VoicePromptSubtype;
  tolerance?: VoiceTolerance;
  indice?: string;
  dureeMaxSecondes?: number;
}

export interface VoiceEvaluationResultDTO {
  attemptId: number;
  sessionOralId: number;
  promptId: number;
  transcription: string;
  scoreContenu: number;
  reussite: boolean;
  dureeSecondes: number;
  expectedWords: string[];
  spokenWords: string[];
  correctWords: string[];
  missedWords: string[];
  extraWords: string[];
}

export interface StartVoiceSessionResponse {
  sessionOralId: number;
  seriesId: number;
  seriesTitle: string;
  promptsTotal: number;
  dateDebut: string;
}

export interface CompleteVoiceSessionResponse {
  sessionOralId: number;
  scoreFinal: number;
  scoreBase: number;
  xpGained: number;
  accuracyPercent: number;
  promptsReussis: number;
  promptsTotal: number;
  totalScore: number;
  previousLevel: number;
  newLevel: number;
  previousXp: number;
  newXp: number;
  xpToNextLevel: number;
  levelUp: boolean;
  dateFin: string;
  durationSeconds: number;
}

export interface PlayerOralHistorySessionDTO {
  sessionId: number;
  seriesId: number;
  seriesTitle: string;
  scoreFinal: number;
  accuracyPercent: number;
  xpGained: number;
  promptsReussis: number;
  promptsTotal: number;
  durationSeconds: number;
  dateFin: string;
}
