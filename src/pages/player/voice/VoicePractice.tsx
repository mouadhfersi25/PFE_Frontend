import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import playerVoiceApi from '@/api/player/playerVoice.api';
import type { VoiceEvaluationResultDTO, VoicePromptDTO, VoiceSeriesDTO } from '@/api/types/voice.types';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { VoiceFeedbackBoard } from '@/components/voice/VoiceFeedbackBoard';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import { getVoiceSubtypeLabel } from '@/constants/voiceExerciseTypes';

export default function VoicePractice() {
  const navigate = useNavigate();
  const { seriesId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [series, setSeries] = useState<VoiceSeriesDTO | null>(null);
  const [sessionOralId, setSessionOralId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastResult, setLastResult] = useState<VoiceEvaluationResultDTO | null>(null);
  const [attempts, setAttempts] = useState<VoiceEvaluationResultDTO[]>([]);

  const prompts = useMemo(() => series?.prompts ?? [], [series]);
  const currentPrompt: VoicePromptDTO | undefined = prompts[currentIndex];

  useEffect(() => {
    if (!seriesId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      playerVoiceApi.getSeriesById(Number(seriesId)),
      playerVoiceApi.startSession(Number(seriesId)),
    ])
      .then(([seriesRes, sessionRes]) => {
        if (cancelled) return;
        setSeries(seriesRes.data);
        setSessionOralId(sessionRes.data.sessionOralId);
      })
      .catch(() => {
        if (!cancelled) toast.error('Impossible de démarrer la série orale');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [seriesId]);

  const handleEvaluate = async (payload: { blob: Blob; durationSeconds: number; browserTranscript: string }) => {
    if (!currentPrompt || !sessionOralId) return;
    setSubmitting(true);
    try {
      const res = await playerVoiceApi.evaluate({
        promptId: currentPrompt.id,
        sessionOralId,
        audio: payload.blob,
        dureeSecondes: payload.durationSeconds,
        browserTranscript: payload.browserTranscript,
      });
      setLastResult(res.data);
      setAttempts((prev) => [...prev, res.data]);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Évaluation impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = async () => {
    if (!sessionOralId) return;
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setLastResult(null);
      return;
    }

    setSubmitting(true);
    try {
      const res = await playerVoiceApi.completeSession(sessionOralId);
      navigate('/player/voice/result', {
        state: {
          series,
          result: res.data,
          attempts,
        },
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Impossible de terminer la session');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!series || !currentPrompt) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-slate-300 mb-4">Cette série n’a pas de consignes disponibles.</p>
          <button type="button" onClick={() => navigate('/player/voice')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/player/voice')} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{series.titre}</h1>
              <p className="text-sm text-slate-300">
                Consigne {currentIndex + 1} / {prompts.length} · {getVoiceSubtypeLabel(currentPrompt.sousType)}
              </p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/15 bg-white/5 p-6"
        >
          <p className="text-xs uppercase tracking-wide text-cyan-300 mb-2">Lis ce texte à voix haute</p>
          <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-white">
            {currentPrompt.texteReference}
          </p>
          {currentPrompt.indice && (
            <p className="text-sm text-slate-300 mt-4">Indice : {currentPrompt.indice}</p>
          )}
        </motion.div>

        <VoiceRecorder
          maxDurationSeconds={currentPrompt.dureeMaxSecondes ?? 30}
          lang={series.langue === 'en' ? 'en-US' : 'fr-FR'}
          disabled={submitting}
          onRecordingReady={(payload) => void handleEvaluate(payload)}
        />

        {lastResult && <VoiceFeedbackBoard result={lastResult} />}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!lastResult || submitting}
            onClick={() => void goNext()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50"
          >
            {currentIndex < prompts.length - 1 ? 'Consigne suivante' : 'Terminer la série'}
          </button>
        </div>
      </main>
    </div>
  );
}
