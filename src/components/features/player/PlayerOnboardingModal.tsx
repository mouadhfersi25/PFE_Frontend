import { useState, useEffect } from "react";
import geoApi from "@/api/geo/countriesNow.api";
import userApi from "@/api/user/user.api";
import { getErrorMessage } from "@/utils/errorHandler";

interface PlayerOnboardingModalProps {
  onComplete: () => void;
}

export default function PlayerOnboardingModal({ onComplete }: PlayerOnboardingModalProps) {
  const [paysList, setPaysList] = useState<{ name: string }[]>([]);
  const [regionsList, setRegionsList] = useState<string[]>([]);

  const [paysNom, setPaysNom] = useState("");
  const [regionNom, setRegionNom] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingGeo(true);
    geoApi
      .getCountries()
      .then(setPaysList)
      .catch(() => setPaysList([]))
      .finally(() => setLoadingGeo(false));
  }, []);

  useEffect(() => {
    if (!paysNom) {
      setRegionsList([]);
      setRegionNom("");
      setLoadingRegions(false);
      return;
    }
    setLoadingRegions(true);
    geoApi
      .getStates(paysNom)
      .then((list) => {
        if (list.length === 0) list = [paysNom];
        setRegionsList(list);
        setRegionNom("");
      })
      .catch(() => {
        setRegionsList([paysNom]);
        setRegionNom("");
      })
      .finally(() => setLoadingRegions(false));
  }, [paysNom]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paysNom || !regionNom) {
      setError("Veuillez sélectionner le pays et la région.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = { paysNom: paysNom.trim(), regionNom: regionNom.trim() };
      await userApi.completeOnboarding(payload);
      onComplete();
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de l'enregistrement"));
    } finally {
      setLoading(false);
    }
  };

  const selectStyle =
    "w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-3xl">📍</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Complète ta localisation
            </h2>
            <p className="text-sm text-gray-600">
              Pour personnaliser ton expérience et les jeux
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-700">
              <span className="text-lg">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pays <span className="text-red-500">*</span>
            </label>
            <select
              value={paysNom}
              onChange={(e) => setPaysNom(e.target.value)}
              className={selectStyle}
              disabled={loadingGeo}
              required
            >
              <option value="">
                {loadingGeo ? "Chargement..." : "-- Choisir un pays --"}
              </option>
              {paysList.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Région / État <span className="text-red-500">*</span>
            </label>
            <select
              value={regionNom}
              onChange={(e) => setRegionNom(e.target.value)}
              className={selectStyle}
              disabled={!paysNom}
              required
            >
              <option value="">
                {loadingRegions ? "Chargement..." : "-- Choisir une région --"}
              </option>
              {regionsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !paysNom || !regionNom}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}
