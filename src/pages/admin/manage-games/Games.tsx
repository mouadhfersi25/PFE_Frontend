import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, Gamepad2, LayoutGrid, List, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import type { GameDTO } from '@/api/types';
import RejectGameModal from '@/components/admin/RejectGameModal';

const TYPE_ICONS: Record<string, string> = {
  QUIZ: '🧮',
  MEMOIRE: '🧠',
  REFLEXE: '⚡',
  LOGIQUE: '🎯',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  EN_ATTENTE: { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACCEPTE: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  REFUSE: { label: 'Refusé', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

function difficultyLabel(d: number | null): string {
  if (d == null) return '—';
  if (d <= 3) return 'Facile';
  if (d <= 6) return 'Moyen';
  return 'Difficile';
}

function difficultyClass(d: number | null): string {
  if (d == null) return 'bg-gray-100 text-gray-700';
  if (d <= 3) return 'bg-green-100 text-green-700';
  if (d <= 6) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Modération admin : uniquement jeux en attente de décision ou déjà acceptés (pas brouillon ni refusés). */
function filterAdminModerationGames(games: GameDTO[]): GameDTO[] {
  return games.filter((g) => g.etat === 'EN_ATTENTE' || g.etat === 'ACCEPTE');
}

export default function Games() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [rejectingGame, setRejectingGame] = useState<GameDTO | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getGames()
      .then((res) => {
        if (!cancelled) setGames(filterAdminModerationGames(res.data ?? []));
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des jeux');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleUpdateStatus = async (id: number, etat: 'ACCEPTE' | 'REFUSE', e: React.MouseEvent) => {
    e.stopPropagation();
    if (etat === 'REFUSE') {
      const selected = games.find((g) => g.id === id) ?? null;
      setRejectingGame(selected);
      return;
    }

    setStatusUpdatingId(id);
    try {
      const res = await adminApi.updateGameStatus(id, etat);
      setGames((prev) => {
        const next = prev.map((g) => (g.id === id ? res.data : g));
        return filterAdminModerationGames(next);
      });
      toast.success(etat === 'ACCEPTE' ? 'Jeu accepté !' : 'Jeu refusé.');
    } catch (err: unknown) {
      toast.error('Erreur lors de la mise à jour du statut.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const submitReject = async (reason: string) => {
    if (!rejectingGame) return;
    setStatusUpdatingId(rejectingGame.id);
    try {
      const res = await adminApi.updateGameStatus(rejectingGame.id, 'REFUSE', reason);
      setGames((prev) => {
        const next = prev.map((g) => (g.id === rejectingGame.id ? res.data : g));
        return filterAdminModerationGames(next);
      });
      toast.success('Jeu refusé.');
      setRejectingGame(null);
    } catch {
      toast.error('Erreur lors de la mise à jour du statut.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="p-3 md:p-6 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-5 shadow-sm">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/70 blur-2xl" />
        <div className="absolute -bottom-12 -left-6 w-40 h-40 rounded-full bg-violet-100/50 blur-2xl" />

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
              <Gamepad2 className="w-4 h-4 text-violet-600" />
              Game Moderation
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Game Moderation</h1>
          </div>

          <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-label="Vue cartes"
              title="Vue cartes"
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Vue tableau"
              title="Vue tableau"
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {!loading && !error && viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <motion.article
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                onClick={() => navigate(`/admin/games/${game.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/admin/games/${game.id}`); } }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-pointer"
              >
                {/* Haut de carte : icône violette + titre + type (comme la capture) */}
                <div className="p-5 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-violet-300 to-violet-600 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                    {game.icone ?? TYPE_ICONS[game.typeJeu] ?? '🎮'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <h3 className="text-lg font-bold text-gray-900 truncate">{game.titre}</h3>
                       <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${STATUS_LABELS[game.etat]?.color ?? ''}`}>
                         {STATUS_LABELS[game.etat]?.label ?? game.etat}
                       </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{formatLabel(game.typeJeu)}</p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                    {game.description || 'Aucune description.'}
                  </p>

                  {/* Pills : difficulté (jaune), durée, tranche d'âge — style capture */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${difficultyClass(game.difficulte)}`}>
                      {difficultyLabel(game.difficulte).toLowerCase()}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-800">
                      {game.ageMin != null && game.ageMax != null ? `${game.ageMin}-${game.ageMax} ans` : '—'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-800">
                      {game.dureeMinutes != null ? `${game.dureeMinutes} min` : '—'}
                    </span>
                  </div>

                  {/* Ligne "plays" comme sur la capture */}
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <Gamepad2 className="w-4 h-4" />
                    <span>— parties</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${game.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${game.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {game.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    {game.etat === 'EN_ATTENTE' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleUpdateStatus(game.id, 'REFUSE', e)}
                          disabled={statusUpdatingId === game.id}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={(e) => handleUpdateStatus(game.id, 'ACCEPTE', e)}
                          disabled={statusUpdatingId === game.id}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          Accepter
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Lecture seule</span>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          )}

          {!loading && !error && viewMode === 'table' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Jeu</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Difficulté</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Âge</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Durée</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">État</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
                      <tr
                        key={game.id}
                        className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/games/${game.id}`)}
                            className="text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-lg">
                                {game.icone ?? TYPE_ICONS[game.typeJeu] ?? '🎮'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:underline">{game.titre}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{game.description || 'Aucune description'}</p>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatLabel(game.typeJeu)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${STATUS_LABELS[game.etat]?.color ?? ''}`}>
                            {STATUS_LABELS[game.etat]?.label ?? game.etat}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${difficultyClass(game.difficulte)}`}>
                            {difficultyLabel(game.difficulte)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {game.ageMin != null && game.ageMax != null ? `${game.ageMin}-${game.ageMax} ans` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {game.dureeMinutes != null ? `${game.dureeMinutes} min` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${game.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${game.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {game.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {game.etat === 'EN_ATTENTE' ? (
                              <>
                                <button
                                  onClick={(e) => handleUpdateStatus(game.id, 'REFUSE', e)}
                                  disabled={statusUpdatingId === game.id}
                                  className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                                >
                                  Refuser
                                </button>
                                <button
                                  onClick={(e) => handleUpdateStatus(game.id, 'ACCEPTE', e)}
                                  disabled={statusUpdatingId === game.id}
                                  className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                >
                                  Accepter
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/games/${game.id}`)}
                                title="Voir détails"
                                aria-label="Voir détails"
                                className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && !error && games.length === 0 && (
            <div className="text-center py-12 text-gray-500 rounded-xl bg-gray-50 border border-gray-100">
              <p className="font-medium">Aucun jeu en attente ou accepté.</p>
              <p className="text-sm mt-1">Les brouillons et les jeux refusés ne sont pas listés dans cette vue.</p>
            </div>
          )}
      <RejectGameModal
        open={!!rejectingGame}
        gameTitle={rejectingGame?.titre}
        submitting={rejectingGame != null && statusUpdatingId === rejectingGame.id}
        onClose={() => setRejectingGame(null)}
        onConfirm={submitReject}
      />
    </div>
  );
}
