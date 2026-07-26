import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Gamepad2, Target, Users, TrendingUp, Clock } from 'lucide-react';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { EducatorDashboardStatsDTO } from '@/api/types/api.types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function EducatorDashboard() {
  const [statsApi, setStatsApi] = useState<EducatorDashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    educatorApi
      .getDashboardStats()
      .then((res) => {
        if (!cancelled) setStatsApi(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setStatsApi(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const educatorStats = statsApi ?? {
    totalQuestionsCreated: 0,
    assignedGames: 0,
    avgSuccessRate: 0,
    studentActivity: 0,
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
      label: 'Activité élèves',
      value: educatorStats.studentActivity,
      icon: <Users className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const questionPerformance: { question: string; correct: number; incorrect: number; difficulty: string }[] = [];
  const difficultyData = educatorStats.difficultyDistribution.map((d) => ({
    name: d.name,
    value: d.value,
    color: d.color,
  }));

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
            {/* Question Performance — données à partir de résultats / statistiques BDD */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">Performance par question</h2>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mb-6">Données à venir (ex. statistiques_performance, réponses)</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="question" stroke="#666" fontSize={11} angle={-15} textAnchor="end" height={80} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="correct" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="incorrect" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Difficulty Distribution — BDD: questions.difficulte (1=Easy, 2=Medium, 3=Hard) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-1">Répartition par difficulté</h2>
              <p className="text-xs text-gray-500 mb-6">Colonne questions.difficulte (1=Easy, 2=Medium, 3=Hard)</p>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {difficultyData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
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
