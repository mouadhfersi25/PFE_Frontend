import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Edit, Loader2, Tag, Target, Zap, Clock, Gamepad2, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, EtatJeu, QuizQuestionDTO, MemoryCardDTO, GameAiReviewDTO, LogicPuzzleDTO, ReflexSettingsDTO } from '@/api/types';
import RejectGameModal from '@/components/admin/RejectGameModal';

const TYPE_ICONS: Record<string, string> = {
  QUIZ: '🧮',
  MEMOIRE: '🧠',
  REFLEXE: '⚡',
  LOGIQUE: '🎯',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100/90 text-slate-700 border-slate-200' },
  EN_ATTENTE: { label: 'En attente', color: 'bg-amber-100/90 text-amber-800 border-amber-200' },
  ACCEPTE: { label: 'Accepté', color: 'bg-emerald-100/90 text-emerald-800 border-emerald-200' },
  REFUSE: { label: 'Refusé', color: 'bg-rose-100/90 text-rose-800 border-rose-200' },
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return dateStr;
  }
}

function difficultyLabel(d: number | null): string {
  if (d == null) return '—';
  if (d <= 3) return 'Facile';
  if (d <= 6) return 'Moyen';
  return 'Difficile';
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDTO[]>([]);
  const [memoryCards, setMemoryCards] = useState<MemoryCardDTO[]>([]);
  const [logicPuzzles, setLogicPuzzles] = useState<LogicPuzzleDTO[]>([]);
  const [reflexSettings, setReflexSettings] = useState<ReflexSettingsDTO | null>(null);
  const [aiReview, setAiReview] = useState<GameAiReviewDTO | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const memoryPairs = useMemo(() => {
    // Regroupe les cartes deux par deux via `pairKey`.
    // Si `pairKey` est null, on considère chaque carte comme une "paire orpheline".
    const byPairKey = new Map<string, MemoryCardDTO[]>();
    for (const c of memoryCards) {
      const key = c.pairKey ?? `orphan-${c.id}`;
      if (!byPairKey.has(key)) byPairKey.set(key, []);
      byPairKey.get(key)!.push(c);
    }

    const pairs = Array.from(byPairKey.entries()).map(([key, cards]) => {
      const sorted = [...cards].sort((a, b) => a.id - b.id);
      return {
        key,
        categorie: sorted[0]?.categorie ?? null,
        cards: sorted,
      };
    });

    // Tri stable : d'abord par id du premier élément, sinon par clé.
    pairs.sort((a, b) => {
      const aid = a.cards[0]?.id ?? 0;
      const bid = b.cards[0]?.id ?? 0;
      if (aid !== bid) return aid - bid;
      return a.key.localeCompare(b.key);
    });

    return pairs;
  }, [memoryCards]);

  const handleStatusUpdate = async (status: EtatJeu) => {
    if (!game) return;
    if (status === 'REFUSE') {
      setShowRejectModal(true);
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await adminApi.updateGameStatus(game.id, status);
      setGame(res.data);
      toast.success(status === 'ACCEPTE' ? 'Jeu accepté' : 'Jeu refusé');
      navigate('/admin/games');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const submitReject = async (reason: string) => {
    if (!game) return;
    setUpdatingStatus(true);
    try {
      const res = await adminApi.updateGameStatus(game.id, 'REFUSE', reason);
      setGame(res.data);
      toast.success('Jeu refusé');
      setShowRejectModal(false);
      navigate('/admin/games');
    } catch {
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const runAiReview = async () => {
    if (!game) return;
    setAiLoading(true);
    try {
      const res = await adminApi.getGameAiReview(game.id);
      setAiReview(res.data);
      toast.success('Analyse IA terminée');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Échec analyse IA');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getGameById(Number(id))
      .then((res) => {
        if (!cancelled) setGame(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Jeu introuvable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const loadContent = async () => {
      if (!game) return;
      setContentLoading(true);
      setContentError(null);

      try {
        if (game.typeJeu === 'QUIZ') {
          const res = await adminApi.getGameQuestions(game.id);
          setQuizQuestions(Array.isArray(res.data) ? res.data : []);
          setMemoryCards([]);
          setLogicPuzzles([]);
          setReflexSettings(null);
          if (!Array.isArray(res.data) || res.data.length === 0) {
            const fallback = await educatorApi.getQuestions(game.id);
            setQuizQuestions(Array.isArray(fallback.data) ? fallback.data : []);
          }
        } else if (game.typeJeu === 'MEMOIRE') {
          const res = await adminApi.getGameMemoryCards(game.id);
          setMemoryCards(Array.isArray(res.data) ? res.data : []);
          setQuizQuestions([]);
          setLogicPuzzles([]);
          setReflexSettings(null);
          if (!Array.isArray(res.data) || res.data.length === 0) {
            const fallback = await educatorApi.getMemoryCards(game.id);
            setMemoryCards(Array.isArray(fallback.data) ? fallback.data : []);
          }
        } else if (game.typeJeu === 'LOGIQUE') {
          const res = await adminApi.getGameLogicPuzzles(game.id);
          setLogicPuzzles(Array.isArray(res.data) ? res.data : []);
          setQuizQuestions([]);
          setMemoryCards([]);
          setReflexSettings(null);
          if (!Array.isArray(res.data) || res.data.length === 0) {
            const fallback = await educatorApi.getLogicPuzzles(game.id);
            setLogicPuzzles(Array.isArray(fallback.data) ? fallback.data : []);
          }
        } else if (game.typeJeu === 'REFLEXE') {
          const res = await adminApi.getGameReflexSettings(game.id);
          setReflexSettings(res.data ?? null);
          setQuizQuestions([]);
          setMemoryCards([]);
          setLogicPuzzles([]);
          if (!res.data) {
            const fallback = await educatorApi.getReflexSettings(game.id);
            setReflexSettings(fallback.data ?? null);
          }
        } else {
          setQuizQuestions([]);
          setMemoryCards([]);
          setLogicPuzzles([]);
          setReflexSettings(null);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const serverMessage = err?.response?.data?.message || err?.message;
        if (status === 403) {
          setContentError('Accès refusé admin => contenu (403). Essayez /educator pour vérifier le role.');
        } else {
          setContentError(`Impossible de charger le contenu du jeu. ${serverMessage ?? ''}`);
        }
      } finally {
        setContentLoading(false);
      }
    };
    loadContent();
  }, [game]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">{error || 'Jeu introuvable'}</p>
        <button
          onClick={() => navigate('/admin/games')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto min-h-[calc(100vh-6rem)] flex flex-col bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      {/* Barre du haut */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/games')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 transition-all"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Retour à la liste des jeux
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runAiReview}
            disabled={aiLoading || game?.etat !== 'EN_ATTENTE'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 disabled:opacity-60"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiLoading ? 'Analyse...' : 'Analyser avec IA'}
          </button>
        {game?.etat === 'EN_ATTENTE' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusUpdate('REFUSE')}
              disabled={updatingStatus}
              className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-sm font-semibold hover:bg-rose-100 disabled:opacity-60"
            >
              {updatingStatus ? 'Traitement...' : 'Refuser'}
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate('ACCEPTE')}
              disabled={updatingStatus}
              className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-60"
            >
              {updatingStatus ? 'Traitement...' : 'Accepter'}
            </button>
          </div>
        )}
        </div>
      </div>

      {/* En-tête gradient */}
      <div className="h-28 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 flex items-center p-6 mb-6 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-white/95 shadow-lg flex items-center justify-center text-3xl ring-2 ring-white/50 shrink-0">
          {game.icone ?? TYPE_ICONS[game.typeJeu] ?? '🎮'}
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-white drop-shadow-sm truncate">{game.titre}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full border shadow-sm font-bold uppercase ${STATUS_LABELS[game.etat]?.color ?? ''}`}>
              {STATUS_LABELS[game.etat]?.label ?? game.etat}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white/95 text-violet-700 shadow-sm">
              {formatLabel(game.typeJeu)}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white/95 text-cyan-700 shadow-sm">
              {formatLabel(game.modeJeu)}
            </span>
          </div>
        </div>
      </div>

      {/* Description + Infos côte à côte : même hauteur pour remplir l'espace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        {/* Description — s'étire sur toute la hauteur de la rangée */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col min-h-[280px] lg:min-h-0"
        >
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Description du jeu</p>
          <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap flex-1">
            {game.description || 'Aucune description.'}
          </p>
          {game.etat === 'REFUSE' && game.latestRefusalReason && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 mb-1">Motif de refus</p>
              <p className="text-sm text-rose-800 whitespace-pre-wrap">{game.latestRefusalReason}</p>
            </div>
          )}
        </motion.section>

        {/* Infos 2×3 — même hauteur que la description */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[280px] lg:min-h-0"
        >
          <div className="grid grid-cols-2 lg:grid-cols-2 divide-x divide-y divide-slate-100 flex-1">
            <div className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${game.actif ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <Tag className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</p>
                <p className={`font-semibold ${game.actif ? 'text-green-700' : 'text-gray-600'}`}>
                  {game.actif ? 'Visible pour les joueurs' : 'Masqué'}
                </p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulté</p>
                <p className="font-semibold text-gray-900 text-lg">{difficultyLabel(game.difficulte)}</p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tranche d'âge</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {game.ageMin != null && game.ageMax != null ? `${game.ageMin}–${game.ageMax} ans` : '—'}
                </p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Durée estimée</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {game.dureeMinutes != null ? `${game.dureeMinutes} min` : '—'}
                </p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Création</p>
                <p className="font-semibold text-gray-900">{formatDateTime(game.dateCreation)}</p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {aiReview && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900 inline-flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
              Rapport de validation IA
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-xs uppercase tracking-wide text-slate-500">Score global</p>
              <p className="text-2xl font-bold text-slate-900">{aiReview.score}/100</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-xs uppercase tracking-wide text-slate-500">Niveau de risque</p>
              <p className="text-lg font-bold text-slate-900">{aiReview.riskLevel}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-xs uppercase tracking-wide text-slate-500">Suggestion IA</p>
              <p className="text-lg font-bold text-slate-900">{aiReview.suggestedAction}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-violet-100 bg-violet-50 mb-4">
            <p className="text-sm text-violet-900">{aiReview.summary}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
              <p className="font-semibold text-emerald-900 mb-2">Points forts</p>
              <ul className="text-sm text-emerald-800 list-disc pl-5 space-y-1">
                {aiReview.strengths?.length ? aiReview.strengths.map((s) => <li key={s}>{s}</li>) : <li>—</li>}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50">
              <p className="font-semibold text-rose-900 mb-2 inline-flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Points à corriger
              </p>
              <ul className="text-sm text-rose-800 list-disc pl-5 space-y-1">
                {aiReview.issues?.length ? aiReview.issues.map((s) => <li key={s}>{s}</li>) : <li>—</li>}
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50">
              <p className="font-semibold text-amber-900 mb-2">Recommandations</p>
              <ul className="text-sm text-amber-800 list-disc pl-5 space-y-1">
                {aiReview.recommendations?.length ? aiReview.recommendations.map((s) => <li key={s}>{s}</li>) : <li>—</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
      {game?.etat !== 'EN_ATTENTE' && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          L'analyse IA est disponible uniquement pour les jeux finalisés en attente de validation admin.
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 shadow-sm p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Contenu du jeu</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">Aperçu détaillé pour la validation admin</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            {formatLabel(game.typeJeu)}
          </span>
        </div>

        {contentError && (
          <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-100 text-rose-700">
            <p className="font-semibold">Impossible de charger le contenu du jeu</p>
            <p className="text-sm mt-1">{contentError}</p>
            {game && game.typeJeu === 'QUIZ' && (
              <button
                type="button"
                onClick={() => navigate(`/educator/games/quiz/${game.id}/questions`)}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                Voir le contenu côté éducateur
              </button>
            )}
            {game && game.typeJeu === 'MEMOIRE' && (
              <button
                type="button"
                onClick={() => navigate(`/educator/games/memory/${game.id}/configure`)}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                Voir le contenu côté éducateur
              </button>
            )}
            {game && game.typeJeu === 'LOGIQUE' && (
              <button
                type="button"
                onClick={() => navigate(`/educator/games/logic/${game.id}/configure`)}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                Voir le contenu côté éducateur
              </button>
            )}
            {game && game.typeJeu === 'REFLEXE' && (
              <button
                type="button"
                onClick={() => navigate(`/educator/games/reflex/${game.id}/configure`)}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                Voir le contenu côté éducateur
              </button>
            )}
          </div>
        )}

        {contentLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : game?.typeJeu === 'QUIZ' ? (
          <div className="space-y-4">
            {quizQuestions.length === 0 ? (
              <p className="text-slate-600">Aucune question de quiz n'a encore été ajoutée pour ce jeu.</p>
            ) : (
              quizQuestions.map((q, index) => (
                <div key={q.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">Question {index + 1}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                        {(q.sousType ?? 'DEFAULT').toUpperCase()}
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        {difficultyLabel(q.difficulte)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-slate-700 leading-relaxed">{q.contenu}</p>
                  {q.mediaUrl && (
                    <div className="mt-3">
                      <img src={q.mediaUrl} alt="media question" className="max-h-56 rounded-xl border border-slate-200 bg-slate-50 object-contain" />
                    </div>
                  )}
                  {q.promptAudioUrl && (
                    <div className="mt-3">
                      <audio controls src={q.promptAudioUrl} className="w-full" />
                    </div>
                  )}
                  <p className="mt-3 text-sm text-slate-700"><strong>Bonne réponse :</strong> {q.bonneReponse}</p>
                  {q.options && q.options.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {q.options.map((option) => (
                        <li key={option}>{option}</li>
                      ))}
                    </ul>
                  )}
                  {q.explication && <p className="text-sm text-slate-500 mt-2"><strong>Explication :</strong> {q.explication}</p>}
                </div>
              ))
            )}
          </div>
        ) : game?.typeJeu === 'MEMOIRE' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memoryCards.length === 0 ? (
              <p className="text-slate-600">Aucune carte mémoire n'a encore été ajoutée pour ce jeu.</p>
            ) : (
              memoryPairs.map((pair, idx) => {
                const c1 = pair.cards[0];
                const c2 = pair.cards[1];
                return (
                  <div key={pair.key} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                          🧠
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">Paire {idx + 1}</p>
                          <p className="text-xs text-gray-500 truncate">Catégorie</p>
                        </div>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                        {pair.categorie ?? '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      {[c1, c2].map((c, i) => (
                        <div
                          key={c ? c.id : `placeholder-${pair.key}-${i}`}
                          className={`w-20 h-20 rounded-xl border flex items-center justify-center ${
                            c ? 'border-slate-200 bg-gradient-to-b from-white to-slate-50' : 'border-dashed border-slate-200 bg-white'
                          }`}
                        >
                          {c ? (
                            <div className="flex flex-col items-center leading-none">
                              {c.cardType === 'IMAGE' && c.cardValue ? (
                                <img src={c.cardValue} alt="memory-card" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                              ) : c.cardType === 'COLOR' && c.cardValue ? (
                                <span className="w-8 h-8 rounded-full border-2 border-slate-300" style={{ backgroundColor: c.cardValue }} />
                              ) : c.cardType === 'TEXT' && c.cardValue ? (
                                <span className="text-xs font-semibold text-slate-700 text-center px-1 break-words max-w-[70px]">{c.cardValue}</span>
                              ) : (
                                <span className="text-3xl">{c.symbole}</span>
                              )}
                              <span className="text-[10px] text-slate-500 mt-1">Carte {i + 1}</span>
                              <span className="text-[9px] text-slate-400 mt-1">
                                {(c.cardType ?? 'EMOJI').toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : game?.typeJeu === 'LOGIQUE' ? (
          <div className="space-y-4">
            {logicPuzzles.length === 0 ? (
              <p className="text-slate-600">Aucun puzzle logique n'a encore été ajouté pour ce jeu.</p>
            ) : (
              logicPuzzles.map((puzzle, index) => (
                <div key={puzzle.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">Puzzle {index + 1}</p>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-semibold">
                      {formatLabel(puzzle.sousType ?? 'DEDUCTION')}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-700 leading-relaxed">{puzzle.enonce}</p>
                  <p className="text-xs text-slate-500 mt-2">Difficulté : {difficultyLabel(puzzle.difficulte)}</p>
                  <p className="text-sm mt-2 text-slate-700"><strong>Bonne réponse :</strong> {puzzle.bonneReponse}</p>
                  {puzzle.indice && <p className="text-sm text-slate-500 mt-1"><strong>Indice :</strong> {puzzle.indice}</p>}
                  {puzzle.donnees && (
                    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">Données du puzzle</summary>
                      <pre className="mt-2 text-xs bg-white border border-slate-200 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-words text-slate-700">
                        {puzzle.donnees}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        ) : game?.typeJeu === 'REFLEXE' ? (
          <div className="space-y-3">
            {!reflexSettings ? (
              <p className="text-slate-600">Les paramètres réflexe n'ont pas encore été configurés pour ce jeu.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Modèle</p>
                  <p className="font-semibold text-gray-900 mt-1">{formatLabel(reflexSettings.modeleReflexe)}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Type de stimuli</p>
                  <p className="font-semibold text-gray-900 mt-1">{formatLabel(reflexSettings.typeStimuli)}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Nombre de rounds</p>
                  <p className="font-semibold text-gray-900 mt-1">{reflexSettings.nombreRounds ?? '—'}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Temps réaction max</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {reflexSettings.tempsReactionMaxMs != null ? `${reflexSettings.tempsReactionMaxMs} ms` : '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">No-go ratio</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {reflexSettings.noGoRatio != null ? `${reflexSettings.noGoRatio}%` : '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Nombre de cibles</p>
                  <p className="font-semibold text-gray-900 mt-1">{reflexSettings.choiceTargetCount ?? '—'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-600">Type de jeu non géré pour le pré-aperçu de contenu.</p>
        )}
      </div>
      <RejectGameModal
        open={showRejectModal}
        gameTitle={game.titre}
        submitting={updatingStatus}
        onClose={() => setShowRejectModal(false)}
        onConfirm={submitReject}
      />
    </div>
  );
}
