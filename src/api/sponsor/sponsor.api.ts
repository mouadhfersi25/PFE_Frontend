import api from '../config/axiosConfig';
import { SPONSOR_ENDPOINTS } from '../config/endpoints';
import type { SponsorPubliciteDTO, SponsorRecompenseDTO, SponsorRewardRequestDTO } from '../types/api.types';

const sponsorApi = {
  getDashboardStats: () => api.get(SPONSOR_ENDPOINTS.DASHBOARD_STATS),
  listPublicites: () => api.get<SponsorPubliciteDTO[]>(SPONSOR_ENDPOINTS.PUBLICITES),
  getPubliciteById: (id: number | string) => api.get<SponsorPubliciteDTO>(SPONSOR_ENDPOINTS.PUBLICITE_BY_ID(id)),
  createPublicite: (data: Record<string, unknown>) => api.post(SPONSOR_ENDPOINTS.PUBLICITES, data),
  updatePublicite: (id: number | string, data: Record<string, unknown>) =>
    api.put(SPONSOR_ENDPOINTS.PUBLICITE_BY_ID(id), data),
  setPubliciteStatus: (id: number | string, active: boolean) =>
    api.patch(SPONSOR_ENDPOINTS.PUBLICITE_STATUS(id), null, { params: { active } }),
  deletePublicite: (id: number | string) => api.delete(SPONSOR_ENDPOINTS.PUBLICITE_BY_ID(id)),
  listRecompenses: () => api.get<SponsorRecompenseDTO[]>(SPONSOR_ENDPOINTS.RECOMPENSES),
  getRecompenseById: (id: number | string) =>
    api.get<SponsorRecompenseDTO>(SPONSOR_ENDPOINTS.RECOMPENSE_BY_ID(id)),
  createRecompense: (data: Record<string, unknown>) =>
    api.post<SponsorRecompenseDTO>(SPONSOR_ENDPOINTS.RECOMPENSES, data),
  updateRecompense: (id: number | string, data: Record<string, unknown>) =>
    api.put<SponsorRecompenseDTO>(SPONSOR_ENDPOINTS.RECOMPENSE_BY_ID(id), data),
  setRecompenseStatus: (id: number | string, active: boolean) =>
    api.patch<SponsorRecompenseDTO>(SPONSOR_ENDPOINTS.RECOMPENSE_STATUS(id), null, { params: { active } }),
  deleteRecompense: (id: number | string) => api.delete(SPONSOR_ENDPOINTS.RECOMPENSE_BY_ID(id)),
  listRewardRequests: () => api.get<SponsorRewardRequestDTO[]>(SPONSOR_ENDPOINTS.REWARD_REQUESTS),
  updateRewardRequestStatus: (id: number | string, status: 'PENDING' | 'APPROVED' | 'REJECTED') =>
    api.patch<SponsorRewardRequestDTO>(SPONSOR_ENDPOINTS.REWARD_REQUEST_STATUS(id), null, { params: { status } }),
};

export default sponsorApi;
