import type { QuizVariant } from '@/constants/quizVariants';
import { QUIZ_VARIANT_CATALOG } from '@/constants/quizVariants';

interface QuizVariantPickerProps {
  value: QuizVariant;
  onChange: (value: QuizVariant) => void;
  disabled?: boolean;
}

export default function QuizVariantPicker({ value, onChange, disabled }: QuizVariantPickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">Variante pédagogique du quiz</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Choisissez le style de toutes les questions de ce jeu. Un quiz = une seule variante.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUIZ_VARIANT_CATALOG.map((variant) => {
          const selected = value === variant.value;
          return (
            <button
              key={variant.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(variant.value)}
              className={`text-left rounded-2xl border-2 p-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                selected
                  ? `${variant.accent} ${variant.ring} ring-2 shadow-sm`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0" aria-hidden>
                  {variant.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{variant.label}</span>
                    {selected ? (
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${variant.badge}`}>
                        Sélectionné
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{variant.description}</p>
                  <p className="text-[11px] text-gray-400 mt-2 italic leading-relaxed">{variant.example}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Badge compact pour listes (jeux, questions). */
export function QuizVariantBadge({ variant }: { variant?: string | null }) {
  const meta = QUIZ_VARIANT_CATALOG.find((v) => v.value === variant) ?? QUIZ_VARIANT_CATALOG[0];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.badge}`}
      title={meta.description}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.shortLabel}
    </span>
  );
}
