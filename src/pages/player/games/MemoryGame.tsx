import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, RotateCcw } from 'lucide-react';
import userApi from '@/api/user/user.api';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import { exitFullscreenSafely } from '@/utils/fullscreen';
import type { MemoryCardDTO } from '@/api/types';
import { getMemoryPlayerHint } from '@/constants/memoryPairTypes';

interface Card {
  id: number;
  displayFallback: string;
  cardType: string;
  cardValue: string;
  pairKey: string;
  flipped: boolean;
  matched: boolean;
}

const PREVIEW_SECONDS = 3;

export default function MemoryGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const { game, mode, roomCode } = location.state || {};
  const [memoryCards, setMemoryCards] = useState<MemoryCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const playerHint = useMemo(() => getMemoryPlayerHint(memoryCards), [memoryCards]);

  const normalizeCardType = (raw?: string | null) => (raw || 'EMOJI').toUpperCase();

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(PREVIEW_SECONDS);
  const [showMatchFeedback, setShowMatchFeedback] = useState(false);
  const [recentMatchedCardIds, setRecentMatchedCardIds] = useState<number[]>([]);
  const isFinishingRef = useRef(false);

  const configuredDurationMinutes = useMemo(() => {
    const fromGameField = Number(game?.durationMinutes);
    if (Number.isFinite(fromGameField) && fromGameField > 0) return fromGameField;
    const estimated = String(game?.estimatedTime ?? '').toLowerCase();
    const match = estimated.match(/(\d+)/);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 10;
  }, [game]);
  const configuredDurationSeconds = configuredDurationMinutes * 60;

  const totalPairs = useMemo(() => {
    if (memoryCards.length < 2) return 0;
    const keys = new Set(memoryCards.map((c) => c.pairKey).filter(Boolean));
    if (keys.size > 0) return keys.size;
    return Math.floor(memoryCards.length / 2);
  }, [memoryCards]);

  const gridColsClass = useMemo(() => {
    if (cards.length <= 4) return 'grid-cols-2';
    if (cards.length <= 9) return 'grid-cols-3';
    if (cards.length <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  }, [cards.length]);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    userApi.getMemoryCardsByGame(gameId)
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setMemoryCards(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setMemoryCards([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [gameId]);

  const initializeGame = () => {
    if (memoryCards.length < 2) {
      setCards([]);
      return;
    }

    const sourceCards = memoryCards.map((c, index) => ({
      displayFallback: c.cardValue || c.symbole || '',
      cardType: normalizeCardType(c.cardType),
      cardValue: c.cardValue || c.symbole || '',
      pairKey: c.pairKey || `pair-${Math.floor(index / 2)}`,
    }));

    const shuffledCards: Card[] = sourceCards
      .sort(() => Math.random() - 0.5)
      .map((entry, index) => ({
        id: index,
        displayFallback: entry.displayFallback,
        cardType: entry.cardType,
        cardValue: entry.cardValue,
        pairKey: entry.pairKey,
        flipped: false,
        matched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setTimeLeft(configuredDurationSeconds);
    setGameStarted(false);
    setPreviewSeconds(PREVIEW_SECONDS);
    setShowMatchFeedback(false);
    setRecentMatchedCardIds([]);
    isFinishingRef.current = false;
  };

  useEffect(() => {
    if (loading) return;
    initializeGame();
  }, [gameId, memoryCards, loading]);

  // Timer
  useEffect(() => {
    if (!gameStarted || matches >= totalPairs || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeElapsed((prev) => prev + 1);
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameStarted, matches, totalPairs, timeLeft]);

  const finishGame = async (forcedTimeout = false) => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    const accuracy = moves > 0 ? Math.round((matches * 2 / moves) * 100) : 0;
    const score = Math.max(200 - moves * 2 - Math.floor(timeElapsed / 5), 50);
    await exitFullscreenSafely();
    navigate('/player/game-result', {
      state: {
        game,
        mode,
        roomCode,
        sessionData: {
          scoreFinal: score,
          accuracy: Math.min(accuracy, 100),
          durationSeconds: Math.max(1, timeElapsed),
          reussite: forcedTimeout ? false : accuracy >= 70,
          moves,
          matches,
        },
      },
    });
  };

  useEffect(() => {
    if (gameStarted && matches < totalPairs && timeLeft === 0) {
      void finishGame(true);
    }
  }, [timeLeft, gameStarted, matches, totalPairs]);

  useEffect(() => {
    if (matches === totalPairs && gameStarted) {
      const timer = setTimeout(() => {
        void finishGame(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [matches, totalPairs, gameStarted]);

  useEffect(() => {
    if (gameStarted) return;
    if (previewSeconds <= 0) return;
    const timer = setTimeout(() => setPreviewSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [previewSeconds, gameStarted]);

  const handleCardClick = (cardId: number) => {
    if (previewSeconds > 0) return;
    if (!gameStarted) setGameStarted(true);
    
    const card = cards[cardId];
    if (card.matched || card.flipped || flippedCards.length === 2) return;

    const newCards = [...cards];
    newCards[cardId].flipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstId, secondId] = newFlippedCards;
      
      if (cards[firstId].pairKey === cards[secondId].pairKey) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstId].matched = true;
          matchedCards[secondId].matched = true;
          setCards(matchedCards);
          setRecentMatchedCardIds([firstId, secondId]);
          setShowMatchFeedback(true);
          setTimeout(() => setShowMatchFeedback(false), 850);
          setTimeout(() => setRecentMatchedCardIds([]), 1000);
          setMatches(matches + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstId].flipped = false;
          resetCards[secondId].flipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-300">Chargement des cartes…</p>
      </div>
    );
  }

  if (loadError || memoryCards.length < 2) {
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
            <h1 className="text-xl font-bold">{game?.title || 'Jeu mémoire'}</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto mt-16 text-center px-6">
          <p className="text-slate-300 mb-4">
            {loadError
              ? 'Impossible de charger les cartes de ce jeu.'
              : 'Ce jeu n’a pas encore assez de cartes configurées (au moins une paire).'}
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (window.confirm('Quitter la partie ?')) {
                    navigate('/player/dashboard');
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-white">{game?.title || 'Jeu mémoire'}</h1>
                <p className="text-sm text-slate-300">Associe les paires</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-slate-100 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-medium">Recommencer</span>
              </motion.button>
              <PlayerHeaderActions />
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
              <Clock className="w-5 h-5 text-cyan-300" />
              <span className={`font-bold ${timeLeft <= 60 ? 'text-rose-300' : 'text-cyan-300'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-lg border border-white/20">
              <span className="font-bold text-fuchsia-300">Coups : {moves}</span>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-lg border border-white/20">
              <span className="font-bold text-emerald-300">
                Paires : {matches} / {totalPairs}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {Array.from({ length: totalPairs }).map((_, i) => (
                <span
                  key={`progress-dot-${i}`}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < matches ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/25'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Game Board */}
        <div className={`grid ${gridColsClass} gap-4 max-w-2xl mx-auto`}>
          {cards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={!card.matched && !card.flipped ? { scale: 1.05 } : {}}
              whileTap={!card.matched && !card.flipped ? { scale: 0.95 } : {}}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-2xl cursor-pointer relative ${
                card.matched ? 'opacity-85' : ''
              }`}
              style={{ perspective: 1000 }}
              animate={
                recentMatchedCardIds.includes(card.id)
                  ? { scale: [1, 1.08, 1], filter: ['brightness(1)', 'brightness(1.25)', 'brightness(1)'] }
                  : { scale: 1, filter: 'brightness(1)' }
              }
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <motion.div
                className="w-full h-full"
                animate={{ rotateY: card.flipped || card.matched || (!gameStarted && previewSeconds > 0) ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Card Back */}
                <div
                  className={`absolute inset-0 rounded-2xl flex items-center justify-center ${
                    card.matched
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                      : 'bg-gradient-to-br from-purple-500 to-blue-500'
                  } shadow-lg`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                  }}
                >
                  <span className="text-white text-4xl">?</span>
                </div>
                {/* Card Front */}
                <div
                  className={`absolute inset-0 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg border ${
                    card.matched ? 'border-emerald-300/80 shadow-[0_0_20px_rgba(52,211,153,0.35)]' : 'border-white/20'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {recentMatchedCardIds.includes(card.id) && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-emerald-300/90 animate-pulse" />
                  )}
                  {normalizeCardType(card.cardType) === 'IMAGE' ? (
                    <img src={card.cardValue} alt="Carte mémoire" className="w-full h-full object-cover rounded-2xl" />
                  ) : normalizeCardType(card.cardType) === 'COLOR' ? (
                    <div
                      className="w-14 h-14 rounded-full border-2 border-white shadow-inner"
                      style={{ backgroundColor: card.cardValue || '#ffffff' }}
                    />
                  ) : normalizeCardType(card.cardType) === 'TEXT' ? (
                    <span className="text-base sm:text-lg px-2 text-center text-white font-semibold break-words leading-snug">
                      {card.cardValue || card.displayFallback}
                    </span>
                  ) : (
                    <span className="text-6xl">{card.cardValue || card.displayFallback}</span>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showMatchFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="pointer-events-none absolute left-1/2 top-10 z-20 -translate-x-1/2"
            >
              <div className="rounded-2xl border border-emerald-300/60 bg-slate-900/85 backdrop-blur-md px-6 py-3 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                <p className="text-emerald-300 font-bold tracking-wide">✨ Paire validee</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        {!gameStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white/5 rounded-2xl p-6 text-center max-w-2xl mx-auto border border-white/15 backdrop-blur-xl"
          >
            <h3 className="text-xl font-bold text-white mb-2">Comment jouer</h3>
            <p className="text-slate-300">{playerHint}</p>
            {previewSeconds > 0 ? (
              <p className="text-cyan-300 font-semibold mt-2">Prévisualisation: {previewSeconds}s</p>
            ) : (
              <p className="text-emerald-300 font-semibold mt-2">Clique une carte pour commencer</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
