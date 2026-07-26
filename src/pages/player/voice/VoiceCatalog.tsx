import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Loader2 } from 'lucide-react';
import playerVoiceApi from '@/api/player/playerVoice.api';
import type { VoiceSeriesDTO } from '@/api/types/voice.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';

export default function VoiceCatalog() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<VoiceSeriesDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerVoiceApi.getSeries()
      .then((res) => setSeries(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSeries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/player/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Atelier oral</h1>
              <p className="text-sm text-slate-300">Choisis une série et entraîne ta prononciation</p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-300" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-16 text-slate-300">
            Aucune série orale publiée pour le moment.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {series.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/player/voice/${item.id}`)}
                className="text-left rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{item.titre}</h2>
                    <p className="text-sm text-slate-300 mt-1">{item.description || 'Série de lecture orale'}</p>
                    <p className="text-xs text-cyan-300 mt-3">
                      {item.promptsCount ?? 0} consigne(s) · {item.langue?.toUpperCase() || 'FR'}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
