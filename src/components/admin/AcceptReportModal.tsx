import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X, AlertTriangle, PowerOff } from 'lucide-react';
import type { ReclamationDTO, MotifReclamation } from '@/api/types/api.types';

const MOTIF_LABELS: Record<MotifReclamation, string> = {
  CONTENU_INADAPTE_AGE: 'Contenu inadapté à mon âge',
  ERREUR_REPONSE: 'Erreur / réponse incorrecte',
  IMAGE_TEXTE_CHOQUANT: 'Image ou texte choquant',
  TROP_DIFFICILE: 'Trop difficile / incompréhensible',
  BUG_TECHNIQUE: 'Bug technique',
  AUTRE: 'Autre',
};

export interface AcceptReportResult {
  reponseAdmin: string;
  deactivate: boolean;
  deactivationReason: string;
}

type AcceptReportModalProps = {
  open: boolean;
  report: ReclamationDTO | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (result: AcceptReportResult) => Promise<void> | void;
};

/**
 * Popup affichée quand l'admin accepte ("Traiter") un signalement joueur. L'éducateur
 * propriétaire du jeu sera notifié du signalement dans tous les cas ; l'admin peut en plus
 * choisir de désactiver le jeu directement ici, avec un motif obligatoire qui sera transmis
 * à l'éducateur par e-mail et notification.
 */
export default function AcceptReportModal({
  open,
  report,
  submitting = false,
  onClose,
  onConfirm,
}: AcceptReportModalProps) {
  const MIN_REASON_LENGTH = 10;
  const [reponseAdmin, setReponseAdmin] = useState('');
  const [deactivate, setDeactivate] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReponseAdmin('');
      setDeactivate(false);
      setDeactivationReason('');
      setError(null);
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !report) return null;

  const normalizedResponse = reponseAdmin.trim();
  const normalizedDeactivationReason = deactivationReason.trim();

  const handleConfirm = async () => {
    if (deactivate && normalizedDeactivationReason.length < MIN_REASON_LENGTH) {
      setError(`Les détails de désactivation doivent contenir au moins ${MIN_REASON_LENGTH} caractères.`);
      return;
    }
    setError(null);
    await onConfirm({
      reponseAdmin: normalizedResponse || 'Signalement examiné et validé par l\'administration.',
      deactivate,
      deactivationReason: normalizedDeactivationReason,
    });
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
          <h3 className="text-lg font-bold text-slate-900">Accepter le signalement</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold">
                {MOTIF_LABELS[report.motif] || report.motif}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {report.gameTitle} <span className="text-slate-500 font-normal">({report.gameType})</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Signalé par {report.playerPrenom} {report.playerNom}
            </p>
            {report.commentaire && (
              <p className="text-sm text-slate-700 mt-2 bg-white rounded-lg p-2 border border-slate-100">
                « {report.commentaire} »
              </p>
            )}
          </div>

          <div>
            <label htmlFor="reponseAdmin" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Réponse au signalement (note interne)
            </label>
            <textarea
              id="reponseAdmin"
              value={reponseAdmin}
              onChange={(e) => setReponseAdmin(e.target.value)}
              placeholder="Ex: Signalement fondé, contenu vérifié..."
              rows={3}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={deactivate}
              onChange={(e) => {
                setDeactivate(e.target.checked);
                if (error) setError(null);
              }}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <PowerOff className="h-4 w-4 text-rose-600" />
                Désactiver ce jeu suite à ce signalement
              </span>
              <span className="text-xs text-slate-500">
                Le jeu ne sera plus accessible aux joueurs jusqu'à correction par l'éducateur.
              </span>
            </span>
          </label>

          {deactivate && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
              <label htmlFor="deactivationReason" className="flex items-center gap-1.5 text-sm font-semibold text-rose-800 mb-1.5">
                <AlertTriangle className="h-4 w-4" />
                Détails de la désactivation (envoyés à l'éducateur)
              </label>
              <textarea
                id="deactivationReason"
                value={deactivationReason}
                onChange={(e) => {
                  setDeactivationReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: Une question comporte une image inadaptée à l'âge des joueurs, merci de la remplacer avant de resoumettre le jeu..."
                rows={4}
                disabled={submitting}
                className="w-full rounded-xl border border-rose-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50"
              />
              <p className="text-xs text-rose-700 mt-1">
                {normalizedDeactivationReason.length}/{MIN_REASON_LENGTH} caractères minimum
              </p>
            </div>
          )}

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
            onClick={() => void handleConfirm()}
            disabled={submitting || (deactivate && normalizedDeactivationReason.length < MIN_REASON_LENGTH)}
            className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {deactivate ? 'Confirmer et désactiver le jeu' : 'Confirmer le signalement'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
