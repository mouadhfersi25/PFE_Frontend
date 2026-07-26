import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, FileText, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, MemoryCardDTO, QuizQuestionDTO } from '@/api/types';

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

const TYPE_ICONS: Record<string, string> = {
  QUIZ: '🧮',
  MEMOIRE: '🧠',
  REFLEXE: '⚡',
  LOGIQUE: '🎯',
};

const getContentPath = (game: Pick<GameDTO, 'id' | 'typeJeu'>): string | null => {
  if (game.typeJeu === 'QUIZ') return `/educator/games/quiz/${game.id}/questions`;
  if (game.typeJeu === 'MEMOIRE') return `/educator/games/memory/${game.id}/configure`;
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
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
          <button onClick={() => navigate('/educator/games/manage')} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg">
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const contentPath = getContentPath(game);

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

          <div className="h-28 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-end p-6 mb-6 shadow-lg">
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

                    {contentPath && (
                      <button
                        type="button"
                        onClick={() => navigate(contentPath)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100"
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
