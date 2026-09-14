import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Gamepad2, Target, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { EducatorDashboardStatsDTO, EducatorLearningStatsDTO } from '@/api/types/api.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { difficultyFr, gameTypeFr, difficultyColor } from '@/utils/frLabels';

const EMPTY_LEARNING: EducatorLearningStatsDTO = {
  avgSuccessRate: 0,
  totalAnswers: 0,
  improvementPercent: 0,
  sessionsByGameType: [],
};

export default function EducatorDashboard() {
  const [statsApi, setStatsApi] = useState<EducatorDashboardStatsDTO | null>(null);
  const [learningStats, setLearningStats] = useState<EducatorLearningStatsDTO>(EMPTY_LEARNING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([educatorApi.getDashboardStats(), educatorApi.getLearningStats()])
      .then(([dashRes, learnRes]) => {
        if (cancelled) return;
        setStatsApi(dashRes.data ?? null);
        setLearningStats(learnRes.data ?? EMPTY_LEARNING);
      })
      .catch(() => {
        if (!cancelled) {
          setStatsApi(null);
          setLearningStats(EMPTY_LEARNING);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSessionsPlayed = learningStats.sessionsByGameType.reduce(
    (sum, row) => sum + (row.sessions ?? 0),
    0,
  );

  const educatorStats = statsApi ?? {
    totalQuestionsCreated: 0,
    assignedGames: 0,
    avgSuccessRate: 0,
    difficultyDistribution: [
      { name: 'Easy', value: 0, color: '#93c5fd' },
      { name: 'Medium', value: 0, color: '#3b82f6' },
      { name: 'Hard', value: 0, color: '#1e40af' },
    ],
  };

  const stats = [
    {
      label: 'Questions créées',
      value: educatorStats.totalQuestionsCreated,
      icon: <HelpCircle className="w-5 h-5" />,
      iconWrap: 'bg-slate-100 text-slate-700',
      rail: 'bg-slate-400',
    },
    {
      label: 'Jeux configurés',
      value: educatorStats.assignedGames,
      icon: <Gamepad2 className="w-5 h-5" />,
      iconWrap: 'bg-blue-50 text-blue-700',
      rail: 'bg-blue-500',
    },
    {
      label: 'Taux de réussite moyen',
      value: `${educatorStats.avgSuccessRate}%`,
      icon: <Target className="w-5 h-5" />,
      iconWrap: 'bg-emerald-50 text-emerald-700',
      rail: 'bg-emerald-500',
    },
    {
      label: 'Sessions jouées',
      value: totalSessionsPlayed,
      icon: <BarChart3 className="w-5 h-5" />,
      iconWrap: 'bg-amber-50 text-amber-700',
      rail: 'bg-amber-500',
    },
  ];

  const gameTypeChartData = learningStats.sessionsByGameType.map((row) => ({
    label: gameTypeFr(row.label) || row.label,
    sessions: row.sessions,
    avgSuccessRate: row.avgSuccessRate,
    color: row.color,
  }));
  const hasGameTypeSessions = gameTypeChartData.some((row) => row.sessions > 0);

  const difficultyData = educatorStats.difficultyDistribution.map((d) => {
    const name = difficultyFr(d.name) || d.name;
    return {
      name,
      value: d.value,
      color: difficultyColor(d.name) || difficultyColor(name),
    };
  });
  const difficultyTotal = difficultyData.reduce((sum, d) => sum + d.value, 0);
  const difficultyPieData = difficultyData.filter((d) => d.value > 0);
  const difficultyPercent = (value: number) =>
    difficultyTotal > 0 ? Math.round((100 * value) / difficultyTotal) : 0;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <EducatorSidebar />
      <EducatorHeader />

      <div className="flex-1 overflow-auto">
        <div
          className="p-5 md:p-8 bg-gradient-to-b from-slate-100 via-slate-50 to-white min-h-full"
          style={{ paddingTop: '110px' }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 md:p-7 mb-8 shadow-sm">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 mb-3 border border-slate-200">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                Vue d’ensemble
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1.5">
                Tableau de bord éducateur
              </h1>
              <p className="text-sm md:text-base text-slate-500 max-w-2xl">
                Suivez vos contenus, la réussite des élèves et lancez rapidement de nouveaux jeux.
              </p>
            </div>
          </div>

          {loading && (
            <p className="text-sm text-slate-500 mb-4">Chargement des statistiques…</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${stat.rail}`} />
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconWrap}`}>
                    {stat.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Activité par type de jeu</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sessions terminées et taux de réussite moyen.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                </div>
              </div>
              {!hasGameTypeSessions && !loading ? (
                <p className="text-sm text-slate-500 py-16 text-center">
                  Aucune session terminée pour le moment.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gameTypeChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={11} allowDecimals={false} width={36} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#64748b"
                      fontSize={11}
                      domain={[0, 100]}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
                      }}
                      formatter={(value: number, name: string) =>
                        name === 'avgSuccessRate'
                          ? [`${value}%`, 'Réussite']
                          : [value, 'Sessions']
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="sessions" name="Sessions" radius={[6, 6, 0, 0]} fill="#475569" />
                    <Bar yAxisId="right" dataKey="avgSuccessRate" name="Réussite" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Répartition par difficulté</h2>
                  <p className="text-xs text-slate-500 mt-1">Questions créées par niveau.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                  <Target className="w-5 h-5 text-slate-600" />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={difficultyPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {difficultyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} (${difficultyPercent(value)}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                {difficultyData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-600">
                      {item.name}{' '}
                      <span className="text-slate-400">
                        — {item.value} ({difficultyPercent(item.value)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-slate-900 p-7 md:p-8 text-white shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold mb-2">Prêt à créer ?</h2>
                <p className="text-slate-300 text-sm md:text-base">
                  Ajoutez des questions et enrichissez l&apos;expérience d&apos;apprentissage de vos élèves.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { window.location.href = '/educator/games/manage'; }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                >
                  Gérer les jeux
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { window.location.href = '/educator/games/type/quiz'; }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors"
                >
                  Jeux quiz
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
