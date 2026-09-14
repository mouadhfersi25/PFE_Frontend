import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Lightbulb, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import userApi from '@/api/user/user.api';
import { forfeitRoom } from '@/services/roomService';
import { useRoomBeaconOnUnload } from '@/hooks/useRoomBeaconOnUnload';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import FullscreenToggleButton from '@/components/player/FullscreenToggleButton';
import { exitFullscreenSafely } from '@/utils/fullscreen';
import type { LogicPuzzleDTO } from '@/api/types';
import {
  colorMatchLinksAreCorrect,
  logicAnswersMatch,
  normalizeLogicSubtype,
  parseColorWordPairs,
  serializeColorMatchLinks,
  type ColorWordPair,
  type LogicSubtype,
} from '@/constants/logicPuzzleTypes';
import { ColorMatchPlayerBoard } from '@/components/logic/ColorMatchPlayerBoard';
import InGameAdOverlay from '@/components/player/InGameAdOverlay';
import { useInGameAd } from '@/hooks/useInGameAd';

interface Puzzle {
  id: number;
  question: string;
  type: LogicSubtype;
  pattern: Array<string | number>;
  options: string[];
  colorPairs: ColorWordPair[];
  answer: string;
  hint: string;
}

const POINTS_BASE = 25;
const POINTS_WITH_HINT = 15;

function mapDtoToPuzzle(r: LogicPuzzleDTO): Puzzle {
  let data: { type?: string; sequence?: Array<string | number>; options?: string[]; colorPairs?: ColorWordPair[] } = {};
  try {
    data = r.donnees ? JSON.parse(r.donnees) : {};
  } catch {
    data = {};
  }
  const type = normalizeLogicSubtype(r.sousType || data.type);
  const colorPairs = type === 'COLOR_MATCH' ? parseColorWordPairs(data, r.bonneReponse) : [];
  return {
    id: r.id,
    question: r.enonce,
    type,
    pattern: Array.isArray(data.sequence) ? data.sequence : [],
    options: Array.isArray(data.options) ? data.options.map(String) : [],
    colorPairs,
    answer: type === 'COLOR_MATCH' ? serializeColorMatchLinks(colorPairs) : String(r.bonneReponse ?? ''),
    hint: r.indice ?? '',
  };
}

