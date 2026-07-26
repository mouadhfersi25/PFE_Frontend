import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Gamepad2, Clock, Loader2 } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
} from 'recharts';
import adminApi from '@/api/admin';
import type { AdminStatisticsOverviewDTO } from '@/api/types';

function formatMinutesToHourMin(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes < 0) return '0 min';
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h <= 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export default function Statistics() {
  const [overview, setOverview] = useState<AdminStatisticsOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getStatisticsOverview()
      .then((res) => {
        if (!cancelled && res.data) setOverview(res.data);
      })
      .catch(() => {
        if (!cancelled) setOverview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const gameStats =
    overview?.gamePerformance.map((g) => ({
      name: g.name,
      plays: Number(g.plays) || 0,
      avgScore: Math.round((g.avgScore || 0) * 100) / 100,
      completion: Math.round((g.completion || 0) * 100) / 100,
    })) ?? [];

  const ageGroupStats =
    overview?.ageGroups.map((a) => ({
      age: a.age,
      avgScore: Math.round((a.avgScore || 0) * 100) / 100,
      players: Number(a.players) || 0,
    })) ?? [];

  const metrics = overview?.metrics;

  return (
    <div className="p-5 md:p-6 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
          <TrendingUp className="w-4 h-4 text-violet-600" />
          Global Statistics
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Global Statistics</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Game Performance Metrics</h2>
              <Gamepad2 className="w-5 h-5 text-gray-400" />
            </div>
            {gameStats.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-16">Aucune session enregistrée pour l&apos;instant.</p>
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={gameStats} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} interval={0} angle={-14} textAnchor="end" height={72} />
                  <YAxis yAxisId="left" stroke="#7c3aed" fontSize={11} tickFormatter={(v) => `${v}`} label={{ value: 'Parties', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={11} label={{ value: 'Score / précision %', angle: 90, position: 'insideRight', fill: '#666', fontSize: 11 }} />
                  <Tooltip formatter={(value: number, name: string) => [value, name === 'plays' ? 'Parties' : name === 'avgScore' ? 'Score moy.' : 'Précision %']} />
                  <Legend verticalAlign="top" height={28} formatter={(value) => (value === 'plays' ? 'Parties' : value === 'avgScore' ? 'Score moy.' : 'Précision %')} />
                  <Bar yAxisId="left" dataKey="plays" name="plays" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  <Line yAxisId="right" type="monotone" dataKey="avgScore" name="avgScore" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="completion" name="completion" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Performance by Age Group</h2>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            {ageGroupStats.every((a) => a.players === 0) ? (
              <p className="text-center text-sm text-slate-500 py-16">
                Pas assez de données (âge joueur + sessions) pour afficher ce graphique.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ageGroupStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="age" stroke="#666" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#666" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={12} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="avgScore" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="players"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm text-gray-600">Avg Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600">Players</span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white"
            >
              <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-3xl font-bold mb-2">
                {metrics != null
                  ? `${metrics.overallCompletionRatePercent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
                  : '—'}
              </h3>
              <p className="text-sm opacity-90">Overall Completion Rate</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white"
            >
              <Users className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-3xl font-bold mb-2">
                {metrics != null ? metrics.activePlayers.toLocaleString('fr-FR') : '—'}
              </h3>
              <p className="text-sm opacity-90">Active Players (30 j.)</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-6 text-white"
            >
              <Clock className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-3xl font-bold mb-2">
                {metrics != null ? formatMinutesToHourMin(metrics.avgPlaytimeMinutesPerUser) : '—'}
              </h3>
              <p className="text-sm opacity-90">Avg Playtime/User</p>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
