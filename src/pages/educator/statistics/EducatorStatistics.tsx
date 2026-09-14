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
import { gameTypeFr, gameTypeColor } from '@/utils/frLabels';

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
    label: gameTypeFr(row.label) || row.label,
    sessions: row.sessions,
    avgSuccessRate: row.avgSuccessRate,
    color: gameTypeColor(row.gameType) || gameTypeColor(row.label),
  }));

  const hasSessions = chartData.some((row) => row.sessions > 0);

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
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                Statistiques d&apos;apprentissage
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Activité et performance
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Sessions terminées et taux de réussite par type de jeu.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement des statistiques…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-200"
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-slate-400" />
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-1">{stats.avgSuccessRate}%</h3>
                  <p className="text-sm text-slate-500 font-medium">Taux de réussite moyen</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-200"
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-blue-500" />
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-1">
                    {stats.totalAnswers.toLocaleString('fr-FR')}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Réponses quiz enregistrées</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-200"
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-emerald-500" />
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-1">
                    {formatImprovement(stats.improvementPercent)}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Évolution vs mois précédent</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Sessions et réussite par type de jeu
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Nombre de sessions terminées et taux de réussite moyen par catégorie.
                </p>
                {!hasSessions ? (
                  <p className="text-sm text-slate-500 py-12 text-center">
                    Aucune session terminée pour afficher le graphique.
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748b"
                          fontSize={12}
                          allowDecimals={false}
                          label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#64748b"
                          fontSize={12}
                          domain={[0, 100]}
                          label={{ value: 'Réussite %', angle: 90, position: 'insideRight', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
                          }}
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
                          fill="#475569"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="avgSuccessRate"
                          name="Taux de réussite"
                          radius={[8, 8, 0, 0]}
                          fill="#3b82f6"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                      {stats.sessionsByGameType.map((item) => (
                        <div key={item.gameType} className="flex items-center gap-2 text-sm text-slate-600 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: gameTypeColor(item.gameType) || gameTypeColor(item.label) }}
                          />
                          {gameTypeFr(item.label) || item.label}
                          <span className="text-slate-400">
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
        </div>
      </div>
    </div>
  );
}