function shuffleOptions<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function LogicGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const { game, mode, roomCode } = location.state || {};
  useRoomBeaconOnUnload(mode === 'Online', roomCode, 'forfeit');

  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [textAnswer, setTextAnswer] = useState('');
  const [colorLinks, setColorLinks] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const puzzle = puzzles[currentPuzzle];
  const totalPuzzles = puzzles.length;
  const isLastPuzzle = currentPuzzle === totalPuzzles - 1;
  const [gameOver, setGameOver] = useState(false);
  const isFinishingRef = useRef(false);
  const pendingResultRef = useRef<{ sessionData: Record<string, unknown> } | null>(null);
  const { ad, visible: adVisible, ready: adReady, dismiss: dismissAd, openCta } = useInGameAd(
    gameId,
    gameOver
  );

  const colorMatchComplete =
    puzzle?.type === 'COLOR_MATCH' &&
    puzzle.colorPairs.length > 0 &&
    Object.keys(colorLinks).filter((k) => colorLinks[k]?.trim()).length === puzzle.colorPairs.length;

  const canSubmit =
    puzzle?.type === 'COLOR_MATCH' ? colorMatchComplete : Boolean(textAnswer.trim());

  const shuffledOptions = useMemo(() => {
    if (!puzzle) return [];
    if (puzzle.type === 'INTRUS' || puzzle.type === 'DEDUCTION') {
      return shuffleOptions(puzzle.options);
    }
    return puzzle.options;
  }, [puzzle?.id, puzzle?.type, puzzle?.options]);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    userApi
      .getLogicPuzzlesByGame(gameId)
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setPuzzles(rows.map(mapDtoToPuzzle));
        setCurrentPuzzle(0);
        setTextAnswer('');
        setColorLinks({});
        setShowFeedback(false);
        setShowHint(false);
        setScore(0);
        setCorrectCount(0);
        setHintsUsed(0);
        setAttempts(0);
        setTimeElapsed(0);
        isFinishingRef.current = false;
        pendingResultRef.current = null;
        setGameOver(false);
      })
      .catch(() => {
        if (!cancelled) {
          setPuzzles([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    if (loading || puzzles.length === 0 || adVisible || gameOver) return;
    const timer = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [loading, puzzles.length, adVisible, gameOver]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setTextAnswer('');
    setColorLinks({});
    setShowFeedback(false);
    setShowHint(false);
    setIsCorrect(false);
  }, [currentPuzzle, puzzle?.id]);

  const handleSubmit = () => {
    if (!puzzle || !canSubmit) return;

    setAttempts((prev) => prev + 1);
    const correct =
      puzzle.type === 'COLOR_MATCH'
        ? colorMatchLinksAreCorrect(colorLinks, puzzle.colorPairs)
        : logicAnswersMatch(textAnswer, puzzle.answer);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      const points = showHint ? POINTS_WITH_HINT : POINTS_BASE;
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setTextAnswer('');
    setColorLinks({});
    setIsCorrect(false);
  };

  const handleNext = () => {
    if (isLastPuzzle) {
      if (isFinishingRef.current) return;
      isFinishingRef.current = true;
      const accuracy =
        totalPuzzles > 0 ? Math.min(100, Math.round((correctCount / totalPuzzles) * 100)) : 0;
      pendingResultRef.current = {
        sessionData: {
          scoreFinal: score,
          accuracy,
          durationSeconds: Math.max(1, timeElapsed),
          reussite: accuracy >= 60,
          attempts,
          hintsUsed,
          correctAnswers: correctCount,
        },
      };
      setGameOver(true);
    } else {
      setCurrentPuzzle((prev) => prev + 1);
      setTextAnswer('');
      setColorLinks({});
      setShowFeedback(false);
      setShowHint(false);
      setIsCorrect(false);
    }
  };

  // La pub sponsor (si dispo) s'affiche juste à la fin du dernier puzzle ; la navigation réelle
  // n'a lieu qu'une fois la pub vue/fermée (cf. `adReady`).
  useEffect(() => {
    if (!gameOver || !adReady || !pendingResultRef.current) return;
    const pending = pendingResultRef.current;
    pendingResultRef.current = null;
    void (async () => {
      await exitFullscreenSafely();
      navigate('/player/game-result', {
        state: { game, mode, roomCode, sessionData: pending.sessionData },
      });
    })();
  }, [gameOver, adReady, game, mode, roomCode, navigate]);

  const handleShowHint = () => {
    if (showHint) return;
    setShowHint(true);
    setHintsUsed((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-300">Chargement des puzzles…</p>
      </div>
    );
  }

  if (loadError || puzzles.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/player/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">{game?.title || 'Jeu logique'}</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto mt-16 text-center px-6">
          <p className="text-slate-300 mb-4">
            {loadError
              ? 'Impossible de charger les puzzles de ce jeu.'
              : 'Ce jeu n’a pas encore de puzzles configurés.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/player/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {ad && adVisible ? (
        <InGameAdOverlay ad={ad} onContinue={dismissAd} onCtaClick={openCta} />
      ) : null}
      <header className="shrink-0 bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (window.confirm('Quitter la partie ?')) {
                    if (mode === 'Online' && roomCode) void forfeitRoom(roomCode);
                    navigate('/player/dashboard');
                  }
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight">{game?.title || 'Jeu logique'}</h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Puzzle {currentPuzzle + 1} sur {totalPuzzles}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/20">
                <Clock className="w-4 h-4 text-cyan-300" />
                <span className="font-bold text-sm text-cyan-300">{formatTime(timeElapsed)}</span>
              </div>
              <div className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/20">
                <span className="font-bold text-sm text-fuchsia-300">Score : {score}</span>
              </div>
              <FullscreenToggleButton />
              <PlayerHeaderActions />
            </div>
          </div>

          <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((currentPuzzle + 1) / totalPuzzles) * 100}%` }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="max-w-4xl w-full">
        <motion.div
          key={puzzle.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/15 backdrop-blur-xl"
        >

          <div className="mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">{puzzle.question}</h2>

            {puzzle.type === 'SUITE_LOGIQUE' && (
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 flex-wrap">
                {puzzle.pattern.map((num, index) => (
                  <motion.div
                    key={`${num}-${index}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.06 }}
                    className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg"
                  >
                    {num}
                  </motion.div>
                ))}
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/10 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center text-slate-200 font-bold text-base sm:text-lg">
                  ?
                </div>
              </div>
            )}

            {(puzzle.type === 'INTRUS' || puzzle.type === 'DEDUCTION') && shuffledOptions.length > 0 && (
              <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {shuffledOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => !showFeedback && setTextAnswer(opt)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left text-sm sm:text-base transition-colors ${
                      textAnswer === opt
                        ? 'border-fuchsia-400 bg-fuchsia-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-slate-100 hover:border-white/40'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {puzzle.type === 'COLOR_MATCH' && puzzle.colorPairs.length > 0 && (
              <ColorMatchPlayerBoard
                pairs={puzzle.colorPairs}
                disabled={showFeedback}
                links={colorLinks}
                onChangeLinks={setColorLinks}
              />
            )}
          </div>

          {!showFeedback && !showHint && puzzle.hint && (
            <div className="mb-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShowHint}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 text-amber-200 rounded-lg hover:bg-amber-500/25 transition-colors border border-amber-400/40 text-sm"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">Voir l’indice (−10 points)</span>
              </motion.button>
            </div>
          )}

          {showHint && !showFeedback && puzzle.hint && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-amber-500/15 border border-amber-400/40 rounded-xl"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <p className="text-amber-100 text-sm">{puzzle.hint}</p>
              </div>
            </motion.div>
          )}

          {!showFeedback && puzzle.type !== 'COLOR_MATCH' && (puzzle.type === 'SUITE_LOGIQUE' || shuffledOptions.length === 0) && (
            <div className="mb-3">
              <label htmlFor="logic-textAnswer" className="block text-sm font-medium text-slate-300 mb-1.5">Ta réponse</label>
              <input
                id="logic-textAnswer"
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textAnswer) handleSubmit();
                }}
                className="w-full px-6 py-3 rounded-xl border-2 border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 text-lg font-bold text-center"
                placeholder={puzzle.type === 'SUITE_LOGIQUE' ? 'Élément manquant…' : 'Ta réponse…'}
              />
            </div>
          )}

          {!showFeedback && (puzzle.type === 'INTRUS' || puzzle.type === 'DEDUCTION') && shuffledOptions.length > 0 && !textAnswer && (
            <p className="mb-3 text-sm text-slate-400 text-center">Clique sur une proposition ci-dessus.</p>
          )}

          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl mb-3 border-2 ${
                isCorrect ? 'bg-emerald-950/50 border-emerald-400/50' : 'bg-rose-950/40 border-rose-400/50'
              }`}
            >
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`font-bold mb-1 text-sm sm:text-base ${isCorrect ? 'text-emerald-200' : 'text-rose-200'}`}>
                    {isCorrect ? 'Bravo !' : 'Pas tout à fait…'}
                  </h3>
                  <p className="text-slate-200 text-sm">
                    {isCorrect
                      ? puzzle.type === 'COLOR_MATCH'
                        ? 'Toutes les liaisons couleur → mot sont correctes !'
                        : <>Bonne réponse : <strong>{puzzle.answer}</strong></>
                      : puzzle.type === 'COLOR_MATCH'
                        ? 'Certaines flèches ne correspondent pas. Réessaie.'
                        : <>La bonne réponse était : <strong>{puzzle.answer}</strong></>}
                  </p>
                  {isCorrect && (
                    <p className="mt-1 font-semibold text-emerald-300 text-sm">
                      +{showHint ? POINTS_WITH_HINT : POINTS_BASE} points
                    </p>
                  )}
                  {!isCorrect && puzzle.hint && (
                    <p className="mt-1 text-xs text-slate-400">{puzzle.hint}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
      </div>
      </div>

      <div className="shrink-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-2.5">
          {!showFeedback ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 py-3 rounded-xl font-bold text-base sm:text-lg transition-all ${
                !canSubmit
                  ? 'bg-white/15 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
              }`}
            >
              Valider
            </motion.button>
          ) : (
            <>
              {!isCorrect && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white py-3 rounded-xl font-bold text-base sm:text-lg hover:bg-white/15"
                >
                  <RotateCcw className="w-5 h-5" />
                  Réessayer
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={gameOver}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold text-base sm:text-lg hover:shadow-lg disabled:opacity-60"
              >
                {isLastPuzzle ? 'Terminer' : 'Puzzle suivant'}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
