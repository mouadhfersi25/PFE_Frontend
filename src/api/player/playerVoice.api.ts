import api from '../config/axiosConfig';
import { PLAYER_VOICE_ENDPOINTS } from '../config/endpoints';
import type {
  CompleteVoiceSessionResponse,
  PlayerOralHistorySessionDTO,
  StartVoiceSessionResponse,
  VoiceEvaluationResultDTO,
  VoiceSeriesDTO,
} from '../types/voice.types';

const playerVoiceApi = {
  getSeries: () => api.get<VoiceSeriesDTO[]>(PLAYER_VOICE_ENDPOINTS.SERIES),
  getSeriesById: (id: number) => api.get<VoiceSeriesDTO>(PLAYER_VOICE_ENDPOINTS.SERIES_BY_ID(id)),
  startSession: (seriesId: number) =>
    api.post<StartVoiceSessionResponse>(PLAYER_VOICE_ENDPOINTS.SESSION_START, null, {
      params: { seriesId },
    }),
  evaluate: (params: {
    promptId: number;
    sessionOralId: number;
    audio: Blob;
    dureeSecondes: number;
    browserTranscript?: string;
  }) => {
    const form = new FormData();
    const filename = params.audio.type.includes('wav') ? 'recording.wav' : 'recording.webm';
    form.append('audio', params.audio, filename);
    form.append('promptId', String(params.promptId));
    form.append('sessionOralId', String(params.sessionOralId));
    form.append('dureeSecondes', String(params.dureeSecondes));
    if (params.browserTranscript) {
      form.append('browserTranscript', params.browserTranscript);
    }
    return api.post<VoiceEvaluationResultDTO>(PLAYER_VOICE_ENDPOINTS.EVALUATE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
  completeSession: (sessionOralId: number) =>
    api.post<CompleteVoiceSessionResponse>(PLAYER_VOICE_ENDPOINTS.SESSION_COMPLETE(sessionOralId)),
  getHistory: () => api.get<PlayerOralHistorySessionDTO[]>(PLAYER_VOICE_ENDPOINTS.HISTORY),
};

export default playerVoiceApi;
