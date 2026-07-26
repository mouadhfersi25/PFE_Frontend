import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

type RejectGameModalProps = {
  open: boolean;
  gameTitle?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
};

export default function RejectGameModal({
  open,
  gameTitle,
  submitting = false,
  onClose,
  onConfirm,
}: RejectGameModalProps) {
  const MIN_REASON_LENGTH = 10;
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const normalizedReason = reason.trim();
  const isReasonValid = normalizedReason.length >= MIN_REASON_LENGTH;

  useEffect(() => {
    if (!open) {
      setReason('');
      setError(null);
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!normalizedReason) {
      setError('Le motif de refus est obligatoire.');
      return;
    }
    if (!isReasonValid) {
      setError(`Le motif doit contenir au moins ${MIN_REASON_LENGTH} caractères.`);
      return;
    }
    setError(null);
    await onConfirm(normalizedReason);
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={submitting ? undefined : onClose}
      />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Refuser la demande de jeu</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 overflow-y-auto max-h-[calc(90vh-132px)]">
          <p className="text-sm text-slate-600">
            {gameTitle ? (
              <>Jeu concerné: <span className="font-semibold text-slate-900">{gameTitle}</span></>
            ) : (
              'Veuillez indiquer le motif de refus.'
            )}
          </p>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ex: Les consignes ne sont pas claires, merci d'ajouter une explication pour chaque question..."
            rows={5}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50"
          />
          <p className="text-xs text-slate-500">
            {normalizedReason.length}/{MIN_REASON_LENGTH} caractères minimum
          </p>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !isReasonValid}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
