import { useCallback, useEffect, useRef, useState } from 'react';
import { startWavRecorder, type WavRecorderSession } from '@/utils/wavRecorder';

type RecorderStatus = 'idle' | 'recording' | 'stopped' | 'unsupported' | 'denied';

interface UseVoiceRecorderOptions {
  maxDurationSeconds?: number;
}

export function useVoiceRecorder({ maxDurationSeconds = 30 }: UseVoiceRecorderOptions = {}) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [inputLevel, setInputLevel] = useState(0);

  const sessionRef = useRef<WavRecorderSession | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sessionRef.current?.abort();
    sessionRef.current = null;
  }, []);

  useEffect(() => () => {
    cleanup();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedSeconds(0);
    setError(null);
    setInputLevel(0);
    setStatus('idle');
  }, [cleanup]);

  const finalizeRecording = useCallback(async () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) return;

    try {
      const { blob, peak } = await session.stop();
      if (blob.size < 500 || peak < 0.005) {
        setError('Aucun son détecté. Vérifiez votre micro, parlez plus fort, puis réessayez.');
        setStatus('idle');
        setInputLevel(0);
        return;
      }

      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioBlob(blob);
      setAudioUrl(url);
      setStatus('stopped');
      setInputLevel(0);
    } catch {
      setError('Impossible de finaliser l’enregistrement.');
      setStatus('idle');
    }
  }, []);

  const start = useCallback(async () => {
    reset();
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setError('Votre navigateur ne supporte pas l’enregistrement audio.');
      return;
    }

    try {
      const session = await startWavRecorder((level) => setInputLevel(level));
      sessionRef.current = session;
      setStatus('recording');
      setElapsedSeconds(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            void finalizeRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      setStatus('denied');
      setError('Accès au micro refusé. Autorisez le micro pour continuer.');
    }
  }, [finalizeRecording, maxDurationSeconds, reset]);

  const stop = useCallback(() => {
    void finalizeRecording();
  }, [finalizeRecording]);

  return {
    status,
    audioBlob,
    audioUrl,
    elapsedSeconds,
    error,
    inputLevel,
    start,
    stop,
    reset,
    isRecording: status === 'recording',
  };
}
