import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Target, Loader2 } from 'lucide-react';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { EducatorLearningStatsDTO } from '@/api/types/api.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const EMPTY_STATS: EducatorLearningStatsDTO = {
  avgSuccessRate: 0,
  totalAnswers: 0,
  improvementPercent: 0,
  sessionsByGameType: [],
};

function formatImprovement(value: number): string {
  if (value === 0) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

export default function EducatorStatistics() {
  const [stats, setStats] = useState<EducatorLearningStatsDTO>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await educatorApi.getLearningStats();
      setStats(res.data ?? EMPTY_STATS);
    } catch {
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const chartData = stats.sessionsByGameType.map((row) => ({
    label: row.label,
    sessions: row.sessions,
    avgSuccessRate: row.avgSuccessRate,
    color: row.color,
  }));

  const hasSessions = chartData.some((row) => row.sessions > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-screen bg-gray-50"
    >
      <EducatorSidebar />
      <EducatorHeader />

      <motion.div className="flex-1 overflow-auto pt-16">
        <motion.div className="p-5 md:p-8 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
          <motion.div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-8 shadow-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Statistiques d&apos;apprentissage
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Activité et performance
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sessions terminées et taux de réussite par type de jeu.
            </p>
          </motion.div>

          {loading ? (
            <motion.div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement des statistiques…
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-6 text-white"
                >
                  <Target className="w-8 h-8 mb-4 opacity-80" />
                  <h3 className="text-3xl font-bold mb-2">{stats.avgSuccessRate}%</h3>
                  <p className="text-sm opacity-90">Taux de réussite moyen</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white"
                >
                  <BarChart3 className="w-8 h-8 mb-4 opacity-80" />
                  <h3 className="text-3xl font-bold mb-2">
                    {stats.totalAnswers.toLocaleString('fr-FR')}
                  </h3>
                  <p className="text-sm opacity-90">Réponses quiz enregistrées</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white"
                >
                  <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
                  <h3 className="text-3xl font-bold mb-2">
                    {formatImprovement(stats.improvementPercent)}
                  </h3>
                  <p className="text-sm opacity-90">Évolution vs mois précédent</p>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Sessions et réussite par type de jeu
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                  Nombre de sessions terminées et taux de réussite moyen (précision) par catégorie.
                </p>
                {!hasSessions ? (
                  <p className="text-sm text-gray-500 py-12 text-center">
                    Aucune session terminée pour afficher le graphique.
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" stroke="#666" fontSize={12} />
                        <YAxis
                          yAxisId="left"
                          stroke="#666"
                          fontSize={12}
                          allowDecimals={false}
                          label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#666"
                          fontSize={12}
                          domain={[0, 100]}
                          label={{ value: 'Réussite %', angle: 90, position: 'insideRight', fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) =>
                            name === 'avgSuccessRate' ? [`${value}%`, 'Taux de réussite'] : [value, 'Sessions']
                          }
                        />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="sessions"
                          name="Sessions"
                          radius={[8, 8, 0, 0]}
                          fill="#6366f1"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="avgSuccessRate"
                          name="Taux de réussite"
                          radius={[8, 8, 0, 0]}
                          fill="#10b981"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                      {stats.sessionsByGameType.map((item) => (
                        <div key={item.gameType} className="flex items-center gap-2 text-sm text-gray-600">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.label}
                          <span className="text-gray-400">
                            ({item.sessions} session{item.sessions !== 1 ? 's' : ''})
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
