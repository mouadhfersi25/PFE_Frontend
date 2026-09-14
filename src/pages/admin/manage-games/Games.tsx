import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, Gamepad2, LayoutGrid, List, Eye, Users, ShieldCheck, Power, PowerOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import type { GameDTO, Difficulte } from '@/api/types';
import RejectGameModal from '@/components/admin/RejectGameModal';
import { gameTypeFr } from '@/utils/frLabels';

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

function difficultyLabel(d: Difficulte | null): string {
  if (d === 'FACILE') return 'Facile';
  if (d === 'MOYEN') return 'Moyen';
  if (d === 'DIFFICILE') return 'Difficile';
  return '—';
}

function difficultyClass(d: Difficulte | null): string {
  if (d === 'FACILE') return 'bg-green-100 text-green-700';
  if (d === 'MOYEN') return 'bg-yellow-100 text-yellow-700';
  if (d === 'DIFFICILE') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

/** Modération admin : uniquement jeux en attente de décision ou déjà acceptés (pas brouillon ni refusés). */
function filterAdminModerationGames(games: GameDTO[]): GameDTO[] {
  return games.filter((g) => g.etat === 'EN_ATTENTE' || g.etat === 'ACCEPTE');
}

type EducatorGroup = {
  key: string;
  name: string;
  email: string | null;
  games: GameDTO[];
};

const ADMIN_GROUP_KEY = 'admin';

/** Regroupe les jeux par éducateur créateur (les jeux créés directement par l'admin forment un groupe à part, en dernier). */
function groupGamesByEducator(games: GameDTO[]): EducatorGroup[] {
  const map = new Map<string, EducatorGroup>();
  for (const game of games) {
    const key = game.educatorId != null ? `educator-${game.educatorId}` : ADMIN_GROUP_KEY;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: game.educatorId != null ? (game.educatorName || 'Éducateur') : 'Créés par l\'administration',
        email: game.educatorId != null ? game.educatorEmail : null,
        games: [],
      });
    }
    map.get(key)!.games.push(game);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    if (a.key === ADMIN_GROUP_KEY) return 1;
    if (b.key === ADMIN_GROUP_KEY) return -1;
    return a.name.localeCompare(b.name, 'fr');
  });
  return groups;
}

