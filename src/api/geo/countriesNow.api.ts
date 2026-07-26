/**
 * API Countries Now via le proxy backend (/api/countriesnow).
 * Évite CORS et centralise les appels côté serveur.
 */
import api from "../config/axiosConfig";

const geoApi = {
  getCountries: async (): Promise<{ name: string }[]> => {
    const res = await api.get<{ name: string }[]>("/countriesnow/countries");
    const data = res.data;
    return Array.isArray(data) ? data : [];
  },

  getStates: async (countryName: string): Promise<string[]> => {
    const res = await api.get<string[]>(
      `/countriesnow/states?country=${encodeURIComponent(countryName.trim())}`
    );
    const data = res.data;
    return Array.isArray(data) ? data : [];
  },
};

export default geoApi;
