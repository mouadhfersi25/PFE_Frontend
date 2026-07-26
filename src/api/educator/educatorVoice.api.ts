import api from '../config/axiosConfig';
import { EDUCATOR_ENDPOINTS } from '../config/endpoints';
import type {
  CreateVoicePromptRequest,
  CreateVoiceSeriesRequest,
  UpdateVoicePromptRequest,
  UpdateVoiceSeriesRequest,
  VoicePromptDTO,
  VoiceSeriesDTO,
} from '../types/voice.types';

const educatorVoiceApi = {
  getSeries: () => api.get<VoiceSeriesDTO[]>(EDUCATOR_ENDPOINTS.VOICE_SERIES),
  getSeriesById: (id: number) => api.get<VoiceSeriesDTO>(EDUCATOR_ENDPOINTS.VOICE_SERIES_BY_ID(id)),
  createSeries: (data: CreateVoiceSeriesRequest) =>
    api.post<VoiceSeriesDTO>(EDUCATOR_ENDPOINTS.VOICE_SERIES, data),
  updateSeries: (id: number, data: UpdateVoiceSeriesRequest) =>
    api.put<VoiceSeriesDTO>(EDUCATOR_ENDPOINTS.VOICE_SERIES_BY_ID(id), data),
  deleteSeries: (id: number) => api.delete(EDUCATOR_ENDPOINTS.VOICE_SERIES_BY_ID(id)),
  publishSeries: (id: number) => api.patch<VoiceSeriesDTO>(EDUCATOR_ENDPOINTS.VOICE_SERIES_PUBLISH(id)),
  archiveSeries: (id: number) => api.patch<VoiceSeriesDTO>(EDUCATOR_ENDPOINTS.VOICE_SERIES_ARCHIVE(id)),

  getPrompts: (seriesId: number) =>
    api.get<VoicePromptDTO[]>(EDUCATOR_ENDPOINTS.VOICE_PROMPTS, { params: { seriesId } }),
  createPrompt: (data: CreateVoicePromptRequest) =>
    api.post<VoicePromptDTO>(EDUCATOR_ENDPOINTS.VOICE_PROMPTS, data),
  updatePrompt: (id: number, data: UpdateVoicePromptRequest) =>
    api.put<VoicePromptDTO>(EDUCATOR_ENDPOINTS.VOICE_PROMPT_BY_ID(id), data),
  deletePrompt: (id: number) => api.delete(EDUCATOR_ENDPOINTS.VOICE_PROMPT_BY_ID(id)),
};

export default educatorVoiceApi;
