import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Target, Zap, Ban, Check } from 'lucide-react';
import userApi from '@/api/user/user.api';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import { exitFullscreenSafely } from '@/utils/fullscreen';
import type { ReflexSettingsDTO } from '@/api/types';

interface Reaction {
  time: number;
  success: boolean;
}

interface ChoiceTarget {
  id: string;
  leftPx: number;
  topPx: number;
  isCorrect: boolean;
}

const CHOICE_TARGET_SIZE = 64;
const CHOICE_TARGET_HALF = CHOICE_TARGET_SIZE / 2;

const STROOP_BTN_W = 128;
const STROOP_BTN_H = 48;
const STROOP_BTN_HALF_W = STROOP_BTN_W / 2;
const STROOP_BTN_HALF_H = STROOP_BTN_H / 2;
const STROOP_INSTRUCTION_W = 300;
const STROOP_WORD_W = 280;

type ActiveStroopLayout = {
  word: StroopColor;
  ink: StroopColor;
  instructionLeftPx: number;
  instructionTopPx: number;
  wordLeftPx: number;
  wordTopPx: number;
  buttons: { color: StroopColor; leftPx: number; topPx: number }[];
};

type StroopColor = { label: string; value: string };

/** Raison précise affichée après un round (évite « trop lent » pour une mauvaise action). */
type RoundFeedback =
  | 'timeout'
  | 'too_soon'
  | 'stroop_wrong_color'
  | 'stroop_wrong_area'
  | 'choice_wrong_target'
  | 'choice_wrong_area'
  | 'classic_wrong_area'
  | 'go_wrong_area'
  | 'go_trap_click';

const STROOP_COLORS: StroopColor[] = [
  { label: 'Rouge', value: '#ef4444' },
  { label: 'Vert', value: '#22c55e' },
  { label: 'Bleu', value: '#3b82f6' },
  { label: 'Jaune', value: '#eab308' },
];

