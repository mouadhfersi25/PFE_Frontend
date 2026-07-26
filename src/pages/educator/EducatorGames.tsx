import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, HelpCircle, Layers } from 'lucide-react';
import { useNavigate } from 'react-router';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, EtatJeu } from '@/api/types/api.types';

type DisplayGame = {
  id: number;
  type: 'quiz' | 'memory';
  title: string;
  description: string;
  difficulty: string;
  ageRange: string;
  icon: string;
  etat: EtatJeu;
};

function mapGameDTO(dto: GameDTO): DisplayGame | null {
  const type = dto.typeJeu === 'QUIZ' ? 'quiz' : dto.typeJeu === 'MEMOIRE' ? 'memory' : null;
  if (!type) return null;
  const difficulty =
    dto.difficulte === 1 ? 'Easy' : dto.difficulte === 2 ? 'Medium' : dto.difficulte === 3 ? 'Hard' : 'Medium';
  const ageRange =
    dto.ageMin != null && dto.ageMax != null ? `${dto.ageMin}-${dto.ageMax}` : dto.ageMin != null ? `${dto.ageMin}+` : '—';
  return {
    id: dto.id,
    type,
    title: dto.titre,
    description: dto.description ?? '',
    difficulty,
    ageRange,
    icon: dto.icone ?? '🎮',
    etat: dto.etat,
  };
}

export default function EducatorGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState<DisplayGame[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [pairCounts, setPairCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    educatorApi
      .getGames()
      .then((res) => {
        if (cancelled) return;
        const list = (res.data ?? [])
          .map(mapGameDTO)
          .filter((g): g is DisplayGame => g !== null);
        setGames(list);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? err?.message ?? 'Impossible de charger les jeux.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const quizGames = games.filter((g) => g.type === 'quiz');
    if (quizGames.length === 0) return;
    let cancelled = false;
    const counts: Record<number, number> = {};
    Promise.all(
      quizGames.map((g) =>
        educatorApi.getQuestions(g.id).then((r) => {
          if (!cancelled) counts[g.id] = (r.data ?? []).length;
        })
      )
    ).then(() => {
      if (!cancelled) setQuestionCounts((prev) => ({ ...prev, ...counts }));
    });
    return () => {
      cancelled = true;
    };
  }, [games]);

  useEffect(() => {
    const memoryGamesList = games.filter((g) => g.type === 'memory');
    if (memoryGamesList.length === 0) return;
    let cancelled = false;
    const counts: Record<number, number> = {};
    Promise.all(
      memoryGamesList.map((g) =>
        educatorApi.getMemoryCards(g.id).then((r) => {
          if (cancelled) return;
          const cards = r.data ?? [];
          const keys = new Set(cards.map((c) => c.pairKey).filter(Boolean));
          counts[g.id] = keys.size;
        })
      )
    ).then(() => {
      if (!cancelled) setPairCounts((prev) => ({ ...prev, ...counts }));
    });
    return () => {
      cancelled = true;
    };
  }, [games]);

  const quizGames = games.filter((g) => g.type === 'quiz');
  const memoryGames = games.filter((g) => g.type === 'memory');
  const hasAny = quizGames.length > 0 || memoryGames.length > 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />

      <div className="flex-1 overflow-auto pt-16">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Games</h1>
            <p className="text-gray-600">Games created by the admin. Configure Quiz (questions) or Memory (pairs) content here.</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-600">
              <p>Chargement des jeux…</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-8 border border-red-100 text-center text-red-600">
              <p>{error}</p>
            </div>
          ) : !hasAny ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-600">
              <p>No quiz or memory games yet. The admin must add a game first.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {quizGames.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz games</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizGames.map((game, index) => {
                      const questionCount = questionCounts[game.id] ?? 0;
                      return (
                        <motion.div
                          key={game.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-xl flex items-center justify-center text-2xl">
                              {game.icon}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                              <HelpCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">{questionCount} questions</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{game.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{game.description}</p>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Difficulty:</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  game.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : game.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {game.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Age:</span>
                              <span className="font-medium text-gray-900">{game.ageRange}</span>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-gray-200">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate(`/educator/games/quiz/${game.id}/questions`)}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:shadow-md transition-shadow ${
                                game.etat === 'BROUILLON'
                                  ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              <Gamepad2 className="w-4 h-4" />
                              {game.etat === 'BROUILLON' ? 'Gérer les questions' : 'Voir les questions (lecture seule)'}
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              {memoryGames.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Memory games</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memoryGames.map((game, index) => {
                      const pairCount = pairCounts[game.id] ?? 0;
                      return (
                        <motion.div
                          key={game.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-2xl">
                              {game.icon}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
                              <Layers className="w-4 h-4" />
                              <span className="text-sm font-medium">{pairCount} pairs</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{game.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{game.description}</p>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Difficulty:</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  game.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : game.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {game.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Age:</span>
                              <span className="font-medium text-gray-900">{game.ageRange}</span>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-gray-200">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate(`/educator/games/memory/${game.id}/configure`)}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:shadow-md transition-shadow ${
                                game.etat === 'BROUILLON'
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              <Layers className="w-4 h-4" />
                              {game.etat === 'BROUILLON' ? 'Configurer les paires' : 'Voir les paires (lecture seule)'}
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
