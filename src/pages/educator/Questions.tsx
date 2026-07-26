import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Edit, Trash2, Loader2, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import educatorApi from '@/api/educator/educator.api';
import type { QuizQuestionDTO, GameDTO } from '@/api/types/api.types';

const DIFFICULTE_LABEL: Record<number, string> = {
  1: 'Facile',
  2: 'Moyen',
  3: 'Difficile',
};

export default function Questions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [questions, setQuestions] = useState<QuizQuestionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);
  const [detailQuestion, setDetailQuestion] = useState<QuizQuestionDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (viewDetailId == null) {
      setDetailQuestion(null);
      return;
    }
    setLoadingDetail(true);
    educatorApi
      .getQuestionById(viewDetailId)
      .then((res) => {
        setDetailQuestion(res.data as QuizQuestionDTO);
      })
      .catch(() => {
        toast.error('Impossible de charger le détail.');
        setViewDetailId(null);
      })
      .finally(() => setLoadingDetail(false));
  }, [viewDetailId]);

  const loadQuestions = () => {
    setLoading(true);
    educatorApi
      .getGames()
      .then((res) => {
        const games = (Array.isArray(res.data) ? res.data : []) as GameDTO[];
        const quizGames = games.filter((g) => g.typeJeu === 'QUIZ');
        if (quizGames.length === 0) {
          setQuestions([]);
          setLoading(false);
          return;
        }
        return Promise.all(
          quizGames.map((game) =>
            educatorApi.getQuestions(game.id).then((r) => ({
              list: (Array.isArray(r.data) ? r.data : []) as QuizQuestionDTO[],
            }))
          )
        ).then((results) => {
          const merged = results.flatMap((r) => r.list);
          setQuestions(merged);
        });
      })
      .catch(() => {
        toast.error('Impossible de charger les questions.');
        setQuestions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      (q.contenu?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
      (q.jeuTitre?.toLowerCase() ?? '').includes(searchQuery.toLowerCase());
    const diffStr = q.difficulte != null ? String(q.difficulte) : '';
    const matchesDifficulty =
      filterDifficulty === 'all' || diffStr === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const openDetail = (questionId: number) => setViewDetailId(questionId);
  const closeDetail = () => { setViewDetailId(null); setDetailQuestion(null); };

  const handleDelete = (questionId: number) => {
    if (!confirm('Supprimer cette question ?')) return;
    setDeletingId(questionId);
    educatorApi
      .deleteQuestion(questionId)
      .then(() => {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        toast.success('Question supprimée.');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression.');
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Question Bank</h1>
              <p className="text-gray-600">
                Toutes les questions de quiz, chargées depuis le backend. Créez une question pour la voir apparaître ici.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/educator/questions/add')}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
            >
              <Plus className="w-5 h-5" />
              Ajouter une question
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher (question ou jeu)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                >
                  <option value="all">Toutes difficultés</option>
                  <option value="1">Facile</option>
                  <option value="2">Moyen</option>
                  <option value="3">Difficile</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Question</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Jeu</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Difficulté</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Options</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.map((question) => (
                        <motion.tr
                          key={question.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => openDetail(question.id)}
                          className="border-t border-gray-100 hover:bg-green-50/50 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-900">{question.contenu}</p>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{question.jeuTitre}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                question.difficulte === 1
                                  ? 'bg-green-100 text-green-800'
                                  : question.difficulte === 2
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {question.difficulte != null
                                ? DIFFICULTE_LABEL[question.difficulte] ?? question.difficulte
                                : '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">
                            {question.options?.length ?? 0} options
                          </td>
                          <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openDetail(question.id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Voir le détail"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/educator/questions/${question.id}/edit`)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(question.id)}
                                disabled={deletingId === question.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Supprimer"
                              >
                                {deletingId === question.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredQuestions.length === 0 && !loading && (
                  <div className="py-12 text-center text-gray-500">
                    <p>Aucune question trouvée. Ajoutez une question pour qu’elle s’affiche ici.</p>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Modal détail question */}
          {viewDetailId != null && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={closeDetail}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Détail de la question</h2>
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                  {loadingDetail ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                    </div>
                  ) : detailQuestion ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Énoncé</p>
                        <p className="text-gray-900">{detailQuestion.contenu}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Jeu</p>
                        <p className="text-gray-700">{detailQuestion.jeuTitre}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Options de réponse</p>
                        <ul className="space-y-2">
                          {(detailQuestion.options ?? []).map((opt, i) => (
                            <li
                              key={i}
                              className={`px-3 py-2 rounded-lg border ${
                                opt === detailQuestion.bonneReponse
                                  ? 'bg-green-50 border-green-200 text-green-800 font-medium'
                                  : 'bg-gray-50 border-gray-100 text-gray-700'
                              }`}
                            >
                              {opt === detailQuestion.bonneReponse && (
                                <span className="text-green-600 text-xs mr-2">✓ Bonne réponse</span>
                              )}
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {detailQuestion.explication && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Explication</p>
                          <p className="text-gray-700">{detailQuestion.explication}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Difficulté</p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            detailQuestion.difficulte === 1
                              ? 'bg-green-100 text-green-800'
                              : detailQuestion.difficulte === 2
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {detailQuestion.difficulte != null
                            ? DIFFICULTE_LABEL[detailQuestion.difficulte] ?? detailQuestion.difficulte
                            : '—'}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { if (viewDetailId != null) navigate(`/educator/questions/${viewDetailId}/edit`); closeDetail(); }}
                    className="px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg font-medium transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
