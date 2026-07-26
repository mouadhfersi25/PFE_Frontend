import { useRef, useState } from 'react';
import { Mic, Square, RotateCcw, Volume2 } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { playBlobWithWebAudio } from '@/utils/wavRecorder';

interface VoiceRecorderProps {
  maxDurationSeconds?: number;
  lang?: string;
  disabled?: boolean;
  onRecordingReady?: (payload: { blob: Blob; durationSeconds: number; browserTranscript: string }) => void;
}

export function VoiceRecorder({
  maxDurationSeconds = 30,
  disabled = false,
  onRecordingReady,
}: VoiceRecorderProps) {
  const recorder = useVoiceRecorder({ maxDurationSeconds });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleUseRecording = () => {
    if (!recorder.audioBlob) return;
    onRecordingReady?.({
      blob: recorder.audioBlob,
      durationSeconds: Math.max(1, recorder.elapsedSeconds),
      browserTranscript: '',
    });
  };

  const replayRecording = async () => {
    if (!recorder.audioBlob) return;
    setIsPlaying(true);
    try {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        el.volume = 1;
        await el.play();
        return;
      }
    } catch {
      /* fallback below */
    }

    try {
      await playBlobWithWebAudio(recorder.audioBlob);
    } catch {
      /* ignore */
    } finally {
      setIsPlaying(false);
    }
  };

  const levelPercent = Math.min(100, Math.round(recorder.inputLevel * 280));

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-white font-semibold">Enregistrement vocal</p>
          <p className="text-sm text-slate-300">
            {recorder.isRecording
              ? `Parlez maintenant… ${recorder.elapsedSeconds}s / ${maxDurationSeconds}s`
              : 'Enregistrer → parler → Arrêter → Réécouter'}
          </p>
        </div>
        <div className="text-2xl font-mono text-cyan-300">
          {String(Math.floor(recorder.elapsedSeconds / 60)).padStart(2, '0')}:
          {String(recorder.elapsedSeconds % 60).padStart(2, '0')}
        </div>
      </div>

      {recorder.isRecording && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Niveau micro</span>
            <span>{levelPercent > 8 ? 'Signal détecté' : 'Parlez plus fort…'}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${levelPercent > 8 ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.max(levelPercent, 4)}%` }}
            />
          </div>
        </div>
      )}

      {recorder.error && (
        <p className="mb-3 text-sm text-rose-300">{recorder.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!recorder.isRecording ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void recorder.start()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            Enregistrer
          </button>
        ) : (
          <button
            type="button"
            onClick={recorder.stop}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold"
          >
            <Square className="w-4 h-4" />
            Arrêter
          </button>
        )}

        {(recorder.audioUrl || recorder.status === 'stopped') && (
          <>
            <button
              type="button"
              onClick={recorder.reset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-slate-200 hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              Recommencer
            </button>
            {recorder.audioBlob && (
              <button
                type="button"
                disabled={disabled}
                onClick={handleUseRecording}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                Valider l’enregistrement
              </button>
            )}
          </>
        )}
      </div>

      {recorder.audioUrl && (
        <div className="mt-4 rounded-xl border border-cyan-400/30 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-semibold text-white">Réécouter votre voix</p>
            <button
              type="button"
              disabled={isPlaying}
              onClick={() => void replayRecording()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              {isPlaying ? 'Lecture…' : 'Écouter'}
            </button>
          </div>
          <audio
            ref={audioRef}
            controls
            preload="auto"
            src={recorder.audioUrl}
            className="w-full"
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <p className="text-xs text-slate-400 mt-2">
            Utilisez le bouton cyan « Écouter » ou les contrôles audio. Montez le volume Windows si besoin.
          </p>
        </div>
      )}
    </div>
  );
}
