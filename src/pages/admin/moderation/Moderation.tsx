import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import type { ReclamationDTO, MotifReclamation, StatutReclamation } from '@/api/types/api.types';
import { getErrorMessage } from '@/utils/errorHandler';

const STATUT_LABELS: Record<StatutReclamation, string> = {
  OUVERT: 'En attente',
  TRAITE: 'Traitée',
  REJETE: 'Rejetée',
};

const STATUT_BADGE: Record<StatutReclamation, string> = {
  OUVERT: 'bg-amber-100 text-amber-800',
  TRAITE: 'bg-green-100 text-green-700',
  REJETE: 'bg-red-100 text-red-700',
};

const MOTIF_LABELS: Record<MotifReclamation, string> = {
  CONTENU_INADAPTE_AGE: 'Contenu inadapté à mon âge',
  ERREUR_REPONSE: 'Erreur / réponse incorrecte',
  IMAGE_TEXTE_CHOQUANT: 'Image ou texte choquant',
  TROP_DIFFICILE: 'Trop difficile / incompréhensible',
  BUG_TECHNIQUE: 'Bug technique',
  AUTRE: 'Autre',
};

type FilterTab = 'pending' | 'all';

export default function Moderation() {
  const [items, setItems] = useState<ReclamationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [noteById, setNoteById] = useState<Record<number, string>>({});

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReclamations(filter === 'pending' ? true : undefined);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Impossible de charger les réclamations'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleUpdate = async (item: ReclamationDTO, statut: 'TRAITE' | 'REJETE') => {
    setProcessingId(item.id);
    try {
      const note = (noteById[item.id] || '').trim();
      const defaultMessage =
        statut === 'REJETE'
          ? 'Réclamation rejetée par l\'administration.'
          : 'Réclamation traitée par l\'administration.';
      await adminApi.updateReclamation(item.id, {
        statut,
        reponseAdmin: note || defaultMessage,
      });
      toast.success(statut === 'REJETE' ? 'Réclamation rejetée' : 'Réclamation traitée');
      await loadItems();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Échec du traitement'));
    } finally {
      setProcessingId(null);
    }
  };

  const isOpen = (item: ReclamationDTO) => item.statut === 'OUVERT';

  const formatDate = (raw: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(raw));
    } catch {
      return raw;
    }
  };

  const pendingCount = items.filter((i) => isOpen(i)).length;

  return (
    <div className="p-5 md:p-6 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
          <AlertCircle className="w-4 h-4 text-violet-600" />
          Content Moderation
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Signalements joueurs</h1>
        <p className="text-sm text-slate-600 mt-1">
          Réclamations après une session de jeu (sans champ statut : en attente = non encore traitées).
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filter === 'pending'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            En attente {filter === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filter === 'all'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Toutes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun signalement</h3>
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'Aucune réclamation en attente de traitement.'
              : 'Aucune réclamation enregistrée.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded font-medium">
                      {MOTIF_LABELS[item.motif] || item.motif}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${
                        STATUT_BADGE[item.statut] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {STATUT_LABELS[item.statut] ?? item.statut}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.gameTitle}
                    <span className="text-gray-500 font-normal text-sm ml-2">
                      ({item.gameType})
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Joueur :{' '}
                    <span className="font-medium">
                      {item.playerPrenom} {item.playerNom}
                    </span>{' '}
                    — {item.playerEmail}
                  </p>
                  {item.commentaire ? (
                    <p className="text-sm text-gray-700 mb-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                      {item.commentaire}
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-500">
                    {formatDate(item.createdAt)}
                  </p>
                  {!isOpen(item) && item.reponseAdmin ? (
                    <p
                      className={`text-sm mt-2 rounded-lg p-2 border ${
                        item.statut === 'REJETE'
                          ? 'text-red-800 bg-red-50 border-red-100'
                          : 'text-green-800 bg-green-50 border-green-100'
                      }`}
                    >
                      Réponse : {item.reponseAdmin}
                    </p>
                  ) : null}
                  {isOpen(item) ? (
                    <textarea
                      value={noteById[item.id] || ''}
                      onChange={(e) =>
                        setNoteById((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Note admin (optionnelle)..."
                      rows={2}
                      className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    to={`/admin/games/${item.gameId}`}
                    className="inline-flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le jeu
                  </Link>
                  {isOpen(item) ? (
                    <>
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => void handleUpdate(item, 'TRAITE')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm font-semibold"
                      >
                        {processingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Traiter
                      </button>
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => void handleUpdate(item, 'REJETE')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm font-semibold"
                      >
                        Rejeter
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
