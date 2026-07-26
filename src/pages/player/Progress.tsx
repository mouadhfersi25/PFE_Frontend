import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Target, Award, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context';
import userApi from '@/api/user/user.api';
import type { PlayerProgressOverviewDTO } from '@/api/types/api.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';

export default function Progress() {
  const navigate = useNavigate();
  const { playerProfile } = useAuth();
  const [overview, setOverview] = useState<PlayerProgressOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerProfile) {
      setLoading(false);
      setOverview(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    userApi.getProgressOverview()
      .then((res) => {
        if (!cancelled) setOverview(res.data);
      })
      .catch(() => {
        if (!cancelled) setOverview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [playerProfile]);

  const skillsData = useMemo(
    () => [
      { skill: 'Math', value: overview?.skillMath ?? 0 },
      { skill: 'Logic', value: overview?.skillLogic ?? 0 },
      { skill: 'Memory', value: overview?.skillMemory ?? 0 },
      { skill: 'Reflex', value: overview?.skillReflex ?? 0 },
    ],
    [overview]
  );

  const progressData = overview?.progressData ?? [];
  const performanceByGameType = overview?.performanceByGameType ?? [];
  const currentLevel = overview?.currentLevel ?? playerProfile?.level ?? 1;
  const avgSuccessRate = overview?.avgSuccessRate ?? playerProfile?.averageSuccessRate ?? 0;
  const totalSessions = overview?.totalSessions ?? playerProfile?.totalSessions ?? 0;
  const weeklyPlaytime = `${overview?.weeklyPlaytimeMinutes ?? 0} min`;
  const latestProgressPoint = progressData.length > 0 ? progressData[progressData.length - 1] : null;

  const prettyWeekLabel = (weekRaw: string) => {
    const match = /^S(\d+)-(\d{4})$/i.exec(weekRaw ?? '');
    if (!match) return weekRaw;
    return `Sem ${match[1]} (${match[2]})`;
  };

  const skillLevelLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Bon';
    if (value >= 40) return 'Moyen';
    return 'A améliorer';
  };

  const renderDarkTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name?: string; value?: number | string; color?: string }>;
    label?: string | number;
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 shadow-xl">
        <p className="text-sm font-bold text-slate-100">{label}</p>
        <div className="mt-1 space-y-1">
          {payload.map((entry, idx) => (
            <p key={`${entry.name}-${idx}`} className="text-sm font-semibold text-slate-200">
              <span className="inline-block h-2 w-2 rounded-full mr-2 align-middle" style={{ backgroundColor: entry.color || '#a78bfa' }} />
              <span>{entry.name}: </span>
              <span>{entry.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  };

  if (!playerProfile) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-20 w-72 h-72 rounded-full bg-cyan-500/30 blur-3xl" />
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/player/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">Progress & Analytics</h1>
              <p className="text-sm text-slate-300">Track your improvement</p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 mb-8 border border-white/20 text-white bg-gradient-to-r from-violet-700/90 via-fuchsia-700/90 to-cyan-700/90"
        >
          <h2 className="text-2xl font-extrabold mb-1">Analyse de progression</h2>
          <p className="text-white/85 text-sm">Visualise tes performances et repère tes axes d'amélioration.</p>
        </motion.div>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Current Level</p>
                <p className="text-2xl font-bold text-white">{currentLevel}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Avg Success Rate</p>
                <p className="text-2xl font-bold text-white">{avgSuccessRate}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Total Sessions</p>
                <p className="text-2xl font-bold text-white">{totalSessions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Weekly Playtime</p>
                <p className="text-2xl font-bold text-white">{weeklyPlaytime}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* XP Evolution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/15 mb-8 backdrop-blur-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6">XP & Score Evolution</h3>
          {progressData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" tickFormatter={(value) => prettyWeekLabel(String(value))} />
                <YAxis yAxisId="xp" stroke="#a78bfa" />
                <YAxis yAxisId="score" orientation="right" stroke="#60a5fa" />
                <Tooltip
                  formatter={(value: number, key: string) => [value, key === 'xp' ? 'XP' : 'Score']}
                  labelFormatter={(label) => prettyWeekLabel(String(label))}
                  content={renderDarkTooltip}
                />
                <Legend />
                <Line yAxisId="xp" type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={3} name="XP" dot={{ r: 4 }} />
                <Line yAxisId="score" type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="Score" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : latestProgressPoint ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-violet-300/30 bg-violet-500/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-violet-200">XP cette semaine</p>
                  <p className="mt-2 text-3xl font-black text-violet-300">{latestProgressPoint.xp}</p>
                  <p className="text-xs text-violet-100/80 mt-2">{prettyWeekLabel(latestProgressPoint.week)}</p>
                </div>
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-cyan-200">Score cette semaine</p>
                  <p className="mt-2 text-3xl font-black text-cyan-300">{latestProgressPoint.score}</p>
                  <p className="text-xs text-cyan-100/80 mt-2">{prettyWeekLabel(latestProgressPoint.week)}</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-slate-300 mb-2">Chart de la semaine</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={[
                      { metric: 'XP', value: latestProgressPoint.xp },
                      { metric: 'Score', value: latestProgressPoint.score },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="metric" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: number, key: string) => [value, key === 'value' ? 'Valeur' : key]}
                      content={renderDarkTooltip}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#22d3ee" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-[300px] rounded-xl border border-dashed border-white/20 grid place-items-center text-slate-300">
              {loading ? 'Chargement des statistiques...' : 'Aucune donnée de progression disponible.'}
            </div>
          )}
          {progressData.length > 1 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              XP utilise l’axe gauche (violet) et Score l’axe droit (bleu) pour éviter la confusion des échelles.
            </div>
          )}
        </motion.div>

        {/* Skills Analysis (clear bars) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/15 mb-8 backdrop-blur-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6">Skills Analysis</h3>
          <div className="space-y-4">
            {skillsData.map((skill) => (
              <div key={skill.skill} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{skill.skill}</p>
                  <p className="text-sm text-slate-300">{skill.value}% • {skillLevelLabel(skill.value)}</p>
                </div>
                <div className="h-2 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                    style={{ width: `${Math.max(0, Math.min(100, skill.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance by Game Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6">Performance by Game Type</h3>
          {performanceByGameType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceByGameType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number, key: string) => [value, key === 'avgScore' ? 'Score moyen' : 'Taux de réussite %']}
                  labelFormatter={(label) => `Type: ${label}`}
                  content={renderDarkTooltip}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                />
                <Legend />
                <Bar dataKey="avgScore" fill="#8b5cf6" name="Avg Score" radius={[8, 8, 0, 0]} />
                <Bar dataKey="successRate" fill="#3b82f6" name="Success Rate %" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] rounded-xl border border-dashed border-white/20 grid place-items-center text-slate-300">
              {loading ? 'Chargement des statistiques...' : 'Aucune donnée par type de jeu disponible.'}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {performanceByGameType.map((type) => (
              <div key={type.type} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2">{type.type}</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-300">Played: <span className="font-semibold text-white">{type.played}</span></p>
                  <p className="text-slate-300">Avg Score: <span className="font-semibold text-white">{type.avgScore}</span></p>
                  <p className="text-slate-300">Success: <span className="font-semibold text-white">{type.successRate}%</span></p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
