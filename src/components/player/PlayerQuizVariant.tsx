import { motion } from 'motion/react';
import type { QuizVariant } from '@/constants/quizVariants';
import { getQuizVariantMeta } from '@/constants/quizVariants';

interface PlayerQuizVariantChipProps {
  variant?: string | null;
  className?: string;
}

/** Badge compact pour l'en-tête joueur (fond sombre). */
export function PlayerQuizVariantChip({ variant, className = '' }: PlayerQuizVariantChipProps) {
  const meta = getQuizVariantMeta(variant);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100 ${className}`}
      title={meta.description}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.shortLabel}
    </span>
  );
}

interface PlayerQuizVariantBannerProps {
  variant?: string | null;
}

/** Bandeau explicatif sous l'en-tête — rappelle le type de quiz en cours. */
export function PlayerQuizVariantBanner({ variant }: PlayerQuizVariantBannerProps) {
  const meta = getQuizVariantMeta(variant);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 rounded-2xl border-2 p-4 sm:p-5 ${playerVariantSurface(meta.value as QuizVariant)}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0" aria-hidden>
          {meta.icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">Mode de jeu</p>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">{meta.label}</h2>
          <p className="text-sm text-slate-200/90 mt-1.5 leading-relaxed">{meta.description}</p>
          <p className="text-xs text-slate-400 mt-2 italic">{meta.example}</p>
        </div>
      </div>
    </motion.div>
  );
}

/** Carte compacte dans la zone question. */
export function PlayerQuizVariantHint({ variant }: PlayerQuizVariantBannerProps) {
  const meta = getQuizVariantMeta(variant);
  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${playerVariantHint(meta.value as QuizVariant)}`}>
      <span className="text-lg" aria-hidden>{meta.icon}</span>
      <span className="text-sm font-bold text-white">{meta.shortLabel}</span>
      <span className="text-xs text-slate-300 hidden sm:inline">— {meta.description}</span>
    </div>
  );
}

function playerVariantSurface(variant: QuizVariant): string {
  const map: Record<QuizVariant, string> = {
    DEFAULT: 'border-slate-500/40 bg-slate-900/60',
    TRUE_FALSE: 'border-sky-400/35 bg-sky-950/50',
    CLOZE: 'border-emerald-400/35 bg-emerald-950/45',
    IMAGE_WORD: 'border-indigo-400/35 bg-indigo-950/50',
    SYNONYM_ANTONYM: 'border-amber-400/35 bg-amber-950/45',
    COLOR_TRANSLATION: 'border-fuchsia-400/35 bg-fuchsia-950/45',
    AUDIO_COLOR: 'border-cyan-400/35 bg-cyan-950/50',
  };
  return map[variant] ?? map.DEFAULT;
}

function playerVariantHint(variant: QuizVariant): string {
  const map: Record<QuizVariant, string> = {
    DEFAULT: 'border-slate-500/30 bg-slate-800/40',
    TRUE_FALSE: 'border-sky-400/25 bg-sky-950/30',
    CLOZE: 'border-emerald-400/25 bg-emerald-950/30',
    IMAGE_WORD: 'border-indigo-400/25 bg-indigo-950/30',
    SYNONYM_ANTONYM: 'border-amber-400/25 bg-amber-950/30',
    COLOR_TRANSLATION: 'border-fuchsia-400/25 bg-fuchsia-950/30',
    AUDIO_COLOR: 'border-cyan-400/25 bg-cyan-950/30',
  };
  return map[variant] ?? map.DEFAULT;
}
