import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Edit, Trash2, Loader2, Gamepad2, Eye, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, MemoryCardDTO } from '@/api/types';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import { filterGamesForManageList } from './manageGamesListFilter';

const TYPE_ICONS: Record<string, string> = {
  QUIZ: '🧮',
  MEMOIRE: '🧠',
  REFLEXE: '⚡',
  LOGIQUE: '🎯',
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '📝' },
  EN_ATTENTE: { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⏳' },
  ACCEPTE: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
  REFUSE: { label: 'Refusé', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: '❌' },
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

export default function EducatorManageGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [hasQuestionContent, setHasQuestionContent] = useState<Record<number, boolean>>({});
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [pairCounts, setPairCounts] = useState<Record<number, number>>({});

  const countMemoryPairs = (cards: MemoryCardDTO[]): number => {
    const keys = new Set(cards.map((c) => c.pairKey).filter(Boolean));
    if (keys.size > 0) return keys.size;
    return Math.floor(cards.length / 2);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    educatorApi
      .getGames()
      .then((res) => {
        if (!cancelled) setGames(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des jeux');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (games.length === 0) {
      setHasQuestionContent({});
      return;
    }
    Promise.all(
      games.map(async (g) => {
        try {
          if (g.typeJeu === 'QUIZ') {
            const res = await educatorApi.getQuestions(g.id);
            return { id: g.id, hasContent: Array.isArray(res.data) && res.data.length > 0 };
          }

          if (g.typeJeu === 'MEMOIRE') {
            const res = await educatorApi.getMemoryCards(g.id);
            const cards = Array.isArray(res.data) ? res.data : [];
            const hasPairs = cards.length >= 2;
            return { id: g.id, hasContent: hasPairs };
          }

          if (g.typeJeu === 'REFLEXE') {
            const res = await educatorApi.getReflexSettings(g.id);
            const settings = res.data;
            return { id: g.id, hasContent: (settings?.nombreRounds ?? 0) > 0 };
          }

          return { id: g.id, hasContent: false };
        } catch {
          return { id: g.id, hasContent: false };
        }
      })
    ).then((rows) => {
      if (cancelled) return;
      const map: Record<number, boolean> = {};
      rows.forEach((r) => { map[r.id] = r.hasContent; });
      setHasQuestionContent(map);
    });
    return () => { cancelled = true; };
  }, [games]);

  useEffect(() => {
    let cancelled = false;
    const quizGames = games.filter((g) => g.typeJeu === 'QUIZ');
    if (quizGames.length === 0) {
      setQuestionCounts({});
      return;
    }

    Promise.all(
      quizGames.map(async (g) => {
        try {
          const res = await educatorApi.getQuestions(g.id);
          return { id: g.id, count: Array.isArray(res.data) ? res.data.length : 0 };
        } catch {
          return { id: g.id, count: 0 };
        }
      })
    ).then((rows) => {
      if (cancelled) return;
      const map: Record<number, number> = {};
      rows.forEach((r) => { map[r.id] = r.count; });
      setQuestionCounts(map);
    });

    return () => { cancelled = true; };
  }, [games]);

  useEffect(() => {
    let cancelled = false;
    const memoryGames = games.filter((g) => g.typeJeu === 'MEMOIRE');
    if (memoryGames.length === 0) {
      setPairCounts({});
      return;
    }

    Promise.all(
      memoryGames.map(async (g) => {
        try {
          const res = await educatorApi.getMemoryCards(g.id);
          const cards = Array.isArray(res.data) ? res.data : [];
          return { id: g.id, count: countMemoryPairs(cards) };
        } catch {
          return { id: g.id, count: 0 };
        }
      })
    ).then((rows) => {
      if (cancelled) return;
      const map: Record<number, number> = {};
      rows.forEach((r) => { map[r.id] = r.count; });
      setPairCounts(map);
    });

    return () => { cancelled = true; };
  }, [games]);

  const handleDelete = async (game: GameDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Supprimer le jeu « ${game.titre} » ? Cette action est irréversible.`)) return;
    setDeletingId(game.id);
    try {
      await educatorApi.deleteGame(game.id);
      setGames((prev) => prev.filter((g) => g.id !== game.id));
      toast.success('Jeu supprimé.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || 'Erreur lors de la suppression.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleGameActive = async (game: GameDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(game.id);
    try {
      const res = await educatorApi.updateGame(game.id, { actif: !game.actif });
      setGames((prev) => prev.map((g) => (g.id === game.id ? res.data : g)));
      toast.success(game.actif ? 'Jeu désactivé.' : 'Jeu activé.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || 'Erreur lors du changement de statut.';
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmitToAdmin = async (game: GameDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmittingId(game.id);
    try {
      const res = await educatorApi.submitGame(game.id);
      setGames((prev) => prev.map((g) => (g.id === game.id ? res.data : g)));
      toast.success('Jeu finalisé et soumis à l’admin.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || 'Impossible de finaliser ce jeu.';
      toast.error(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const getGameViewPath = (game: GameDTO): string => {
    return `/educator/games/manage/${game.id}/view`;
  };

  const gamesToDisplay = filterGamesForManageList(games);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />
      <div className="flex-1 overflow-auto pt-16">
        <div className="p-5 md:p-8 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-8 shadow-sm">
            <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
                  <Gamepad2 className="w-4 h-4 text-emerald-600" />
                  Manage Games
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Mes Jeux</h1>
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
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {!loading && !error && viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {gamesToDisplay.map((game, index) => {
                const status = STATUS_LABELS[game.etat] ?? STATUS_LABELS['EN_ATTENTE'];
                const viewPath = getGameViewPath(game);
                return (
                  <motion.article
                    key={game.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300"
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-emerald-300 to-teal-600 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                        {game.icone ?? TYPE_ICONS[game.typeJeu] ?? '🎮'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{game.titre}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 capitalize">{game.typeJeu?.toLowerCase()}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                        {game.description || 'Aucune description.'}
                      </p>

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

                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                        <Gamepad2 className="w-4 h-4" />
                        {game.typeJeu === 'QUIZ' ? (
                          <span>{questionCounts[game.id] ?? 0} question{(questionCounts[game.id] ?? 0) > 1 ? 's' : ''}</span>
                        ) : game.typeJeu === 'MEMOIRE' ? (
                          <span>{pairCounts[game.id] ?? 0} paire{(pairCounts[game.id] ?? 0) > 1 ? 's' : ''}</span>
                        ) : (
                          <span>— parties</span>
                        )}
                      </div>

                      {game.etat === 'REFUSE' && game.latestRefusalReason && (
                        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 mb-1">Motif de refus</p>
                          <p className="text-sm text-rose-800 whitespace-pre-wrap">{game.latestRefusalReason}</p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        {game.etat === 'BROUILLON' || game.etat === 'REFUSE' ? (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700">Active</span>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => toggleGameActive(game, e)}
                                disabled={togglingId === game.id}
                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-60 ${game.actif ? 'bg-green-500' : 'bg-slate-300'}`}
                                title={game.actif ? 'Désactiver' : 'Activer'}
                              >
                                {togglingId === game.id ? (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                                  </span>
                                ) : (
                                  <span
                                    className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${game.actif ? 'translate-x-5' : 'translate-x-0'}`}
                                  />
                                )}
                              </motion.button>
                            </div>

                            <div className="flex items-center gap-2">
                              {hasQuestionContent[game.id] && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => handleSubmitToAdmin(game, e)}
                                  disabled={submittingId === game.id || game.etat === 'EN_ATTENTE'}
                                  className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 text-xs font-bold"
                                  title="Finaliser et soumettre à l'admin"
                                >
                                  {submittingId === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : game.etat === 'EN_ATTENTE' ? 'Finalisé' : 'Finaliser'}
                                </motion.button>
                              )}
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/educator/games/manage/${game.id}/edit`)}
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              {viewPath && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(viewPath);
                                  }}
                                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                  title="Voir le contenu"
                                  aria-label="Voir le contenu"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>
                              )}
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleDelete(game, e)}
                                disabled={deletingId === game.id}
                                className="p-2 rounded-lg border border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Supprimer"
                              >
                                {deletingId === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </motion.button>
                            </div>
                          </>
                        ) : (
                          <div className="flex w-full flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-gray-500 italic">
                              Jeu finalisé : modification désactivée. Vous pouvez encore supprimer le jeu.
                            </p>
                            <div className="flex items-center gap-2">
                              {viewPath && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(viewPath);
                                  }}
                                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                  title="Voir le contenu"
                                  aria-label="Voir le contenu"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>
                              )}
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleDelete(game, e)}
                                disabled={deletingId === game.id}
                                className="p-2 rounded-lg border border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                                title="Supprimer le jeu"
                              >
                                {deletingId === game.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
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
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Contenu</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gamesToDisplay.map((game) => {
                      const status = STATUS_LABELS[game.etat] ?? STATUS_LABELS['EN_ATTENTE'];
                      const viewPath = getGameViewPath(game);
                      const contentCount = game.typeJeu === 'QUIZ'
                        ? `${questionCounts[game.id] ?? 0} question${(questionCounts[game.id] ?? 0) > 1 ? 's' : ''}`
                        : game.typeJeu === 'MEMOIRE'
                          ? `${pairCounts[game.id] ?? 0} paire${(pairCounts[game.id] ?? 0) > 1 ? 's' : ''}`
                          : '—';
                      return (
                        <tr key={game.id} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                                {game.icone ?? TYPE_ICONS[game.typeJeu] ?? '🎮'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{game.titre}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{game.description || 'Aucune description'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{game.typeJeu}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${status.color}`}>
                              {status.icon} {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{difficultyLabel(game.difficulte)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{game.ageMin ?? '—'}-{game.ageMax ?? '—'} ans</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{game.dureeMinutes ?? '—'} min</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{contentCount}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(viewPath)}
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                title="Visualiser"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(game.etat === 'BROUILLON' || game.etat === 'REFUSE') && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/educator/games/manage/${game.id}/edit`)}
                                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && !error && gamesToDisplay.length === 0 && (
            <div className="text-center py-16 text-gray-500 rounded-xl bg-white border border-gray-100">
              <div className="text-5xl mb-4">🎮</div>
              <p className="font-semibold text-lg">Aucun jeu en attente ou accepté.</p>
              <p className="text-sm mt-1">Seuls les jeux en attente ou acceptés apparaissent ici.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