export default function ReflexGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const { game, mode, roomCode } = location.state || {};

  const [gameState, setGameState] = useState<'ready' | 'waiting' | 'active' | 'toosoon' | 'missed' | 'wrong'>('ready');
  const [round, setRound] = useState(0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const activeRoundTokenRef = useRef(0);
  const resolvedRoundTokenRef = useRef<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<RoundFeedback | null>(null);
  const [settings, setSettings] = useState<ReflexSettingsDTO | null>(null);
  const [activeIsTrap, setActiveIsTrap] = useState(false);
  /** Position figée en pixels pour Classique / Go-No-Go (aucune animation de déplacement). */
  const [activeSingleTarget, setActiveSingleTarget] = useState<{
    leftPx: number;
    topPx: number;
    variant: 'icon' | 'color';
  } | null>(null);
  const [choiceTargets, setChoiceTargets] = useState<ChoiceTarget[]>([]);
  const [activeStroopLayout, setActiveStroopLayout] = useState<ActiveStroopLayout | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const sessionStartMsRef = useRef<number>(Date.now());

  const totalRounds = settings?.nombreRounds ?? 10;
  const maxReactionMs = settings?.tempsReactionMaxMs ?? 2000;
  const gameplayDifficulty = Math.max(0, Math.min(10, settings?.difficulte ?? 5));
  const reflexModel = (settings?.modeleReflexe ?? 'CLASSIC').toUpperCase();
  const isGameComplete = round >= totalRounds;

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    userApi.getReflexSettingsByGame(gameId)
      .then((res) => {
        if (!cancelled) setSettings(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });
    return () => { cancelled = true; };
  }, [gameId]);

  useEffect(() => {
    sessionStartMsRef.current = Date.now();
  }, [gameId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isGameComplete && reactions.length === totalRounds && !isFinishing) {
      setIsFinishing(true);
      const successfulReactions = reactions.filter((r) => r.success);
      const avgReactionTime = successfulReactions.length > 0
        ? Math.round(successfulReactions.reduce((sum, r) => sum + r.time, 0) / successfulReactions.length)
        : 0;
      const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartMsRef.current) / 1000));
      
      const score = Math.max(250 - avgReactionTime * 0.5, 50);
      const accuracy = Math.round((successfulReactions.length / totalRounds) * 100);

      setTimeout(async () => {
        await exitFullscreenSafely();
        navigate('/player/game-result', {
          state: {
            game,
            mode,
            roomCode,
            sessionData: {
              scoreFinal: Math.round(score),
              accuracy,
              reactionTime: avgReactionTime,
              durationSeconds,
              reussite: accuracy >= 70,
              totalRounds,
              successfulRounds: successfulReactions.length,
            },
          },
        });
      }, 2000);
    }
  }, [isGameComplete, reactions, totalRounds, isFinishing, game, mode, navigate]);

  const finalizeRound = (success: boolean, time: number, state: 'ready' | 'missed' | 'toosoon' | 'wrong' = 'ready') => {
    setReactions((prev) => [...prev, { time, success }]);
    setRound((prev) => prev + 1);
    setGameState(state);
    setTimeout(() => {
      setRound((currentRound) => {
        if (currentRound < totalRounds) {
          setGameState('ready');
        }
        return currentRound;
      });
    }, state === 'ready' ? 500 : 1000);
  };

  const getReactionTimeMs = () => Math.max(0, Date.now() - startTime);

  const finalizeRoundSafe = (
    success: boolean,
    time: number,
    state: 'ready' | 'missed' | 'toosoon' | 'wrong' = 'ready',
    feedback?: RoundFeedback
  ) => {
    const token = activeRoundTokenRef.current;
    if (resolvedRoundTokenRef.current === token) return;
    resolvedRoundTokenRef.current = token;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (state === 'ready') {
      setRoundFeedback(null);
    } else if (feedback) {
      setRoundFeedback(feedback);
    } else if (state === 'missed') {
      setRoundFeedback('timeout');
    } else if (state === 'toosoon') {
      setRoundFeedback('too_soon');
    }
    setActiveSingleTarget(null);
    setChoiceTargets([]);
    setActiveStroopLayout(null);
    finalizeRound(success, time, state);
  };

  const pickSingleTargetPlacement = () => {
    const el = playAreaRef.current;
    const areaW = el?.clientWidth ?? 800;
    const areaH = el?.clientHeight ?? 500;
    const half = 48;
    const pad = 16;
    const xPct = Math.random() * 70 + 15;
    const yPct = Math.random() * 70 + 15;
    let leftPx = (xPct / 100) * areaW;
    let topPx = (yPct / 100) * areaH;
    leftPx = Math.max(half + pad, Math.min(areaW - half - pad, leftPx));
    topPx = Math.max(half + pad, Math.min(areaH - half - pad, topPx));
    return { leftPx, topPx };
  };

  const pickChoiceTargetPlacements = (count: number) => {
    const el = playAreaRef.current;
    const areaW = el?.clientWidth ?? 800;
    const areaH = el?.clientHeight ?? 500;
    const pad = 16;
    const minDist = CHOICE_TARGET_SIZE + 12;
    const placements: { leftPx: number; topPx: number }[] = [];

    const clamp = (leftPx: number, topPx: number) => ({
      leftPx: Math.max(CHOICE_TARGET_HALF + pad, Math.min(areaW - CHOICE_TARGET_HALF - pad, leftPx)),
      topPx: Math.max(CHOICE_TARGET_HALF + pad, Math.min(areaH - CHOICE_TARGET_HALF - pad, topPx)),
    });

    for (let i = 0; i < count; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 60 && !placed; attempt++) {
        const xPct = Math.random() * 70 + 15;
        const yPct = Math.random() * 70 + 15;
        const { leftPx, topPx } = clamp((xPct / 100) * areaW, (yPct / 100) * areaH);
        const overlaps = placements.some((p) => Math.hypot(p.leftPx - leftPx, p.topPx - topPx) < minDist);
        if (!overlaps) {
          placements.push({ leftPx, topPx });
          placed = true;
        }
      }
      if (!placed) {
        const cols = Math.ceil(Math.sqrt(count));
        const row = Math.floor(i / cols);
        const col = i % cols;
        const spanX = areaW - 2 * (CHOICE_TARGET_HALF + pad);
        const spanY = areaH - 2 * (CHOICE_TARGET_HALF + pad);
        const leftPx = CHOICE_TARGET_HALF + pad + (cols > 1 ? (spanX * col) / (cols - 1) : spanX / 2);
        const rows = Math.ceil(count / cols);
        const topPx = CHOICE_TARGET_HALF + pad + (rows > 1 ? (spanY * row) / (rows - 1) : spanY / 2);
        placements.push(clamp(leftPx, topPx));
      }
    }
    return placements;
  };

  const pickStroopLayout = (): ActiveStroopLayout => {
    const el = playAreaRef.current;
    const areaW = el?.clientWidth ?? 800;
    const areaH = el?.clientHeight ?? 500;

    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    if (colorIdx === wordIdx) colorIdx = (colorIdx + 1) % STROOP_COLORS.length;
    const word = STROOP_COLORS[wordIdx];
    const ink = STROOP_COLORS[colorIdx];

    const instructionLeftPx = areaW / 2;
    const instructionTopPx = areaH * 0.18;
    const wordLeftPx = areaW / 2;
    const wordTopPx = areaH * 0.38;

    const gapX = 20;
    const gapY = 16;
    const gridW = STROOP_BTN_W * 2 + gapX;
    const gridOriginLeft = (areaW - gridW) / 2 + STROOP_BTN_HALF_W;
    const gridOriginTop = areaH * 0.58 + STROOP_BTN_HALF_H;

    const buttons = STROOP_COLORS.map((color, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      return {
        color,
        leftPx: gridOriginLeft + col * (STROOP_BTN_W + gapX),
        topPx: gridOriginTop + row * (STROOP_BTN_H + gapY),
      };
    });

    return { word, ink, instructionLeftPx, instructionTopPx, wordLeftPx, wordTopPx, buttons };
  };

  const pickTargetVariant = (): 'icon' | 'color' => {
    if (settings?.typeStimuli === 'COLOR_FLASH') return 'color';
    if (settings?.typeStimuli === 'MIXED') return Math.random() > 0.5 ? 'icon' : 'color';
    return 'icon';
  };

  const startRound = () => {
    if (isGameComplete || isFinishing) return;
    if (round === 0 && reactions.length === 0) {
      sessionStartMsRef.current = Date.now();
    }
    setGameState('waiting');
    setRoundFeedback(null);
    setActiveSingleTarget(null);
    setChoiceTargets([]);
    setActiveStroopLayout(null);

    const minDelay = Math.max(400, 1200 - gameplayDifficulty * 70);
    const maxDelay = Math.max(minDelay + 200, 3200 - gameplayDifficulty * 140);
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    timeoutRef.current = setTimeout(() => {
      let isTrapRound = false;
      const variant = pickTargetVariant();
      if (reflexModel === 'GO_NO_GO') {
        const ratio = Math.max(10, Math.min(90, settings?.noGoRatio ?? 30));
        isTrapRound = Math.random() * 100 < ratio;
        setActiveIsTrap(isTrapRound);
      } else {
        setActiveIsTrap(false);
      }
      if (reflexModel !== 'CHOICE_REACTION' && reflexModel !== 'STROOP_INVERSE') {
        const { leftPx, topPx } = pickSingleTargetPlacement();
        setActiveSingleTarget({ leftPx, topPx, variant });
      } else {
        setActiveSingleTarget(null);
      }
      if (reflexModel === 'CHOICE_REACTION') {
        const count = Math.max(2, Math.min(6, settings?.choiceTargetCount ?? 3));
        const correctIndex = Math.floor(Math.random() * count);
        const placements = pickChoiceTargetPlacements(count);
        const nextTargets: ChoiceTarget[] = placements.map((p, i) => ({
          id: `choice-${Date.now()}-${i}`,
          leftPx: p.leftPx,
          topPx: p.topPx,
          isCorrect: i === correctIndex,
        }));
        setChoiceTargets(nextTargets);
      } else {
        setChoiceTargets([]);
      }
      if (reflexModel === 'STROOP_INVERSE') {
        setActiveStroopLayout(pickStroopLayout());
      } else {
        setActiveStroopLayout(null);
      }
      const roundToken = activeRoundTokenRef.current + 1;
      activeRoundTokenRef.current = roundToken;
      resolvedRoundTokenRef.current = null;
      setStartTime(Date.now());
      setGameState('active');
      
      // Auto-miss after configured reaction window
      timeoutRef.current = setTimeout(() => {
        if (activeRoundTokenRef.current !== roundToken) return;
        if (resolvedRoundTokenRef.current === roundToken) return;
        // In GO_NO_GO, not clicking a trap is a success.
        if (reflexModel === 'GO_NO_GO' && isTrapRound) {
          finalizeRoundSafe(true, maxReactionMs, 'ready');
          return;
        }
        finalizeRoundSafe(false, maxReactionMs, 'missed', 'timeout');
      }, maxReactionMs);
    }, delay);
  };

  const handleClick = () => {
    if (isGameComplete || isFinishing) return;
    if (gameState === 'ready') {
      startRound();
    } else if (gameState === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      finalizeRoundSafe(false, 0, 'toosoon', 'too_soon');
    } else if (gameState === 'active') {
      const reactionTime = getReactionTimeMs();
      if (reactionTime > maxReactionMs) {
        finalizeRoundSafe(false, maxReactionMs, 'missed', 'timeout');
        return;
      }
      if (reflexModel === 'GO_NO_GO' && activeIsTrap) {
        // Clic sur le fond = n'a pas cliqué STOP → succès
        finalizeRoundSafe(true, Math.min(reactionTime, maxReactionMs), 'ready');
        return;
      }
      if (reflexModel === 'STROOP_INVERSE') {
        finalizeRoundSafe(false, reactionTime, 'wrong', 'stroop_wrong_area');
        return;
      }
      if (reflexModel === 'CHOICE_REACTION') {
        finalizeRoundSafe(false, reactionTime, 'wrong', 'choice_wrong_area');
        return;
      }
      if (reflexModel === 'GO_NO_GO') {
        finalizeRoundSafe(false, reactionTime, 'wrong', 'go_wrong_area');
        return;
      }
      finalizeRoundSafe(false, reactionTime, 'wrong', 'classic_wrong_area');
    }
  };

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGameComplete || isFinishing) return;
    if (gameState !== 'active') return;

    const reactionTime = getReactionTimeMs();
    if (reactionTime > maxReactionMs) {
      finalizeRoundSafe(false, maxReactionMs, 'missed', 'timeout');
      return;
    }

    if (reflexModel === 'GO_NO_GO' && activeIsTrap) {
      finalizeRoundSafe(false, reactionTime, 'wrong', 'go_trap_click');
      return;
    }

    if (reflexModel === 'CLASSIC' || reflexModel === 'GO_NO_GO') {
      finalizeRoundSafe(true, Math.min(reactionTime, maxReactionMs), 'ready');
    }
  };

  const handleChoiceTargetClick = (e: React.MouseEvent, target: ChoiceTarget) => {
    e.stopPropagation();
    if (isGameComplete || isFinishing) return;
    if (gameState !== 'active') return;
    const reactionTime = getReactionTimeMs();
    if (reactionTime > maxReactionMs) {
      finalizeRoundSafe(false, maxReactionMs, 'missed', 'timeout');
      return;
    }
    finalizeRoundSafe(
      target.isCorrect,
      reactionTime,
      target.isCorrect ? 'ready' : 'wrong',
      target.isCorrect ? undefined : 'choice_wrong_target'
    );
  };

  const handleStroopColorClick = (e: React.MouseEvent, color: StroopColor) => {
    e.stopPropagation();
    if (isGameComplete || isFinishing) return;
    if (gameState !== 'active') return;
    const reactionTime = getReactionTimeMs();
    if (reactionTime > maxReactionMs) {
      finalizeRoundSafe(false, maxReactionMs, 'missed', 'timeout');
      return;
    }
    const isCorrectPick = !!activeStroopLayout?.ink && color.value === activeStroopLayout.ink.value;
    finalizeRoundSafe(
      isCorrectPick,
      reactionTime,
      isCorrectPick ? 'ready' : 'wrong',
      isCorrectPick ? undefined : 'stroop_wrong_color'
    );
  };

  const avgReactionTime = reactions.filter((r) => r.success).length > 0
    ? Math.round(reactions.filter((r) => r.success).reduce((sum, r) => sum + r.time, 0) / reactions.filter((r) => r.success).length)
    : 0;

  const getFeedbackMessage = (): { text: string; color: string; bg: string } => {
    switch (roundFeedback) {
      case 'too_soon':
        return { text: 'Trop tôt ! Attends l’apparition de la cible.', color: 'text-red-600', bg: 'bg-red-50' };
      case 'stroop_wrong_color':
        return {
          text: "Mauvaise couleur ! Clique la couleur de l'encre, pas le mot.",
          color: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'stroop_wrong_area':
        return {
          text: 'Clique sur un bouton de couleur en bas.',
          color: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'choice_wrong_target':
        return {
          text: 'Mauvaise cible ! Choisis celle avec la coche dorée.',
          color: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'choice_wrong_area':
        return {
          text: 'Clique sur une des cibles affichées.',
          color: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'go_trap_click':
        return {
          text: 'Ne clique pas sur STOP ! Il fallait rester immobile.',
          color: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'go_wrong_area':
        return {
          text: 'Clique sur la cible verte, pas le fond.',
          color: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'classic_wrong_area':
        return {
          text: 'Clique sur la cible, pas le fond.',
          color: 'text-red-700',
          bg: 'bg-red-50',
        };
      case 'timeout':
        if (reflexModel === 'STROOP_INVERSE') {
          return { text: 'Temps écoulé ! Clique plus vite la bonne couleur.', color: 'text-orange-600', bg: 'bg-orange-50' };
        }
        if (reflexModel === 'CHOICE_REACTION') {
          return { text: 'Temps écoulé ! Clique la bonne cible plus vite.', color: 'text-orange-600', bg: 'bg-orange-50' };
        }
        if (reflexModel === 'GO_NO_GO') {
          return { text: 'Temps écoulé ! Clique la cible verte plus vite.', color: 'text-orange-600', bg: 'bg-orange-50' };
        }
        return { text: 'Temps écoulé ! Clique la cible plus vite.', color: 'text-orange-600', bg: 'bg-orange-50' };
      default:
        return { text: 'Incorrect.', color: 'text-red-600', bg: 'bg-red-50' };
    }
  };

  const getStateMessage = () => {
    switch (gameState) {
      case 'ready':
        return { text: 'Clique pour commencer', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'waiting':
        return { text: 'Attends la cible…', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'active':
        if (reflexModel === 'GO_NO_GO') {
          if (activeIsTrap) {
            return {
              text: 'No-Go : ne cliquez pas (cible rouge STOP)',
              color: 'text-red-700',
              bg: 'bg-red-100',
            };
          }
          return {
            text: 'Go : cliquez la cible verte',
            color: 'text-emerald-800',
            bg: 'bg-emerald-100',
          };
        }
        if (reflexModel === 'CHOICE_REACTION') {
          return {
            text: 'Cliquez la cible avec le contour doré et la coche',
            color: 'text-green-800',
            bg: 'bg-green-50',
          };
        }
        if (reflexModel === 'STROOP_INVERSE') {
          return { text: 'Clique la COULEUR (pas le mot)', color: 'text-green-600', bg: 'bg-green-50' };
        }
        return { text: 'Cliquez la cible maintenant !', color: 'text-green-600', bg: 'bg-green-50' };
      case 'toosoon':
      case 'wrong':
      case 'missed':
        return getFeedbackMessage();
      default:
        return { text: '', color: '', bg: '' };
    }
  };

  const stateMessage = getStateMessage();

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
                  if (window.confirm('Are you sure you want to quit?')) {
                    navigate('/player/dashboard');
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-white">{game?.title || 'Reflex Game'}</h1>
                <p className="text-sm text-slate-300">Test your reaction speed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                <span className="font-bold text-fuchsia-300">
                  Round: {round} / {totalRounds}
                </span>
              </div>
              {avgReactionTime > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                  <Zap className="w-5 h-5 text-cyan-300" />
                  <span className="font-bold text-cyan-300">{avgReactionTime}ms</span>
                </div>
              )}
              <PlayerHeaderActions />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Area — bordure fixe (box-border) pour éviter tout décalage de la cible */}
        <motion.div
          ref={playAreaRef}
          onClick={handleClick}
          className={`relative h-[500px] rounded-2xl shadow-2xl cursor-pointer overflow-hidden box-border border-4 ${
            gameState === 'waiting'
              ? 'bg-yellow-100 border-yellow-300'
              : gameState === 'active'
                ? reflexModel === 'GO_NO_GO' && activeIsTrap
                  ? 'bg-red-100 border-red-400'
                  : reflexModel === 'GO_NO_GO' && !activeIsTrap
                    ? 'bg-emerald-50 border-emerald-400'
                    : 'bg-green-100 border-green-300'
              : gameState === 'toosoon'
              ? 'bg-red-100 border-red-300'
              : gameState === 'wrong'
              ? 'bg-red-100 border-red-300'
              : gameState === 'missed'
              ? 'bg-orange-100 border-orange-300'
              : 'bg-white border-white/20'
          }`}
        >
          {/* Center Message */}
          {gameState !== 'active' && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className={`${stateMessage.bg} px-8 py-4 rounded-2xl mb-4`}>
                <p className={`text-2xl font-bold ${stateMessage.color}`}>
                  {stateMessage.text}
                </p>
              </div>
              {gameState === 'ready' && round < totalRounds && (
                <div className="text-slate-200 text-center">
                  <p className="mb-2">Click anywhere to start round {round + 1}</p>
                  <p className="text-sm">Wait for the target, then click it as fast as you can!</p>
                </div>
              )}
            </motion.div>
          )}

          {gameState === 'active' && activeSingleTarget && reflexModel !== 'CHOICE_REACTION' && reflexModel !== 'STROOP_INVERSE' && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleTargetClick}
                className="absolute z-20 cursor-pointer"
                style={{
                  left: activeSingleTarget.leftPx,
                  top: activeSingleTarget.topPx,
                  width: 96,
                  height: 96,
                  marginLeft: -48,
                  marginTop: -48,
                }}
              >
                <div
                  className={`w-24 h-24 flex flex-col items-center justify-center gap-0.5 shadow-2xl border-4 ${
                    reflexModel === 'GO_NO_GO' && activeIsTrap
                      ? 'bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl border-red-300 ring-4 ring-red-500/60'
                      : reflexModel === 'GO_NO_GO' && !activeIsTrap
                        ? activeSingleTarget.variant === 'color'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl border-emerald-200 ring-2 ring-emerald-400/80'
                          : 'bg-gradient-to-br from-emerald-500 to-green-600 rounded-full border-emerald-200 ring-2 ring-emerald-400/80'
                        : activeSingleTarget.variant === 'color'
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl border-white'
                          : 'bg-gradient-to-br from-red-500 to-pink-500 rounded-full border-white'
                  }`}
                >
                  {reflexModel === 'GO_NO_GO' && activeIsTrap ? (
                    <>
                      <Ban className="w-11 h-11 text-white drop-shadow" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">STOP</span>
                    </>
                  ) : reflexModel === 'GO_NO_GO' && !activeIsTrap ? (
                    activeSingleTarget.variant === 'color' ? (
                      <span className="text-white font-bold text-xl">GO</span>
                    ) : (
                      <Target className="w-12 h-12 text-white" />
                    )
                  ) : activeSingleTarget.variant === 'color' ? (
                    <span className="text-white font-bold text-xl">GO</span>
                  ) : (
                    <Target className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
          )}

          {gameState === 'active' && reflexModel === 'CHOICE_REACTION' && choiceTargets.map((target) => (
            <div
              key={target.id}
              role="button"
              tabIndex={0}
              onClick={(e) => handleChoiceTargetClick(e, target)}
              className="absolute z-20 cursor-pointer"
              style={{
                left: target.leftPx,
                top: target.topPx,
                width: CHOICE_TARGET_SIZE,
                height: CHOICE_TARGET_SIZE,
                marginLeft: -CHOICE_TARGET_HALF,
                marginTop: -CHOICE_TARGET_HALF,
              }}
            >
              <div
                className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${
                  target.isCorrect
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-4 border-amber-300 ring-4 ring-amber-200/90'
                    : 'bg-gradient-to-br from-slate-500 to-slate-700 border-2 border-dashed border-slate-400 opacity-75'
                }`}
              >
                {target.isCorrect ? (
                  <>
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-950 shadow">
                      Ici
                    </span>
                    <Check className="w-8 h-8 text-white drop-shadow-md" strokeWidth={3} />
                  </>
                ) : (
                  <Target className="w-7 h-7 text-white/90" />
                )}
              </div>
            </div>
          ))}

          {gameState === 'active' && reflexModel === 'STROOP_INVERSE' && activeStroopLayout && (
            <div className="absolute inset-0 z-20">
              <p
                className="absolute text-sm font-semibold text-slate-700 text-center pointer-events-none"
                style={{
                  left: activeStroopLayout.instructionLeftPx,
                  top: activeStroopLayout.instructionTopPx,
                  width: STROOP_INSTRUCTION_W,
                  marginLeft: -STROOP_INSTRUCTION_W / 2,
                }}
              >
                Clique la couleur de l&apos;encre
              </p>
              <p
                className="absolute text-6xl font-extrabold text-center whitespace-nowrap pointer-events-none select-none"
                style={{
                  left: activeStroopLayout.wordLeftPx,
                  top: activeStroopLayout.wordTopPx,
                  width: STROOP_WORD_W,
                  marginLeft: -STROOP_WORD_W / 2,
                  color: activeStroopLayout.ink.value,
                }}
              >
                {activeStroopLayout.word.label}
              </p>
              {activeStroopLayout.buttons.map((btn) => (
                <button
                  key={btn.color.label}
                  type="button"
                  onClick={(e) => handleStroopColorClick(e, btn.color)}
                  className="absolute rounded-xl border-2 border-white shadow text-white font-semibold text-sm"
                  style={{
                    left: btn.leftPx,
                    top: btn.topPx,
                    width: STROOP_BTN_W,
                    height: STROOP_BTN_H,
                    marginLeft: -STROOP_BTN_HALF_W,
                    marginTop: -STROOP_BTN_HALF_H,
                    backgroundColor: btn.color.value,
                  }}
                >
                  {btn.color.label}
                </button>
              ))}
            </div>
          )}

        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
        >
          <h3 className="text-lg font-bold text-white mb-4">Your Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/15 rounded-xl border border-green-400/30">
              <p className="text-sm text-slate-300 mb-1">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {reactions.filter((r) => r.success).length}
              </p>
            </div>
            <div className="text-center p-4 bg-red-500/15 rounded-xl border border-red-400/30">
              <p className="text-sm text-slate-300 mb-1">Missed</p>
              <p className="text-2xl font-bold text-red-600">
                {reactions.filter((r) => !r.success).length}
              </p>
            </div>
            <div className="text-center p-4 bg-cyan-500/15 rounded-xl border border-cyan-400/30">
              <p className="text-sm text-slate-300 mb-1">Avg Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {avgReactionTime || '—'}
                {avgReactionTime > 0 && <span className="text-sm">ms</span>}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-slate-300 mb-1">Best Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {reactions.filter((r) => r.success).length > 0
                  ? Math.min(...reactions.filter((r) => r.success).map((r) => r.time))
                  : '—'}
                {reactions.filter((r) => r.success).length > 0 && <span className="text-sm">ms</span>}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
