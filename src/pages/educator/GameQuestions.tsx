import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Edit, Trash2, Eye, WandSparkles, Loader2, CheckSquare, Square } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, QuizQuestionDTO } from '@/api/types/api.types';

function difficultyLabel(d: number | null): string {
  return d === 1 ? 'Easy' : d === 2 ? 'Medium' : d === 3 ? 'Hard' : 'Medium';
}

export default function GameQuestions() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const id = gameId != null ? Number(gameId) : NaN;
  const [game, setGame] = useState<GameDTO | null>(null);
  const [questionsForGame, setQuestionsForGame] = useState<QuizQuestionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [aiPreview, setAiPreview] = useState<QuizQuestionDTO[]>([]);
  const [selectedPreviewIndexes, setSelectedPreviewIndexes] = useState<number[]>([]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      setError('Invalid game id');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      educatorApi.getGameById(id),
      educatorApi.getQuestions(id),
    ])
      .then(([gameRes, questionsRes]) => {
        if (cancelled) return;
        const g = gameRes.data;
        if (!g || g.typeJeu !== 'QUIZ') {
          setError('Game not found or not a quiz game.');
          setGame(null);
          setQuestionsForGame([]);
        } else {
          setGame(g);
          setQuestionsForGame(Array.isArray(questionsRes.data) ? questionsRes.data : []);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load game or questions.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    educatorApi
      .deleteQuestion(questionId)
      .then(() => {
        setQuestionsForGame((prev) => prev.filter((q) => q.id !== questionId));
        toast.success('Question deleted');
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message ?? 'Failed to delete question.');
      });
  };

  const togglePreviewSelection = (index: number) => {
    setSelectedPreviewIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleGeneratePreview = () => {
    if (!game) return;
    setAiLoading(true);
    educatorApi
      .generateQuizPreview({ gameId: game.id, count: aiCount })
      .then((res) => {
        const preview = Array.isArray(res.data) ? res.data : [];
        setAiPreview(preview);
        setSelectedPreviewIndexes(preview.map((_, i) => i));
        toast.success(`${preview.length} question(s) générée(s)`);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message ?? 'Échec génération IA');
      })
      .finally(() => setAiLoading(false));
  };

  const handleSaveSelectedPreview = async () => {
    if (!game) return;
    const selected = aiPreview.filter((_, i) => selectedPreviewIndexes.includes(i));
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins une question');
      return;
    }
    setSavingSelection(true);
    try {
      const created = await Promise.all(
        selected.map((q) =>
          educatorApi.createQuestion({
            jeuId: game.id,
            contenu: q.contenu,
            bonneReponse: q.bonneReponse,
            options: q.options ?? undefined,
            explication: q.explication ?? undefined,
            difficulte: q.difficulte ?? game.difficulte ?? undefined,
          })
        )
      );
      const newQuestions = created.map((r) => r.data).filter(Boolean);
      setQuestionsForGame((prev) => [...newQuestions, ...prev]);
      setAiPreview([]);
      setSelectedPreviewIndexes([]);
      setAiPanelOpen(false);
      toast.success(`${newQuestions.length} question(s) ajoutée(s) au quiz`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Échec sauvegarde des questions générées');
    } finally {
      setSavingSelection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Chargement…</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Game not found.'}</p>
          <button onClick={() => navigate('/educator/games/manage')} className="ml-4 text-green-600 hover:underline">Back to Games</button>
        </div>
      </div>
    );
  }

  const canEdit = game.etat === 'BROUILLON' || game.etat === 'REFUSE';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />

      <div className="flex-1 overflow-auto pt-16">
        <div className="p-6 md:p-8">
          <div className="mb-5">
            <button
              onClick={() => navigate('/educator/games/manage')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 mb-5 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </button>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900">{canEdit ? 'Gérer les questions' : 'Questions (lecture seule)'}</h1>
              <p className="text-gray-600 mt-1">
                <span className="font-medium text-gray-800">{game.titre}</span>
                {canEdit ? ' — ajoutez, modifiez ou supprimez des questions.' : ' — ce jeu est finalisé : vous ne pouvez plus modifier le contenu.'}
              </p>
            </div>
          </div>

          {!canEdit && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              Ce jeu est en attente ou déjà accepté. La modification des questions est désactivée.
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{questionsForGame.length}</span> question{questionsForGame.length !== 1 ? 's' : ''} pour ce jeu
            </p>
            {canEdit && (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAiPanelOpen((o) => !o)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 font-medium"
                >
                  <WandSparkles className="w-5 h-5" />
                  Générer avec IA
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/educator/questions/add', { state: { gameId: game.id } })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add question
                </motion.button>
              </div>
            )}
          </div>

          {canEdit && aiPanelOpen && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-emerald-900">Assistant IA - Génération de questions</h3>
                  <p className="text-sm text-emerald-800/90">
                    Génération précise selon le titre, la description, la difficulté, l'âge et la durée du quiz.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Nombre</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aiCount}
                    onChange={(e) => setAiCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-20 px-3 py-2 rounded-lg border border-emerald-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />}
                    Générer
                  </button>
                </div>
              </div>

              {aiPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{aiPreview.length}</span> question(s) générée(s)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewIndexes(aiPreview.map((_, i) => i))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Tout sélectionner
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewIndexes([])}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm"
                      >
                        <Square className="w-4 h-4" />
                        Tout désélectionner
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                    {aiPreview.map((q, idx) => {
                      const selected = selectedPreviewIndexes.includes(idx);
                      return (
                        <button
                          key={`${q.contenu}-${idx}`}
                          type="button"
                          onClick={() => togglePreviewSelection(idx)}
                          className={`w-full text-left rounded-xl border p-3 transition-colors ${
                            selected ? 'border-emerald-300 bg-white' : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              {selected ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{q.contenu}</p>
                              {q.options && q.options.length > 0 && (
                                <p className="text-xs text-slate-600 mt-1">Options: {q.options.join(' | ')}</p>
                              )}
                              <p className="text-xs text-emerald-700 mt-1">Bonne réponse: {q.bonneReponse}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSaveSelectedPreview}
                      disabled={savingSelection}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {savingSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Ajouter la sélection au quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {questionsForGame.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-12 border border-gray-100 text-center"
            >
              <p className="text-gray-600 mb-6">
                {canEdit
                  ? 'Aucune question pour ce jeu. Ajoutez la première pour configurer le quiz.'
                  : 'Aucune question enregistrée.'}
              </p>
              {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/educator/questions/add', { state: { gameId: game.id } })}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add question
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs uppercase tracking-wide font-semibold text-gray-600">Question</th>
                      <th className="text-left py-4 px-6 text-xs uppercase tracking-wide font-semibold text-gray-600">Difficulty</th>
                      <th className="text-left py-4 px-6 text-xs uppercase tracking-wide font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionsForGame.map((question) => {
                      const diff = difficultyLabel(question.difficulte);
                      return (
                      <tr
                        key={question.id}
                        className="border-t border-gray-100 hover:bg-gray-50/70 cursor-pointer transition-colors"
                        onClick={() => navigate(`/educator/questions/${question.id}/view`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/educator/questions/${question.id}/view`);
                          }
                        }}
                      >
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{question.contenu}</p>
                          <p className="text-xs text-gray-500 mt-1">{question.options?.length ?? 0} options</p>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              diff === 'Easy' ? 'bg-green-100 text-green-800' : diff === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {diff}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {canEdit ? (
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/educator/questions/${question.id}/edit`);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(question.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/educator/questions/${question.id}/view`);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Voir les détails"
                              aria-label="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
