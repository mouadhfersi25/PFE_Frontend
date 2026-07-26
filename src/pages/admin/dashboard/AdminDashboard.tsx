import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Gamepad2, Play, Award, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import adminApi from '@/api/admin';
import type { GameDTO, EtatJeu, AdminScoringDistributionDTO, AdminDaySessionCountDTO, AdminRecentActivityDTO } from '@/api/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Check, X, Bell } from 'lucide-react';
import { toast } from 'sonner';
import RejectGameModal from '@/components/admin/RejectGameModal';

const DAYS_FALLBACK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [totalBadges, setTotalBadges] = useState<number>(0);
  const [activeSessions, setActiveSessions] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingGames, setPendingGames] = useState<GameDTO[]>([]);
  const [scoringDistribution, setScoringDistribution] = useState<AdminScoringDistributionDTO[]>([]);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [rejectingGame, setRejectingGame] = useState<GameDTO | null>(null);

  const [weeklyData, setWeeklyData] = useState<AdminDaySessionCountDTO[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [activityLogs, setActivityLogs] = useState<AdminRecentActivityDTO[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const email = user?.email ?? '';
  const displayName = user?.name ?? (email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Admin');

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    adminApi
      .getUsers()
      .then((res: { data?: unknown[] }) => {
        if (!cancelled && Array.isArray(res.data)) setTotalPlayers(res.data.length);
      })
      .catch(() => {
        if (!cancelled) setTotalPlayers(0);
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    adminApi
      .getActiveSessionsCount()
      .then((res) => {
        if (!cancelled) setActiveSessions(Number(res.data?.activeSessions || 0));
      })
      .catch(() => {
        if (!cancelled) setActiveSessions(0);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getScoringDistribution()
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) setScoringDistribution(res.data);
      })
      .catch(() => {
        if (!cancelled) setScoringDistribution([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getGames()
      .then((res: { data?: unknown[] }) => {
        if (!cancelled && Array.isArray(res.data)) setTotalGames(res.data.length);
      })
      .catch(() => {
        if (!cancelled) setTotalGames(0);
      });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    adminApi
      .getBadges()
      .then((res: { data?: unknown[] }) => {
        if (!cancelled && Array.isArray(res.data)) setTotalBadges(res.data.length);
      })
      .catch(() => {
        if (!cancelled) setTotalBadges(0);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingWeekly(true);
    adminApi
      .getStatisticsSessionsByDay()
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) setWeeklyData(res.data);
      })
      .catch(() => {
        if (!cancelled) setWeeklyData([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingWeekly(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingActivity(true);
    adminApi
      .getStatisticsRecentActivity(25)
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) setActivityLogs(res.data);
      })
      .catch(() => {
        if (!cancelled) setActivityLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingActivity(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPendingGames = async () => {
    try {
      const res = await adminApi.getGames();
      if (Array.isArray(res.data)) {
        const pending = (res.data as GameDTO[]).filter(g => g.etat === 'EN_ATTENTE');
        setPendingGames(pending);
      }
    } catch (err) {
      console.error("Failed to fetch pending games", err);
    }
  };

  useEffect(() => {
    fetchPendingGames();

    const interval = setInterval(fetchPendingGames, 10000);
    const refreshOnFocus = () => fetchPendingGames();
    const refreshOnVisibility = () => {
      if (document.visibilityState === 'visible') fetchPendingGames();
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisibility);
    };
  }, []);

  const handleStatusUpdate = async (gameId: number, status: EtatJeu) => {
    if (status === 'REFUSE') {
      const selected = pendingGames.find((g) => g.id === gameId) ?? null;
      setRejectingGame(selected);
      return;
    }
    setUpdatingStatusId(gameId);
    try {
      await adminApi.updateGameStatus(gameId, status);
      toast.success(status === 'ACCEPTE' ? 'Jeu accepté' : 'Jeu refusé');
      setPendingGames(prev => prev.filter(g => g.id !== gameId));
      // Refresh total games count if accepted
      if (status === 'ACCEPTE') {
        setTotalGames(prev => prev + 1);
      }
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const submitReject = async (reason: string) => {
    if (!rejectingGame) return;
    setUpdatingStatusId(rejectingGame.id);
    try {
      await adminApi.updateGameStatus(rejectingGame.id, 'REFUSE', reason);
      toast.success('Jeu refusé');
      setPendingGames(prev => prev.filter(g => g.id !== rejectingGame.id));
      setRejectingGame(null);
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const stats = [
    {
      label: 'Total Users',
      value: totalPlayers,
      icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      change: '—',
      loading: loadingStats,
      route: '/admin/players',
    },
    {
      label: 'Total Games',
      value: totalGames,
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      change: '—',
      loading: loadingStats,
      route: '/admin/games',
    },
    {
      label: 'Active Sessions',
      value: activeSessions,
      icon: <Play className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      change: 'Live',
      loading: false,
      route: '/admin/dashboard',

   
    },
    {
      label: 'Badges définis',
      value: totalBadges,
      icon: <Award className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      change: '—',
      loading: false,
      route: '/admin/badges',
    },
  ];

  const chartWeekly =
    weeklyData.length > 0
      ? weeklyData.map((d) => ({ day: d.day, sessions: Number(d.sessions) || 0 }))
      : DAYS_FALLBACK.map((day) => ({ day, sessions: 0 }));

  const gameStats: { name: string; plays: number; avgScore: number; avgXp: number }[] = scoringDistribution.map((row) => ({
    name: row.gameTitle,
    plays: row.sessions,
    avgScore: Number(row.avgScore || 0),
    avgXp: Number(row.avgXp || 0),
  }));
  return (
    <div className="p-5 md:p-8 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 via-slate-50 to-blue-50 p-6 md:p-8 mb-8 shadow-sm">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/70 blur-2xl" />
        <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-blue-100/40 blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-4 border border-slate-200">
            <TrendingUp className="w-4 h-4" />
            Vue globale
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Dashboard Admin</h1>
          <p className="text-slate-600 text-sm md:text-base">
            Bienvenue {displayName}. Suivez les utilisateurs, les jeux et les validations en temps réel.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => navigate(stat.route)}
            className="group relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-violet-500 to-cyan-500 opacity-80" />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                {stat.icon}
              </div>
              {stat.change !== '—' && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  {stat.change}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
              {stat.loading ? <Loader2 className="w-7 h-7 text-slate-400 animate-spin" /> : stat.value.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Activité hebdomadaire</h2>
              <p className="text-sm text-slate-500">Sessions des 30 derniers jours</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            {loadingWeekly ? (
              <div className="flex h-[260px] items-center justify-center text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <LineChart data={chartWeekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#7c3aed" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Pending Requests / Notifications Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-slate-900">Demandes en attente</h2>
            </div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold">
              {pendingGames.length}
              {pendingGames.length > 0 && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {pendingGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Gamepad2 className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 text-sm">Aucune demande de nouveau jeu pour le moment.</p>
              </div>
            ) : (
              pendingGames.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/admin/games/${game.id}`)}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-orange-50 hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0 text-xl group-hover:scale-110 transition-transform">
                      {game.icone || '🎮'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">{game.titre}</h4>
                      <p className="text-xs text-slate-500 truncate capitalize">Type: {game.typeJeu?.toLowerCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusUpdate(game.id, 'REFUSE')}
                      disabled={updatingStatusId === game.id}
                      className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors disabled:opacity-50"
                      title="Refuser"
                    >
                      {updatingStatusId === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusUpdate(game.id, 'ACCEPTE')}
                      disabled={updatingStatusId === game.id}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      title="Accepter"
                    >
                      {updatingStatusId === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Top Games Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Top jeux par nombre de parties</h2>
            <p className="text-sm text-slate-500">Classement des jeux les plus joués</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gameStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Bar dataKey="plays" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-2">Vue rapide</h2>
          <p className="text-sm text-slate-500 mb-5">Indicateurs clés de modération</p>
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs uppercase font-semibold text-violet-700 mb-1">Jeux en attente</p>
              <p className="text-2xl font-extrabold text-violet-900">{pendingGames.length}</p>
            </div>
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p className="text-xs uppercase font-semibold text-cyan-700 mb-1">Catalogue total jeux</p>
              <p className="text-2xl font-extrabold text-cyan-900">{totalGames}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="text-xs uppercase font-semibold text-amber-700 mb-1">Badges actifs</p>
              <p className="text-2xl font-extrabold text-amber-900">{totalBadges}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Activité récente</h2>
            <p className="text-sm text-slate-500">Historique des dernières actions plateforme</p>
          </div>
          <Clock className="w-5 h-5 text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Joueur</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Jeu</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {loadingActivity ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </td>
                </tr>
              ) : activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    Aucune activité récente pour le moment.
                  </td>
                </tr>
              ) : (
                activityLogs.map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{activity.player}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          activity.action === 'Terminé'
                            ? 'bg-green-100 text-green-700'
                            : activity.action === 'En cours'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {activity.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{activity.game}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {activity.occurredAt
                        ? new Date(activity.occurredAt).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      <RejectGameModal
        open={!!rejectingGame}
        gameTitle={rejectingGame?.titre}
        submitting={rejectingGame != null && updatingStatusId === rejectingGame.id}
        onClose={() => setRejectingGame(null)}
        onConfirm={submitReject}
      />
    </div>
  );
}