function initialsFromName(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

export default function Games() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [rejectingGame, setRejectingGame] = useState<GameDTO | null>(null);
  const [groupByEducator, setGroupByEducator] = useState(true);
  const [deactivatingGame, setDeactivatingGame] = useState<GameDTO | null>(null);
  const [togglingActiveId, setTogglingActiveId] = useState<number | null>(null);

  const groupedGames: EducatorGroup[] = groupByEducator
    ? groupGamesByEducator(games)
    : [{ key: 'all', name: '', email: null, games }];

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

  /** Bascule le statut actif/inactif d'un jeu directement depuis la liste admin. */
  const handleToggleActive = (game: GameDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    if (game.actif) {
      setDeactivatingGame(game);
      return;
    }
    if (!window.confirm(`Réactiver le jeu « ${game.titre} » ? Il redeviendra visible des joueurs.`)) return;
    activateGame(game.id);
  };

  const activateGame = async (id: number) => {
    setTogglingActiveId(id);
    try {
      const res = await adminApi.activateGame(id);
      setGames((prev) => prev.map((g) => (g.id === id ? res.data : g)));
      toast.success('Jeu réactivé — l\'éducateur a été notifié.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erreur lors de la réactivation du jeu.';
      toast.error(msg);
    } finally {
      setTogglingActiveId(null);
    }
  };

  const submitDeactivate = async (reason: string) => {
    if (!deactivatingGame) return;
    setTogglingActiveId(deactivatingGame.id);
    try {
      const res = await adminApi.deactivateGame(deactivatingGame.id, reason);
      setGames((prev) => prev.map((g) => (g.id === deactivatingGame.id ? res.data : g)));
      toast.success('Jeu désactivé — l\'éducateur a été notifié.');
      setDeactivatingGame(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erreur lors de la désactivation du jeu.';
      toast.error(msg);
    } finally {
      setTogglingActiveId(null);
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
              Modération des jeux
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Modération des jeux</h1>
          </div>

          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGroupByEducator((g) => !g)}
            aria-pressed={groupByEducator}
            title={groupByEducator ? 'Désactiver le regroupement par éducateur' : 'Regrouper par éducateur'}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border text-sm font-semibold shadow-sm transition-colors ${
              groupByEducator
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white/90 text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Par éducateur
          </button>
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
          <div className="space-y-8">
            {groupedGames.map((group) => (
            <div key={group.key}>
              {groupByEducator && (
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    group.key === ADMIN_GROUP_KEY ? 'bg-gradient-to-br from-slate-500 to-slate-700' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                  }`}>
                    {group.key === ADMIN_GROUP_KEY ? <ShieldCheck className="w-5 h-5" /> : initialsFromName(group.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{group.name}</p>
                    {group.email && <p className="text-xs text-slate-500 truncate">{group.email}</p>}
                  </div>
                  <span className="ml-auto shrink-0 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    {group.games.length} jeu{group.games.length > 1 ? 'x' : ''}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {group.games.map((game, index) => (
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
                    {TYPE_ICONS[game.typeJeu] ?? '🎮'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <h3 className="text-lg font-bold text-gray-900 truncate">{game.titre}</h3>
                       <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${STATUS_LABELS[game.etat]?.color ?? ''}`}>
                         {STATUS_LABELS[game.etat]?.label ?? game.etat}
                       </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{gameTypeFr(game.typeJeu) || '—'}</p>
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

                  {/* Nombre de parties jouées */}
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <Gamepad2 className="w-4 h-4" />
                    <span>{game.sessionsCount} partie{game.sessionsCount > 1 ? 's' : ''}</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${game.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {game.actif ? 'Actif' : 'Inactif'}
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
                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(game, e)}
                        disabled={togglingActiveId === game.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors disabled:opacity-50 ${
                          game.actif
                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingActiveId === game.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : game.actif ? (
                          <PowerOff className="w-3.5 h-3.5" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                        {game.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
              </div>
            </div>
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
                  {groupedGames.map((group) => (
                  <tbody key={group.key}>
                    {groupByEducator && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={8} className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                              group.key === ADMIN_GROUP_KEY ? 'bg-gradient-to-br from-slate-500 to-slate-700' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                            }`}>
                              {group.key === ADMIN_GROUP_KEY ? <ShieldCheck className="w-3.5 h-3.5" /> : initialsFromName(group.name)}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{group.name}</span>
                            {group.email && <span className="text-xs text-slate-500">· {group.email}</span>}
                            <span className="ml-auto text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                              {group.games.length} jeu{group.games.length > 1 ? 'x' : ''}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {group.games.map((game) => (
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
                                {TYPE_ICONS[game.typeJeu] ?? '🎮'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:underline">{game.titre}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{game.description || 'Aucune description'}</p>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{gameTypeFr(game.typeJeu) || '—'}</td>
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
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${game.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {game.actif ? 'Actif' : 'Inactif'}
                          </div>
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
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleActive(game, e)}
                                  disabled={togglingActiveId === game.id}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors disabled:opacity-50 ${
                                    game.actif
                                      ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {togglingActiveId === game.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : game.actif ? (
                                    <PowerOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Power className="w-3.5 h-3.5" />
                                  )}
                                  {game.actif ? 'Désactiver' : 'Activer'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/games/${game.id}`)}
                                  title="Voir détails"
                                  aria-label="Voir détails"
                                  className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  ))}
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
      <RejectGameModal
        open={!!deactivatingGame}
        gameTitle={deactivatingGame?.titre}
        submitting={deactivatingGame != null && togglingActiveId === deactivatingGame.id}
        title="Désactiver ce jeu"
        placeholder="Ex: contenu inapproprié constaté, jeu à corriger avant remise en ligne..."
        confirmLabel="Confirmer la désactivation"
        onClose={() => setDeactivatingGame(null)}
        onConfirm={submitDeactivate}
      />
    </div>
  );
}
