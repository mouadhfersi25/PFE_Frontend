import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import type { MotifReclamation } from '@/api/types/api.types';
import { getErrorMessage } from '@/utils/errorHandler';

const MOTIF_OPTIONS: { value: MotifReclamation; label: string }[] = [
  { value: 'CONTENU_INADAPTE_AGE', label: 'Contenu inadapté à mon âge' },
  { value: 'ERREUR_REPONSE', label: 'Erreur / réponse incorrecte' },
  { value: 'IMAGE_TEXTE_CHOQUANT', label: 'Image ou texte choquant' },
  { value: 'TROP_DIFFICILE', label: 'Trop difficile / incompréhensible' },
  { value: 'BUG_TECHNIQUE', label: 'Bug technique' },
  { value: 'AUTRE', label: 'Autre (avec texte)' },
];

type ReportGameModalProps = {
  open: boolean;
  gameTitle: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (motif: MotifReclamation, commentaire: string) => Promise<void>;
};

export default function ReportGameModal({
  open,
  gameTitle,
  loading = false,
  onClose,
  onSubmit,
}: ReportGameModalProps) {
  const [motif, setMotif] = useState<MotifReclamation>('CONTENU_INADAPTE_AGE');
  const [commentaire, setCommentaire] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    setError(null);
    if (motif === 'AUTRE' && commentaire.trim().length < 10) {
      setError('Pour le motif « Autre », décrivez le problème (au moins 10 caractères).');
      return;
    }
    try {
      await onSubmit(motif, commentaire.trim());
      setCommentaire('');
      setMotif('CONTENU_INADAPTE_AGE');
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'envoyer le signalement"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c1233] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Signaler un problème</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          Jeu : <span className="font-semibold text-white">{gameTitle}</span>
        </p>

        <fieldset className="space-y-2 mb-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Motif du signalement
          </legend>
          {MOTIF_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                motif === opt.value
                  ? 'border-indigo-400/60 bg-indigo-500/15'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <input
                type="radio"
                name="motif"
                value={opt.value}
                checked={motif === opt.value}
                onChange={() => setMotif(opt.value)}
                className="accent-indigo-500"
              />
              <span className="text-sm text-slate-100">{opt.label}</span>
            </label>
          ))}
        </fieldset>

        {(motif === 'AUTRE' || commentaire.length > 0) && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {motif === 'AUTRE' ? 'Décrivez le problème (obligatoire)' : 'Commentaire (optionnel)'}
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Expliquez ce qui pose problème..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        )}

        {error ? <p className="text-sm text-rose-300 mb-3">{error}</p> : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/20 text-slate-200 font-semibold hover:bg-white/10 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
