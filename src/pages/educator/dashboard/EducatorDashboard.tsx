import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Gamepad2, Target, TrendingUp, BarChart3 } from 'lucide-react';
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
      { name: 'Easy', value: 0, color: '#10b981' },
      { name: 'Medium', value: 0, color: '#f59e0b' },
      { name: 'Hard', value: 0, color: '#ef4444' },
    ],
  };

  const stats = [
    {
      label: 'Questions créées',
      value: educatorStats.totalQuestionsCreated,
      icon: <HelpCircle className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
    },
    {
      label: 'Jeux configurés',
      value: educatorStats.assignedGames,
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Taux de réussite moyen',
      value: `${educatorStats.avgSuccessRate}%`,
      icon: <Target className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Sessions jouées',
      value: totalSessionsPlayed,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const gameTypeChartData = learningStats.sessionsByGameType.map((row) => ({
    label: row.label,
    sessions: row.sessions,
    avgSuccessRate: row.avgSuccessRate,
    color: row.color,
  }));
  const hasGameTypeSessions = gameTypeChartData.some((row) => row.sessions > 0);

  const difficultyData = educatorStats.difficultyDistribution.map((d) => ({
    name: d.name,
    value: d.value,
    color: d.color,
  }));
  const difficultyTotal = difficultyData.reduce((sum, d) => sum + d.value, 0);
  const difficultyPieData = difficultyData.filter((d) => d.value > 0);
  const difficultyPercent = (value: number) =>
    difficultyTotal > 0 ? Math.round((100 * value) / difficultyTotal) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />
      
      <div className="flex-1 overflow-auto">
        <div
          className="p-5 md:p-8 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full"
          style={{ paddingTop: '110px' }}
        >
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
              <Target className="w-4 h-4 text-emerald-600" />
              Educator Dashboard
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Educator Dashboard</h1>
          </div>

          {/* Stats Grid - synchronisé BDD */}
          {loading && (
            <p className="text-sm text-gray-500 mb-4">Chargement des statistiques…</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activité par type de jeu — BDD: sessions_jeu + jeux.type_jeu */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">Activité par type de jeu</h2>
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Sessions terminées et taux de réussite moyen par catégorie.
              </p>
              {!hasGameTypeSessions && !loading ? (
                <p className="text-sm text-gray-500 py-16 text-center">
                  Aucune session terminée pour le moment.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gameTypeChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" stroke="#666" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#666" fontSize={11} allowDecimals={false} width={36} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#666"
                      fontSize={11}
                      domain={[0, 100]}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === 'avgSuccessRate'
                          ? [`${value}%`, 'Réussite']
                          : [value, 'Sessions']
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      yAxisId="left"
                      dataKey="sessions"
                      name="Sessions"
                      radius={[6, 6, 0, 0]}
                      fill="#6366f1"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="avgSuccessRate"
                      name="Réussite"
                      radius={[6, 6, 0, 0]}
                      fill="#10b981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Difficulty Distribution — BDD: questions.difficulte (1=Easy, 2=Medium, 3=Hard) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-1">Répartition par difficulté</h2>
              <p className="text-xs text-gray-500 mb-6">Répartition des questions créées par niveau.</p>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={difficultyPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {difficultyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} (${difficultyPercent(value)}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
                {difficultyData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">
                      {item.name}{' '}
                      <span className="text-gray-400">
                        — {item.value} ({difficultyPercent(item.value)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Ready to create?</h2>
            <p className="mb-6 opacity-90">Start adding questions to enhance the learning experience</p>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/educator/games/manage'}
                className="px-6 py-3 bg-white text-green-600 rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                Manage Games
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/educator/games/type/quiz'}
                className="px-6 py-3 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors border border-white/30"
              >
                Quiz Games
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
