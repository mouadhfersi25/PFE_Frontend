import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, FileText, Loader2, AlertTriangle, PowerOff, RefreshCw, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, Difficulte, LogicPuzzleDTO, MemoryCardDTO, QuizQuestionDTO, ReflexSettingsDTO, ReclamationDTO, MotifReclamation } from '@/api/types';
import { enumLabelFr } from '@/utils/frLabels';

const MOTIF_LABELS: Record<MotifReclamation, string> = {
  CONTENU_INADAPTE_AGE: 'Contenu inadapté à l’âge',
  ERREUR_REPONSE: 'Erreur / réponse incorrecte',
  IMAGE_TEXTE_CHOQUANT: 'Image ou texte choquant',
  TROP_DIFFICILE: 'Trop difficile / incompréhensible',
  BUG_TECHNIQUE: 'Bug technique',
  AUTRE: 'Autre',
};

function difficultyLabel(d: Difficulte | null): string {
  if (d === 'FACILE') return 'Facile';
  if (d === 'MOYEN') return 'Moyen';
  if (d === 'DIFFICILE') return 'Difficile';
  return '—';
}

function formatLabel(value: string | null | undefined): string {
  return enumLabelFr(value);
}

const TYPE_ICONS: Record<string, string> = {
  QUIZ: '🧮',
  MEMOIRE: '🧠',
  REFLEXE: '⚡',
  LOGIQUE: '🎯',
};

const getContentPath = (game: Pick<GameDTO, 'id' | 'typeJeu'>): string | null => {
  if (game.typeJeu === 'QUIZ') return `/educator/games/quiz/${game.id}/questions`;
  if (game.typeJeu === 'MEMOIRE') return `/educator/games/memory/${game.id}/configure`;
  if (game.typeJeu === 'REFLEXE') return `/educator/games/reflex/${game.id}/configure`;
  if (game.typeJeu === 'LOGIQUE') return `/educator/games/logic/${game.id}/configure`;
  return null;
};

