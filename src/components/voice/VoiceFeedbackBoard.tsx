import type { VoiceEvaluationResultDTO } from '@/api/types/voice.types';

interface VoiceFeedbackBoardProps {
  result: VoiceEvaluationResultDTO;
}

export function VoiceFeedbackBoard({ result }: VoiceFeedbackBoardProps) {
  const expected = result.expectedWords ?? [];
  const correctSet = new Set((result.correctWords ?? []).map((w) => w.toLowerCase()));
  const missedSet = new Set((result.missedWords ?? []).map((w) => w.toLowerCase()));

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Résultat</h3>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${result.reussite ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
          {result.scoreContenu}% — {result.reussite ? 'Réussi' : 'À retravailler'}
        </span>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Texte attendu</p>
        <div className="flex flex-wrap gap-2">
          {expected.map((word) => {
            const key = word.toLowerCase();
            const className = correctSet.has(key)
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
              : missedSet.has(key)
                ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                : 'bg-white/10 text-slate-200 border-white/15';
            return (
              <span key={`${word}-${key}`} className={`px-2.5 py-1 rounded-lg border text-sm ${className}`}>
                {word}
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Ce que tu as dit</p>
        <p className="text-slate-200 leading-relaxed">{result.transcription || '—'}</p>
      </div>

      {(result.extraWords?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Mots en plus</p>
          <div className="flex flex-wrap gap-2">
            {result.extraWords.map((word) => (
              <span key={word} className="px-2.5 py-1 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 text-sm">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
