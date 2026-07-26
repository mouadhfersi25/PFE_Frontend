import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Mic, RotateCcw, Trophy } from 'lucide-react';
import { useAuth } from '@/context';
import type { CompleteVoiceSessionResponse, VoiceSeriesDTO } from '@/api/types/voice.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';

export default function VoiceResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { series, result } = (location.state || {}) as {
    series?: VoiceSeriesDTO;
    result?: CompleteVoiceSessionResponse;
  };

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-slate-300 mb-4">Aucun résultat de session oral.</p>
          <button type="button" onClick={() => navigate('/player/voice')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">
            Retour à l’atelier oral
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="w-6 h-6 text-rose-300" />
            <div>
              <h1 className="text-xl font-bold">Bilan atelier oral</h1>
              <p className="text-sm text-slate-300">{series?.titre || 'Série terminée'}</p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-white/15 bg-gradient-to-br from-indigo-900/50 to-slate-900/80 p-8 text-center"
        >
          <Trophy className="w-14 h-14 text-amber-300 mx-auto mb-4" />
          <p className="text-slate-300 mb-2">Score de la série</p>
          <p className="text-5xl font-black text-white mb-2">{result.scoreFinal}</p>
          <p className="text-cyan-300 font-semibold">Précision {result.accuracyPercent}%</p>
          {result.levelUp && (
            <p className="mt-4 text-emerald-300 font-bold">Niveau supérieur atteint ! Niveau {result.newLevel}</p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard label="XP gagnée" value={`+${result.xpGained}`} />
          <StatCard label="Consignes réussies" value={`${result.promptsReussis}/${result.promptsTotal}`} />
          <StatCard label="Score total" value={String(result.totalScore)} />
          <StatCard label="Durée" value={`${Math.floor((result.durationSeconds || 0) / 60)}:${String((result.durationSeconds || 0) % 60).padStart(2, '0')}`} />
        </div>

        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <button
            type="button"
            onClick={() => navigate('/player/voice')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            Autre série
          </button>
          <button
            type="button"
            onClick={() => navigate('/player/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10"
          >
            <Home className="w-4 h-4" />
            Tableau de bord
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