export default function EducatorViewGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'infos' | 'contenu'>('infos');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [game, setGame] = useState<GameDTO | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionDTO[]>([]);
  const [memoryCards, setMemoryCards] = useState<MemoryCardDTO[]>([]);
  const [reflexSettings, setReflexSettings] = useState<ReflexSettingsDTO | null>(null);
  const [logicPuzzles, setLogicPuzzles] = useState<LogicPuzzleDTO[]>([]);
  const [reports, setReports] = useState<ReclamationDTO[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [cancellingReactivation, setCancellingReactivation] = useState(false);

  const memoryPairCount = useMemo(() => {
    if (memoryCards.length === 0) return 0;
    const keys = new Set(memoryCards.map((c) => c.pairKey).filter(Boolean));
    if (keys.size > 0) return keys.size;
    return Math.floor(memoryCards.length / 2);
  }, [memoryCards]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Jeu introuvable.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    educatorApi.getGameById(Number(id))
      .then((res) => {
        if (!cancelled) setGame(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Jeu introuvable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!game || activeTab !== 'contenu') return;
    let cancelled = false;
    setContentLoading(true);
    setContentError(null);
    const loadContent = async () => {
      try {
        if (game.typeJeu === 'QUIZ') {
          const res = await educatorApi.getQuestions(game.id);
          if (!cancelled) setQuestions(Array.isArray(res.data) ? res.data : []);
        } else if (game.typeJeu === 'MEMOIRE') {
          const res = await educatorApi.getMemoryCards(game.id);
          if (!cancelled) setMemoryCards(Array.isArray(res.data) ? res.data : []);
        } else if (game.typeJeu === 'REFLEXE') {
          const res = await educatorApi.getReflexSettings(game.id);
          if (!cancelled) setReflexSettings(res.data ?? null);
        } else if (game.typeJeu === 'LOGIQUE') {
          const res = await educatorApi.getLogicPuzzles(game.id);
          if (!cancelled) setLogicPuzzles(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            || (err as Error)?.message
            || 'Impossible de charger le contenu.';
          setContentError(msg);
        }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };
    loadContent();
    return () => { cancelled = true; };
  }, [game, activeTab]);

  // Signalements joueurs validés (statut TRAITE) concernant ce jeu, pour que l'éducateur
  // voie les détails complets (motif, commentaire, et raison de désactivation le cas échéant).
  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    setReportsLoading(true);
    educatorApi.getReclamations()
      .then((res) => {
        if (cancelled) return;
        const all = Array.isArray(res.data) ? res.data : [];
        setReports(all.filter((r) => r.gameId === game.id));
      })
      .catch(() => {
        if (!cancelled) setReports([]);
      })
      .finally(() => {
        if (!cancelled) setReportsLoading(false);
      });
    return () => { cancelled = true; };
  }, [game]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-gray-600">{error || 'Jeu introuvable.'}</p>
          <button onClick={() => navigate('/educator/games/manage')} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg">
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const contentPath = getContentPath(game);

  const handleCancelReactivation = async () => {
    if (!game) return;
    setCancellingReactivation(true);
    try {
      const res = await educatorApi.cancelReactivationRequest(game.id);
      setGame(res.data);
      toast.success('Demande de réactivation annulée : vous pouvez de nouveau corriger le jeu.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || "Erreur lors de l'annulation de la demande.";
      toast.error(msg);
    } finally {
      setCancellingReactivation(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />
      <div className="flex-1 overflow-auto pt-16">
        <div className="p-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate('/educator/games/manage')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste des jeux
            </button>
          </div>

          <div className="h-28 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 flex items-end p-6 mb-6 shadow-lg">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">Visualiser le jeu</h1>
              <p className="text-white/90 text-sm mt-0.5">{game.titre}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 pt-6">
              <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('infos')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'infos' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Infos du jeu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contenu')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'contenu' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Contenu du jeu
                </button>
              </div>
            </div>

            {activeTab === 'infos' ? (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Titre</p>
                    <p className="font-semibold text-gray-900">{game.titre}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Type</p>
                    <p className="font-semibold text-gray-900">{formatLabel(game.typeJeu)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Mode</p>
                    <p className="font-semibold text-gray-900">{formatLabel(game.modeJeu)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Difficulté</p>
                    <p className="font-semibold text-gray-900">{difficultyLabel(game.difficulte)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Âge</p>
                    <p className="font-semibold text-gray-900">{game.ageMin ?? '—'} - {game.ageMax ?? '—'} ans</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Durée</p>
                    <p className="font-semibold text-gray-900">{game.dureeMinutes ?? '—'} min</p>
                  </div>
                  <div className={`rounded-xl border p-4 ${game.actif ? 'border-gray-200' : 'border-rose-200 bg-rose-50'}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Statut</p>
                    <p className={`font-semibold flex items-center gap-1.5 ${game.actif ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {!game.actif && <PowerOff className="w-4 h-4" />}
                      {game.actif ? 'Actif — visible des joueurs' : 'Désactivé — invisible des joueurs'}
                    </p>
                    {!game.actif && game.reactivationPending && (
                      <div className="mt-1.5">
                        <p className="text-xs font-medium text-sky-700 flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" />
                          Demande de réactivation en attente de validation
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleCancelReactivation()}
                          disabled={cancellingReactivation}
                          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 disabled:opacity-60"
                        >
                          {cancellingReactivation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          {cancellingReactivation ? 'Annulation...' : 'Annuler la demande (cliqué par erreur ?)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{game.description || 'Aucune description.'}</p>
                </div>

                {game.latestRefusalReason && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-1">Motif de refus</p>
                    <p className="text-rose-800 whitespace-pre-wrap">{game.latestRefusalReason}</p>
                  </div>
                )}

                {!game.actif && !game.reactivationPending && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 mt-4">
                    {game.latestDeactivationReason && (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-1">Détails de la désactivation</p>
                        <p className="text-rose-800 whitespace-pre-wrap mb-3">{game.latestDeactivationReason}</p>
                      </>
                    )}
                    {game.latestReactivationRejectionReason && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Précédente demande de réactivation refusée</p>
                        <p className="text-amber-900 whitespace-pre-wrap">{game.latestReactivationRejectionReason}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/educator/games/manage/${game.id}/edit`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
                    >
                      <Edit className="w-4 h-4" />
                      Corriger et demander la réactivation
                    </button>
                  </div>
                )}

                {/* Signalements joueurs validés par l'admin contre ce jeu */}
                {reportsLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification des signalements...
                  </div>
                ) : reports.length > 0 ? (
                  <div className="mt-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Signalements sur ce jeu ({reports.length})
                    </h3>
                    <div className="space-y-3">
                      {reports.map((r) => (
                        <div key={r.id} className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
                              {MOTIF_LABELS[r.motif] || r.motif}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(r.createdAt))}
                            </span>
                          </div>
                          {r.commentaire && (
                            <p className="text-sm text-gray-700 mb-2">« {r.commentaire} »</p>
                          )}
                          {r.reponseAdmin && (
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold text-gray-800">Réponse de l'administration : </span>
                              {r.reponseAdmin}
                            </p>
                          )}
                          {!r.gameActif && r.gameDeactivationReason && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-100/70 p-2.5">
                              <PowerOff className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                              <p className="text-sm text-rose-900">
                                <span className="font-semibold">Jeu désactivé — </span>
                                {r.gameDeactivationReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-8">
                {contentLoading && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement du contenu...
                  </div>
                )}

                {!contentLoading && contentError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    {contentError}
                  </div>
                )}

                {!contentLoading && !contentError && (
                  <div className="space-y-4">
                    {game.typeJeu === 'QUIZ' && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm font-semibold text-gray-900 mb-2">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
                        <div className="space-y-2">
                          {questions.slice(0, 5).map((q, idx) => (
                            <p key={q.id} className="text-sm text-gray-700">{idx + 1}. {q.contenu}</p>
                          ))}
                          {questions.length > 5 && (
                            <p className="text-xs text-gray-500">+ {questions.length - 5} autre(s) question(s)</p>
                          )}
                        </div>
                      </div>
                    )}

                    {game.typeJeu === 'MEMOIRE' && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm font-semibold text-gray-900">{memoryPairCount} paire{memoryPairCount > 1 ? 's' : ''} configurée{memoryPairCount > 1 ? 's' : ''}</p>
                      </div>
                    )}

                    {game.typeJeu === 'REFLEXE' && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Configuration Réflexe</p>
                        {reflexSettings ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <p className="text-gray-700"><span className="font-semibold text-gray-900">Modèle:</span> {formatLabel(reflexSettings.modeleReflexe)}</p>
                            <p className="text-gray-700"><span className="font-semibold text-gray-900">Rounds:</span> {reflexSettings.nombreRounds ?? '—'}</p>
                            <p className="text-gray-700"><span className="font-semibold text-gray-900">Temps max:</span> {reflexSettings.tempsReactionMaxMs ?? '—'} ms</p>
                            <p className="text-gray-700"><span className="font-semibold text-gray-900">Stimuli:</span> {formatLabel(reflexSettings.typeStimuli)}</p>
                            <p className="text-gray-700"><span className="font-semibold text-gray-900">Difficulté:</span> {reflexSettings.difficulte ?? '—'}/10</p>
                            {reflexSettings.modeleReflexe === 'GO_NO_GO' && (
                              <p className="text-gray-700"><span className="font-semibold text-gray-900">Ratio « ne pas aller » :</span> {reflexSettings.noGoRatio ?? '—'}%</p>
                            )}
                            {reflexSettings.modeleReflexe === 'CHOICE_REACTION' && (
                              <p className="text-gray-700"><span className="font-semibold text-gray-900">Choix visibles:</span> {reflexSettings.choiceTargetCount ?? '—'}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">Aucune configuration réflexe enregistrée.</p>
                        )}
                      </div>
                    )}

                    {game.typeJeu === 'LOGIQUE' && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm font-semibold text-gray-900 mb-2">{logicPuzzles.length} puzzle{logicPuzzles.length > 1 ? 's' : ''}</p>
                        <div className="space-y-2">
                          {logicPuzzles.slice(0, 5).map((p, idx) => (
                            <p key={p.id} className="text-sm text-gray-700">{idx + 1}. {p.enonce}</p>
                          ))}
                          {logicPuzzles.length > 5 && (
                            <p className="text-xs text-gray-500">+ {logicPuzzles.length - 5} autre(s) puzzle(s)</p>
                          )}
                        </div>
                      </div>
                    )}

                    {contentPath && (
                      <button
                        type="button"
                        onClick={() => navigate(contentPath)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100"
                      >
                        <FileText className="w-4 h-4" />
                        Ouvrir la page du contenu
                      </button>
                    )}

                    {!contentPath && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
                        Visualisation détaillée du contenu non disponible pour ce type de jeu.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            Mode visualisation uniquement (aucune modification sur cette page).
          </div>
        </div>
      </div>
    </div>
  );
}
