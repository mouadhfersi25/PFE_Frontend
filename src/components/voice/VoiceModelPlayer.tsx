import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Pause, Play, Volume2 } from 'lucide-react';

type Props = {
  text: string;
  lang?: string;
};

/** Voix modèle (synthèse vocale) pour les consignes en mode Répétition. */
export default function VoiceModelPlayer({ text, lang = 'fr-FR' }: Props) {
  const [playing, setPlaying] = useState(false);
  const speechReady = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }, [text, lang]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (!speechReady || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [speechReady, text, lang]);

  const toggle = () => {
    if (playing) stop();
    else play();
  };

  if (!speechReady) {
    return (
      <p className="text-sm text-amber-200/90 mt-4">
        La synthèse vocale n’est pas disponible sur ce navigateur. Lis le texte, puis répète-le à voix haute.
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={toggle}
        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-50 font-semibold ${
          playing ? 'ring-2 ring-cyan-400/40' : ''
        }`}
        aria-label={playing ? 'Arrêter la voix modèle' : 'Écouter la voix modèle'}
      >
        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        {playing ? 'Arrêter' : 'Écouter le modèle'}
      </motion.button>
      <p className="text-sm text-slate-300 inline-flex items-center gap-1.5">
        <Volume2 className="w-4 h-4 text-cyan-300 shrink-0" />
        {playing ? 'Écoute en cours…' : 'Écoute d’abord, puis enregistre ta répétition.'}
      </p>
    </div>
  );
}
