import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Loader2, Award, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import type { BadgeDTO } from '@/api/types/api.types';
import { BADGE_CONDITION_OPTIONS } from '@/api/types/api.types';

function getConditionLabel(b: BadgeDTO): string {
  const type = (b.typeCondition || 'SCORE_MIN').toUpperCase();
  const opt = BADGE_CONDITION_OPTIONS.find((o) => o.value === type);
  const label = opt?.label ?? type;
  if (opt?.needsValue && b.scoreCondition != null) {
    if (type === 'SCORE_MIN') return `Score ≥ ${b.scoreCondition}`;
    if (type === 'GAMES_PLAYED') return `Jouer ${b.scoreCondition} partie(s)`;
    if (type === 'STREAK_DAYS') return `Série de ${b.scoreCondition} jour(s)`;
    return `${label} : ${b.scoreCondition}`;
  }
  return label;
}

const ACCENTS = [
  { gradient: 'from-amber-400 via-orange-500 to-rose-500', bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-700' },
  { gradient: 'from-orange-500 via-rose-500 to-pink-500', bg: 'bg-rose-500/10', border: 'border-rose-400/30', text: 'text-rose-700' },
  { gradient: 'from-rose-500 via-pink-500 to-fuchsia-500', bg: 'bg-pink-500/10', border: 'border-pink-400/30', text: 'text-pink-700' },
  { gradient: 'from-amber-500 via-yellow-500 to-orange-400', bg: 'bg-yellow-500/10', border: 'border-yellow-400/30', text: 'text-amber-800' },
];

export default function Badges() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<BadgeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getBadges()
      .then((res) => {
        if (!cancelled) setBadges(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Erreur lors du chargement');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = (badge: BadgeDTO) => {
    if (!confirm(`Supprimer le badge « ${badge.nom} » ?`)) return;
    setDeletingId(badge.id);
    adminApi
      .deleteBadge(badge.id)
      .then(() => {
        setBadges((prev) => prev.filter((b) => b.id !== badge.id));
        toast.success('Badge supprimé');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50/30">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-3">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
            <Award className="w-4 h-4 text-violet-600" />
            Gestion des badges
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestion des badges
            </h1>
            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
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

      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex justify-end mb-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin/badges/add')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Ajouter un badge
          </motion.button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200/80 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-slate-500 text-sm">Chargement des badges…</p>
          </div>
        ) : badges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
              <Award className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Aucun badge pour l’instant</h2>
            <p className="text-slate-600 text-sm max-w-sm mb-6">
              Créez votre premier badge pour récompenser les joueurs et afficher les conditions de déblocage.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin/badges/add')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-rose-500 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Créer un badge
            </motion.button>
          </motion.div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {badges.map((badge, index) => {
              const style = ACCENTS[index % ACCENTS.length];
              return (
                <motion.article
                  key={badge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/60 transition-all duration-300"
                >
                  {/* Barre d’accent en haut */}
                  <div className={`h-2 w-full bg-gradient-to-r ${style.gradient}`} />

                  <div className="flex-1 flex flex-col p-4">
                    {/* Icône + actions */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-4xl shadow-lg ring-4 ring-white`}
                      >
                        {badge.icone || '🏆'}
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/admin/badges/${badge.id}/edit`)}
                          className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(badge)}
                          disabled={deletingId === badge.id}
                          className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deletingId === badge.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 leading-tight">
                      {badge.nom}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed flex-1">
                      {badge.description || 'Aucune description'}
                    </p>

                    {/* Condition */}
                    <div
                      className={`flex items-center gap-2.5 py-3 px-4 rounded-xl border-l-4 ${style.bg} ${style.border} ${style.text}`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                        Condition
                      </span>
                      <span className="text-sm font-medium truncate">
                        {getConditionLabel(badge)}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Badge</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Condition</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {badges.map((badge) => (
                    <tr key={badge.id} className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-xl">
                            {badge.icone || '🏆'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{badge.nom}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[360px]">
                        <p className="line-clamp-2">{badge.description || 'Aucune description'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {getConditionLabel(badge)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/badges/${badge.id}/edit`)}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(badge)}
                            disabled={deletingId === badge.id}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingId === badge.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
