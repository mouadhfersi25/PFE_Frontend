import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, Users, User, Mic } from 'lucide-react';
import { format } from 'date-fns';
import userApi from '@/api/user/user.api';
import playerVoiceApi from '@/api/player/playerVoice.api';
import type { PlayerHistorySessionDTO } from '@/api/types/api.types';
import type { PlayerOralHistorySessionDTO } from '@/api/types/voice.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PlayerHistorySessionDTO[]>([]);
  const [oralSessions, setOralSessions] = useState<PlayerOralHistorySessionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      userApi.getHistorySessions(),
      playerVoiceApi.getHistory(),
    ])
      .then(([gamesRes, oralRes]) => {
        if (!cancelled) {
          setSessions(Array.isArray(gamesRes.data) ? gamesRes.data : []);
          setOralSessions(Array.isArray(oralRes.data) ? oralRes.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessions([]);
          setOralSessions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const avgScore = useMemo(
    () => Math.round(sessions.length ? sessions.reduce((sum, s) => sum + (s.scoreFinal ?? 0), 0) / sessions.length : 0),
    [sessions]
  );

  const getGameTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'quiz':
        return '🧮';
      case 'memory':
        return '🧠';
      case 'logic':
        return '🎯';
      case 'reflex':
        return '⚡';
      default:
        return '🎮';
    }
  };

  const formatDuration = (seconds?: number | null) => {
    const safe = Math.max(0, seconds ?? 0);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

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
              <h1 className="text-2xl font-bold text-white">Session History</h1>
              <p className="text-sm text-slate-300">View your past games</p>
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
          <h2 className="text-2xl font-extrabold mb-1">Historique intelligent</h2>
          <p className="text-white/85 text-sm">Suivi de toutes tes sessions avec métriques détaillées.</p>
        </motion.div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-300">Total Games</p>
            </div>
            <p className="text-3xl font-bold text-white">{sessions.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-300">Avg Score</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {avgScore}
            </p>
          </motion.div>
        </div>

        {/* Sessions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 rounded-2xl border border-white/15 overflow-hidden backdrop-blur-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sessions.map((session, index) => (
                  <motion.tr
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-white/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getGameTypeIcon(session.gameType)}</span>
                        <div>
                          <p className="font-semibold text-white">{session.gameTitle}</p>
                          <p className="text-sm text-slate-300">{session.gameType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-100">
                        {format(new Date(session.dateDebut), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-slate-300">
                        {format(new Date(session.dateDebut), 'HH:mm')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-200">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{formatDuration(session.durationSeconds)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-fuchsia-300">{session.scoreFinal}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {(session.mode || '').toLowerCase() === 'individual' ? (
                          <User className="w-4 h-4 text-slate-300" />
                        ) : (
                          <Users className="w-4 h-4 text-slate-300" />
                        )}
                        <span className="text-sm text-slate-200">{session.mode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {session.accuracy != null ? (
                        <div>
                          <p className="text-sm font-semibold text-white">{session.accuracy}%</p>
                          <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                session.accuracy >= 80
                                  ? 'bg-green-500'
                                  : session.accuracy >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${session.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Empty State (if no sessions) */}
        {sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-2xl p-12 text-center border border-white/15"
          >
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-2xl font-bold text-white mb-2">
              {loading ? 'Chargement de l’historique...' : 'No games played yet'}
            </h3>
            <p className="text-slate-300 mb-6">
              {loading ? 'Veuillez patienter.' : 'Start playing games to see your history here'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/player/new-game')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold"
            >
              Play Your First Game
            </motion.button>
          </motion.div>
        )}

        {oralSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/5 rounded-2xl border border-white/15 overflow-hidden backdrop-blur-xl mt-8"
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <Mic className="w-5 h-5 text-rose-300" />
              <h3 className="text-lg font-bold text-white">Atelier oral</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase">Série</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase">Durée</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase">Précision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {oralSessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white">{session.seriesTitle}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {session.dateFin ? format(new Date(session.dateFin), 'dd MMM yyyy HH:mm') : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{formatDuration(session.durationSeconds)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-cyan-300">{session.scoreFinal ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-emerald-300">{session.accuracyPercent ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
