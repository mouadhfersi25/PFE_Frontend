import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Lightbulb, Zap, ThumbsUp, ThumbsDown, PenLine, Sparkles, Image as ImageIcon, Languages, Palette, Volume2, Play, Pause } from 'lucide-react';
import userApi from '@/api/user/user.api';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import { exitFullscreenSafely } from '@/utils/fullscreen';
import type { QuizQuestionDTO, GameDTO } from '@/api/types';
import { normalizeQuizVariant } from '@/constants/quizVariants';
import {
  PlayerQuizVariantBanner,
  PlayerQuizVariantChip,
  PlayerQuizVariantHint,
} from '@/components/player/PlayerQuizVariant';

const BLITZ_DURATION_SECONDS = 60;
const BLITZ_FEEDBACK_MS = 650;

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Détecte CLOZE / Vrai-Faux même si sousType absent ou DEFAULT en base. */
function resolveQuizSousType(q: QuizQuestionDTO): string {
  const declared = (q.sousType ?? '').trim().toUpperCase();
  if (declared && declared !== 'DEFAULT') {
    return declared;
  }
  const contenu = (q.contenu ?? '').trim();
  if (contenu.includes('___')) {
    return 'CLOZE';
  }
  const opts = (q.options ?? [])
    .map((o) => (o ?? '').trim().toLowerCase())
    .filter(Boolean);
  if (opts.length === 2 && opts.includes('vrai') && opts.includes('faux')) {
    return 'TRUE_FALSE';
  }
  return 'DEFAULT';
}

const COLOR_NAME_MAP: Record<string, string> = {
  rouge: '#ef4444',
  red: '#ef4444',
  vert: '#22c55e',
  green: '#22c55e',
  bleu: '#3b82f6',
  blue: '#3b82f6',
  jaune: '#eab308',
  yellow: '#eab308',
  orange: '#f97316',
  violet: '#8b5cf6',
  purple: '#8b5cf6',
  noir: '#111827',
  black: '#111827',
  blanc: '#f8fafc',
  white: '#f8fafc',
  rose: '#f472b6',
  pink: '#f472b6',
  marron: '#92400e',
  brown: '#92400e',
  gris: '#6b7280',
  gray: '#6b7280',
  grey: '#6b7280',
};

function getColorValue(option: string): string | null {
  const normalized = option.trim().toLowerCase();
  if (COLOR_NAME_MAP[normalized]) return COLOR_NAME_MAP[normalized];
  if (/^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(option.trim())) return option.trim();
  return null;
}

function parseSynonymAntonym(contenu: string): { mode: 'synonym' | 'antonym' | 'unknown'; word: string } {
  const text = contenu.trim();
  const synMatch = text.match(/synonyme\s*(?:de\s*)?[:：]?\s*(.+)/i);
  if (synMatch) return { mode: 'synonym', word: synMatch[1].trim() };
  const antMatch = text.match(/antonyme\s*(?:de\s*)?[:：]?\s*(.+)/i);
  if (antMatch) return { mode: 'antonym', word: antMatch[1].trim() };
  return { mode: 'unknown', word: text };
}

function parseColorPrompt(contenu: string): string {
  return contenu.replace(/^traduis\s*[:：]?\s*/i, '').trim();
}

function QuizMediaImage({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src.trim() || failed) {
    return (
      <div
        className={
          fallbackClassName ??
          'flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-400/40 bg-indigo-500/10 px-4 text-center text-indigo-200'
        }
      >
        <ImageIcon className="h-8 w-8 opacity-60" />
        <p className="text-sm font-medium">Image introuvable ou URL invalide</p>
        {src.trim() && (
          <p className="text-xs text-indigo-300/70 break-all max-w-full">{src}</p>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

const COLOR_FR_TO_EN_SPEECH: Record<string, string> = {
  rouge: 'red',
  bleu: 'blue',
  vert: 'green',
  jaune: 'yellow',
  orange: 'orange',
  violet: 'purple',
  noir: 'black',
  blanc: 'white',
  rose: 'pink',
  marron: 'brown',
  gris: 'gray',
};

function getAudioColorSpeechText(correctOption: string, promptAudioUrl: string): string {
  const fromAnswer = COLOR_FR_TO_EN_SPEECH[correctOption.trim().toLowerCase()];
  if (fromAnswer) return fromAnswer;
  const url = promptAudioUrl.toLowerCase();
  for (const [fr, en] of Object.entries(COLOR_FR_TO_EN_SPEECH)) {
    if (url.includes(en) || url.includes(fr)) return en;
  }
  return correctOption.trim() || 'red';
}

function QuizAudioPlayer({
  src,
  speechText,
}: {
  src: string;
  speechText: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [useSpeech, setUseSpeech] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speechReady] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  );

  useEffect(() => {
    setUseSpeech(false);
    setPlaying(false);
  }, [src, speechText]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakFallback = useCallback(() => {
    if (!speechReady) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [speechReady, speechText]);

  const handlePlay = useCallback(async () => {
    if (playing) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }

    if (useSpeech || !src.trim()) {
      speakFallback();
      return;
    }

    const el = audioRef.current;
    if (!el) {
      setUseSpeech(true);
      speakFallback();
      return;
    }

    try {
      el.currentTime = 0;
      await el.play();
      setPlaying(true);
    } catch {
      setUseSpeech(true);
      speakFallback();
    }
  }, [playing, speakFallback, src, useSpeech]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3">
      {src.trim() && (
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          className="sr-only"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setUseSpeech(true)}
          onLoadedMetadata={(event) => {
            const el = event.currentTarget;
            if (!Number.isFinite(el.duration) || el.duration <= 0) {
              setUseSpeech(true);
            }
          }}
        />
      )}
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => void handlePlay()}
        className={`flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan-400/40 bg-cyan-500/15 text-cyan-100 shadow-lg ${
          playing ? 'ring-4 ring-cyan-400/30' : ''
        }`}
        aria-label={playing ? 'Pause' : 'Écouter'}
      >
        {playing ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
      </motion.button>
      <p className="text-sm font-semibold text-cyan-100">
        {playing ? 'Lecture en cours…' : 'Appuie pour écouter'}
      </p>
      {useSpeech && (
        <p className="text-xs text-cyan-200/70 text-center">
          Synthèse vocale utilisée (fichier audio indisponible)
        </p>
      )}
      {!speechReady && useSpeech && (
        <p className="text-xs text-red-300 text-center">Audio non supporté sur ce navigateur</p>
      )}
    </div>
  );
}

export default function QuizGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const { game, mode, roomCode } = location.state || {};
  const [quizRows, setQuizRows] = useState<QuizQuestionDTO[]>([]);
  const [fetchedGame, setFetchedGame] = useState<GameDTO | null>(null);

  const resolvedGame = useMemo(() => {
    const g = game as { title?: string; quizVariant?: string; quizPlayMode?: string } | undefined;
    return {
      title: g?.title ?? fetchedGame?.titre ?? 'Quiz',
      quizVariant: g?.quizVariant ?? fetchedGame?.quizVariant ?? 'DEFAULT',
      quizPlayMode: g?.quizPlayMode ?? fetchedGame?.quizPlayMode ?? 'CLASSIC',
    };
  }, [game, fetchedGame]);

  const isBlitzMode = resolvedGame.quizPlayMode === 'BLITZ_60S';

  const activeVariant = useMemo(() => {
    const fromGame = normalizeQuizVariant(resolvedGame.quizVariant);
    if (fromGame !== 'DEFAULT') return fromGame;
    if (quizRows.length > 0) {
      const fromQuestion = (quizRows[0].sousType ?? '').trim().toUpperCase();
      if (fromQuestion && fromQuestion !== 'DEFAULT') return normalizeQuizVariant(fromQuestion);
      return normalizeQuizVariant(resolveQuizSousType(quizRows[0]));
    }
    return 'DEFAULT' as const;
  }, [resolvedGame.quizVariant, quizRows]);

  const questions = useMemo(() => {
    const byGame = quizRows.map((q) => {
      const sousType = activeVariant !== 'DEFAULT' ? activeVariant : resolveQuizSousType(q);
      const rawOptions =
        sousType === 'TRUE_FALSE'
          ? ['Vrai', 'Faux']
          : Array.isArray(q.options) && q.options.length > 0
            ? q.options
            : [q.bonneReponse];
      const options =
        ['CLOZE', 'IMAGE_WORD', 'SYNONYM_ANTONYM', 'COLOR_TRANSLATION', 'AUDIO_COLOR'].includes(sousType)
          ? shuffleArray(rawOptions.filter(Boolean))
          : rawOptions;
      let correctAnswer = options.findIndex(
        (opt) => opt?.trim().toLowerCase() === (q.bonneReponse ?? '').trim().toLowerCase()
      );
      if (correctAnswer < 0) {
        options.push(q.bonneReponse);
        correctAnswer = options.length - 1;
      }
      return {
        id: q.id,
        question: q.contenu,
        options,
        correctAnswer,
        sousType,
        mediaUrl: q.mediaUrl || '',
        promptAudioUrl: q.promptAudioUrl || '',
        explanation: q.explication || '',
        points: 10,
      };
    });
    return isBlitzMode ? shuffleArray(byGame) : byGame;
  }, [quizRows, isBlitzMode, activeVariant]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [blitzFeedback, setBlitzFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BLITZ_DURATION_SECONDS);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(() => new Array(questions.length).fill(false));
  const sessionStartMsRef = useRef<number>(Date.now());
  const isFinishingRef = useRef(false);
  const blitzAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const configuredDurationSeconds = isBlitzMode
    ? BLITZ_DURATION_SECONDS
    : configuredDurationMinutes * 60;

  const totalQuestions = questions.length;
  const questionIndex = isBlitzMode
    ? (totalQuestions > 0 ? currentQuestion % totalQuestions : 0)
    : currentQuestion;
  const question = questions[questionIndex];
  const isLastQuestion = !isBlitzMode && currentQuestion === totalQuestions - 1;

  useEffect(() => {
    if (!gameId) return;
    const navGame = game as { quizVariant?: string } | undefined;
    if (navGame?.quizVariant) return;

    let cancelled = false;
    userApi
      .getAvailableGames()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const found = list.find((g) => String(g.id) === String(gameId));
        if (found) setFetchedGame(found);
      })
      .catch(() => {
        /* optional enrichment */
      });

    return () => {
      cancelled = true;
    };
  }, [gameId, game]);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    userApi.getQuizQuestionsByGame(gameId)
      .then((res) => {
        if (cancelled) return;
        setQuizRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setQuizRows([]);
      });
    return () => { cancelled = true; };
  }, [gameId]);

  useEffect(() => {
    setAnsweredQuestions(new Array(questions.length).fill(false));
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setBlitzFeedback(null);
    setScore(0);
    setCorrectAnswersCount(0);
    setQuestionsAnsweredCount(0);
    setTimeLeft(configuredDurationSeconds);
    sessionStartMsRef.current = Date.now();
    isFinishingRef.current = false;
  }, [gameId, questions.length, configuredDurationSeconds]);

  useEffect(() => {
    return () => {
      if (blitzAdvanceTimerRef.current) clearTimeout(blitzAdvanceTimerRef.current);
    };
  }, []);

  const handleFinishGame = useCallback(async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    const answeredTotal = isBlitzMode ? questionsAnsweredCount : totalQuestions;
    const correctTotal = correctAnswersCount;
    const accuracy = answeredTotal > 0 ? (correctTotal / answeredTotal) * 100 : 0;
    const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartMsRef.current) / 1000));
    await exitFullscreenSafely();
    navigate('/player/game-result', {
      state: {
        game,
        mode,
        roomCode,
        sessionData: {
          scoreFinal: score,
          accuracy: Math.round(accuracy),
          durationSeconds,
          reussite: isBlitzMode ? correctTotal >= 5 : score >= 80,
          totalQuestions: answeredTotal,
          correctAnswers: correctTotal,
        },
      },
    });
  }, [
    correctAnswersCount,
    game,
    isBlitzMode,
    mode,
    navigate,
    questionsAnsweredCount,
    roomCode,
    score,
    totalQuestions,
  ]);

  useEffect(() => {
    if (timeLeft <= 0) {
      void handleFinishGame();
      return;
    }
    const timerPaused = !isBlitzMode && showExplanation;
    if (timerPaused) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showExplanation, isBlitzMode, handleFinishGame]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processAnswer = useCallback((answerIndex: number) => {
    if (!question) return;

    const isCorrectAnswer = answerIndex === question.correctAnswer;

    if (isBlitzMode) {
      if (blitzFeedback !== null) return;
      setSelectedAnswer(answerIndex);
      setBlitzFeedback(isCorrectAnswer ? 'correct' : 'incorrect');
      setQuestionsAnsweredCount((prev) => prev + 1);
      if (isCorrectAnswer) {
        setScore((prev) => prev + question.points);
        setCorrectAnswersCount((prev) => prev + 1);
      }
      blitzAdvanceTimerRef.current = setTimeout(() => {
        setBlitzFeedback(null);
        setSelectedAnswer(null);
        setCurrentQuestion((prev) => prev + 1);
      }, BLITZ_FEEDBACK_MS);
      return;
    }

    setSelectedAnswer(answerIndex);
  }, [blitzFeedback, isBlitzMode, question]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation || blitzFeedback !== null) return;
    if (isBlitzMode) {
      processAnswer(answerIndex);
      return;
    }
    setSelectedAnswer(answerIndex);
  };

  const handleVerifyAnswer = () => {
    if (selectedAnswer === null || !question) return;

    setShowExplanation(true);

    const newAnsweredQuestions = [...answeredQuestions];
    newAnsweredQuestions[currentQuestion] = true;
    setAnsweredQuestions(newAnsweredQuestions);

    if (selectedAnswer === question.correctAnswer) {
      setScore((prev) => prev + question.points);
      setCorrectAnswersCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      void handleFinishGame();
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const timePercentage = configuredDurationSeconds > 0 ? (timeLeft / configuredDurationSeconds) * 100 : 0;
  const progressPercentage = isBlitzMode
    ? Math.min(100, (questionsAnsweredCount / Math.max(questionsAnsweredCount + 1, 5)) * 100)
    : totalQuestions > 0
      ? ((currentQuestion + 1) / totalQuestions) * 100
      : 0;

  const isCorrect = question ? selectedAnswer === question.correctAnswer : false;
  const isTrueFalseQuestion = activeVariant === 'TRUE_FALSE';
  const isClozeQuestion = activeVariant === 'CLOZE';
  const isImageWordQuestion = activeVariant === 'IMAGE_WORD';
  const isSynonymAntonymQuestion = activeVariant === 'SYNONYM_ANTONYM';
  const isColorTranslationQuestion = activeVariant === 'COLOR_TRANSLATION';
  const isAudioColorQuestion = activeVariant === 'AUDIO_COLOR';
  const isSpecialSubtypeQuestion = activeVariant !== 'DEFAULT';

  const answerLocked = showExplanation || blitzFeedback !== null;

  const getClozeBlankState = (): 'empty' | 'filled' | 'correct' | 'incorrect' => {
    if (showExplanation || blitzFeedback !== null) {
      return isCorrect ? 'correct' : 'incorrect';
    }
    return selectedAnswer !== null ? 'filled' : 'empty';
  };

  const getClozeBlankWord = (): string => {
    if (!question || selectedAnswer === null) return '';
    return question.options[selectedAnswer] ?? '';
  };

  const renderTrueFalseSection = () => {
    if (!question) return null;
    const locked = showExplanation || blitzFeedback !== null;

    return (
      <div className="mb-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-950/80 via-slate-900/90 to-blue-950/80 p-6 sm:p-8 shadow-lg shadow-sky-900/20">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Affirmation
            </div>
            <blockquote className="text-xl sm:text-2xl font-semibold leading-relaxed text-white">
              « {question.question} »
            </blockquote>
            <p className="mt-4 text-sm font-medium text-sky-200/80">
              Cette affirmation est-elle correcte ?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            const showCorrect = locked && isCorrectAnswer;
            const showIncorrect = locked && isSelected && !isCorrectAnswer;
            const isVrai = option === 'Vrai';

            return (
              <motion.button
                key={option}
                type="button"
                whileHover={!locked ? { scale: 1.02, y: -2 } : {}}
                whileTap={!locked ? { scale: 0.98 } : {}}
                onClick={() => handleAnswerSelect(index)}
                disabled={locked}
                className={`group relative min-h-[140px] overflow-hidden rounded-2xl border-2 p-6 text-left transition-all ${
                  showCorrect
                    ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/20'
                    : showIncorrect
                      ? 'border-red-400 bg-red-500/20 shadow-lg shadow-red-500/20'
                      : isSelected
                        ? isVrai
                          ? 'border-green-400 bg-green-500/15 ring-2 ring-green-400/50'
                          : 'border-red-400 bg-red-500/15 ring-2 ring-red-400/50'
                        : isVrai
                          ? 'border-green-500/35 bg-white/5 hover:border-green-400/60 hover:bg-green-500/10'
                          : 'border-red-500/35 bg-white/5 hover:border-red-400/60 hover:bg-red-500/10'
                } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      showCorrect
                        ? 'bg-green-500 text-white'
                        : showIncorrect
                          ? 'bg-red-500 text-white'
                          : isSelected
                            ? isVrai
                              ? 'bg-green-500/30 text-green-200'
                              : 'bg-red-500/30 text-red-200'
                            : isVrai
                              ? 'bg-green-500/15 text-green-300 group-hover:bg-green-500/25'
                              : 'bg-red-500/15 text-red-300 group-hover:bg-red-500/25'
                    }`}
                  >
                    {isVrai ? <ThumbsUp className="h-7 w-7" /> : <ThumbsDown className="h-7 w-7" />}
                  </div>
                  <span className={`text-2xl font-black ${isVrai ? 'text-green-100' : 'text-red-100'}`}>
                    {option}
                  </span>
                  {showCorrect && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-green-200">
                      <CheckCircle className="h-4 w-4" /> Bonne réponse
                    </span>
                  )}
                  {showIncorrect && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-red-200">
                      <XCircle className="h-4 w-4" /> Incorrect
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderClozeSection = () => {
    if (!question) return null;
    const locked = showExplanation || blitzFeedback !== null;
    const blankState = getClozeBlankState();
    const blankWord = getClozeBlankWord();
    const parts = question.question.split('___');

    return (
      <div className="mb-6 space-y-6">
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/50 via-slate-900/80 to-teal-950/50 p-6 sm:p-8 shadow-lg shadow-emerald-900/15">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/90">Complète la phrase</p>
              <p className="text-sm text-slate-400">Choisis un mot — il apparaîtra dans le trou</p>
            </div>
          </div>

          <p className="text-xl sm:text-2xl font-medium leading-[2.2] text-slate-100">
            {parts.map((part, index) => (
              <span key={index}>
                {part}
                {index < parts.length - 1 && (
                  <motion.span
                    layout
                    className={`relative mx-1 inline-flex min-w-[5.5rem] items-center justify-center rounded-xl border-2 px-4 py-1 align-middle font-bold transition-colors ${
                      blankState === 'correct'
                        ? 'border-green-400 bg-green-500/25 text-green-100 shadow-md shadow-green-500/20'
                        : blankState === 'incorrect'
                          ? 'border-red-400 bg-red-500/25 text-red-100 shadow-md shadow-red-500/20'
                          : blankState === 'filled'
                            ? 'border-amber-400 bg-amber-500/20 text-amber-100 shadow-md shadow-amber-500/15 ring-2 ring-amber-400/30'
                            : 'border-dashed border-emerald-400/50 bg-emerald-500/10 text-emerald-300/60'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {blankWord ? (
                        <motion.span
                          key={blankWord}
                          initial={{ opacity: 0, y: 8, scale: 0.85 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                          className="text-lg sm:text-xl"
                        >
                          {blankWord}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-semibold tracking-wide"
                        >
                          ?
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.span>
                )}
              </span>
            ))}
          </p>

          {locked && !isCorrect && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm font-medium text-emerald-300"
            >
              Mot correct : <span className="font-bold text-green-300">{question.options[question.correctAnswer]}</span>
            </motion.p>
          )}
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Banque de mots
          </p>
          <div className="flex flex-wrap gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correctAnswer;
              const showCorrect = locked && isCorrectAnswer;
              const showIncorrect = locked && isSelected && !isCorrectAnswer;
              const isPlacedInSentence = isSelected && !locked;

              return (
                <motion.button
                  key={`${option}-${index}`}
                  type="button"
                  whileHover={!locked ? { scale: 1.06, y: -2 } : {}}
                  whileTap={!locked ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={locked}
                  className={`relative px-5 py-3 rounded-2xl border-2 text-base sm:text-lg font-bold transition-all ${
                    showCorrect
                      ? 'border-green-400 bg-green-500/25 text-green-100'
                      : showIncorrect
                        ? 'border-red-400 bg-red-500/25 text-red-100'
                        : isPlacedInSentence
                          ? 'border-amber-400 bg-amber-500/20 text-amber-100 ring-2 ring-amber-400/40 scale-105'
                          : isSelected
                            ? 'border-purple-400 bg-purple-500/20 text-purple-100'
                            : 'border-white/20 bg-white/5 text-slate-100 hover:border-emerald-400/60 hover:bg-emerald-500/10'
                  } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {option}
                  {isPlacedInSentence && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950">
                      ✓
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWordOptionGrid = (
    layout: 'grid' | 'list',
    accent: 'indigo' | 'amber' | 'default' = 'default',
  ) => {
    if (!question) return null;
    const hoverBorder =
      accent === 'indigo'
        ? 'hover:border-indigo-400/60 hover:bg-indigo-500/10'
        : accent === 'amber'
          ? 'hover:border-amber-400/60 hover:bg-amber-500/10'
          : 'hover:border-fuchsia-300 hover:bg-white/10';

    return (
      <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectAnswer = index === question.correctAnswer;
          const showCorrect = answerLocked && isCorrectAnswer;
          const showIncorrect = answerLocked && isSelected && !isCorrectAnswer;

          return (
            <motion.button
              key={`${option}-${index}`}
              type="button"
              whileHover={!answerLocked ? { scale: 1.02, y: layout === 'grid' ? -2 : 0 } : {}}
              whileTap={!answerLocked ? { scale: 0.98 } : {}}
              onClick={() => handleAnswerSelect(index)}
              disabled={answerLocked}
              className={`${layout === 'grid' ? 'min-h-[88px] justify-center text-center text-lg' : 'text-left'} flex items-center w-full p-4 rounded-2xl border-2 font-semibold transition-all ${
                showCorrect
                  ? 'bg-green-50 border-green-500 text-green-900'
                  : showIncorrect
                    ? 'bg-red-50 border-red-500 text-red-900'
                    : isSelected
                      ? 'bg-purple-500/20 border-purple-400 text-purple-100 ring-2 ring-purple-400/40'
                      : `bg-white/5 border-white/20 text-slate-100 ${hoverBorder}`
              } ${answerLocked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="flex-1">{option}</span>
              {showCorrect && <CheckCircle className="w-6 h-6 text-green-600 shrink-0 ml-2" />}
              {showIncorrect && <XCircle className="w-6 h-6 text-red-600 shrink-0 ml-2" />}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderImageWordSection = () => {
    if (!question) return null;

    return (
      <div className="mb-6 space-y-6">
        <div className="overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-violet-950/70 p-6 sm:p-8 shadow-lg shadow-indigo-900/20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-200">
            <ImageIcon className="h-3.5 w-3.5" />
            Image → Mot
          </div>
          {question.mediaUrl ? (
            <div className="mb-5 flex justify-center">
              <QuizMediaImage
                src={question.mediaUrl}
                alt="Objet à nommer"
                className="max-h-72 w-full max-w-md rounded-2xl border-2 border-indigo-400/30 bg-white/5 object-contain shadow-xl"
              />
            </div>
          ) : (
            <div className="mb-5 flex h-48 items-center justify-center rounded-2xl border border-dashed border-indigo-400/40 bg-indigo-500/10 text-indigo-200">
              Image non disponible
            </div>
          )}
          <p className="text-center text-lg font-medium text-indigo-100">
            {question.question.trim() || 'Quel mot correspond à cette image ?'}
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Choisis le bon mot
          </p>
          {renderWordOptionGrid('grid', 'indigo')}
        </div>
      </div>
    );
  };

  const renderSynonymAntonymSection = () => {
    if (!question) return null;
    const parsed = parseSynonymAntonym(question.question);
    const isSynonym = parsed.mode === 'synonym';
    const isAntonym = parsed.mode === 'antonym';

    return (
      <div className="mb-6 space-y-6">
        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/60 via-slate-900/90 to-orange-950/60 p-6 sm:p-8 shadow-lg shadow-amber-900/15">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
            <Languages className="h-3.5 w-3.5" />
            {isSynonym ? 'Synonyme' : isAntonym ? 'Antonyme' : 'Synonymes / Antonymes'}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-amber-200/80 mb-3">
              {isSynonym
                ? 'Trouve un synonyme de :'
                : isAntonym
                  ? 'Trouve un antonyme de :'
                  : question.question}
            </p>
            <div className="inline-flex items-center justify-center rounded-2xl border-2 border-amber-400/40 bg-amber-500/15 px-8 py-5">
              <span className="text-3xl sm:text-4xl font-black text-amber-100">{parsed.word}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Propositions
          </p>
          {renderWordOptionGrid('list', 'amber')}
        </div>
      </div>
    );
  };

  const renderColorSwatchOptions = (hideLabelsUntilLocked: boolean) => {
    if (!question) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectAnswer = index === question.correctAnswer;
          const showCorrect = answerLocked && isCorrectAnswer;
          const showIncorrect = answerLocked && isSelected && !isCorrectAnswer;
          const color = getColorValue(option) ?? '#94a3b8';
          const showLabel = !hideLabelsUntilLocked || answerLocked || isSelected;

          return (
            <motion.button
              key={`${option}-${index}`}
              type="button"
              whileHover={!answerLocked ? { scale: 1.05, y: -3 } : {}}
              whileTap={!answerLocked ? { scale: 0.95 } : {}}
              onClick={() => handleAnswerSelect(index)}
              disabled={answerLocked}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                showCorrect
                  ? 'border-green-400 bg-green-500/20'
                  : showIncorrect
                    ? 'border-red-400 bg-red-500/20'
                    : isSelected
                      ? 'border-fuchsia-400 bg-fuchsia-500/15 ring-2 ring-fuchsia-400/40'
                      : 'border-white/20 bg-white/5 hover:border-fuchsia-400/50'
              } ${answerLocked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className="h-16 w-16 rounded-full border-4 border-white/25 shadow-lg"
                style={{ backgroundColor: color }}
              />
              {showLabel && (
                <span className={`text-sm font-bold ${showCorrect ? 'text-green-200' : showIncorrect ? 'text-red-200' : 'text-slate-100'}`}>
                  {option}
                </span>
              )}
              {showCorrect && <CheckCircle className="w-5 h-5 text-green-400" />}
              {showIncorrect && <XCircle className="w-5 h-5 text-red-400" />}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderColorTranslationSection = () => {
    if (!question) return null;
    const colorLabel = parseColorPrompt(question.question);
    const swatchColor = getColorValue(colorLabel);

    return (
      <div className="mb-6 space-y-6">
        <div className="rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-950/60 via-slate-900/90 to-pink-950/60 p-6 sm:p-8 shadow-lg shadow-fuchsia-900/15">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-200">
            <Palette className="h-3.5 w-3.5" />
            Couleurs FR / EN
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            {swatchColor && (
              <span
                className="h-20 w-20 rounded-2xl border-4 border-white/20 shadow-xl"
                style={{ backgroundColor: swatchColor }}
              />
            )}
            <div>
              <p className="text-sm text-fuchsia-200/80 mb-1">Traduis cette couleur :</p>
              <p className="text-3xl font-black text-fuchsia-100">{colorLabel}</p>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Sélectionne la traduction
          </p>
          {renderColorSwatchOptions(false)}
        </div>
      </div>
    );
  };

  const renderAudioColorSection = () => {
    if (!question) return null;

    return (
      <div className="mb-6 space-y-6">
        <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-sky-950/60 p-6 sm:p-8 shadow-lg shadow-cyan-900/15">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
            <Volume2 className="h-3.5 w-3.5" />
            Écoute la couleur
          </div>
          <p className="text-center text-lg font-medium text-cyan-100 mb-5">
            {question.question.trim() || 'Quelle couleur entends-tu ?'}
          </p>
          <QuizAudioPlayer
            src={question.promptAudioUrl}
            speechText={getAudioColorSpeechText(
              question.options[question.correctAnswer] ?? '',
              question.promptAudioUrl,
            )}
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Choisis la bonne couleur
          </p>
          {renderColorSwatchOptions(true)}
        </div>
      </div>
    );
  };

  if (totalQuestions === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="bg-white/5 rounded-2xl p-8 border border-white/15 backdrop-blur-xl max-w-md text-center">
          <p className="text-slate-200 mb-4">Aucune question pour ce jeu. L&apos;éducateur peut en ajouter depuis son espace.</p>
          <button
            onClick={() => navigate('/player/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (window.confirm('Quitter la partie ? Votre progression sera perdue.')) {
                    navigate('/player/dashboard');
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-white">{resolvedGame.title}</h1>
                <p className="text-sm text-slate-300 flex flex-wrap items-center gap-2">
                  <PlayerQuizVariantChip variant={activeVariant} />
                  {isBlitzMode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 border border-orange-400/30 px-2 py-0.5 text-xs font-semibold text-orange-200">
                      <Zap className="h-3 w-3" /> Blitz 60 s
                    </span>
                  )}
                  <span className="text-slate-400">
                    {isBlitzMode
                      ? `${questionsAnsweredCount} réponse${questionsAnsweredCount > 1 ? 's' : ''} · ${correctAnswersCount} bonne${correctAnswersCount > 1 ? 's' : ''}`
                      : `Question ${currentQuestion + 1} sur ${totalQuestions}`}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isBlitzMode ? 'bg-orange-50' : 'bg-blue-50'}`}>
                  {isBlitzMode ? <Zap className="w-5 h-5 text-orange-600" /> : <Clock className="w-5 h-5 text-blue-600" />}
                  <span className={`font-bold ${isBlitzMode ? 'text-orange-600' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="px-4 py-2 bg-purple-50 rounded-lg">
                  <span className="font-bold text-purple-600">Score : {score}</span>
                </div>
              </div>
              <PlayerHeaderActions />
            </div>
          </div>

          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            />
          </div>

          <div className="relative h-1 bg-white/20 rounded-full overflow-hidden mt-2">
            <motion.div
              animate={{ width: `${timePercentage}%` }}
              className={`absolute inset-y-0 left-0 rounded-full ${
                timeLeft < 15 ? 'bg-red-500' : timeLeft < 30 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlayerQuizVariantBanner variant={activeVariant} />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${questionIndex}-${questionsAnsweredCount}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`rounded-2xl p-6 sm:p-8 border backdrop-blur-xl ${
              isTrueFalseQuestion
                ? 'bg-sky-950/20 border-sky-400/20'
                : isClozeQuestion
                  ? 'bg-emerald-950/15 border-emerald-400/20'
                  : isImageWordQuestion
                    ? 'bg-indigo-950/20 border-indigo-400/20'
                    : isSynonymAntonymQuestion
                      ? 'bg-amber-950/20 border-amber-400/20'
                      : isColorTranslationQuestion
                        ? 'bg-fuchsia-950/15 border-fuchsia-400/20'
                        : isAudioColorQuestion
                          ? 'bg-cyan-950/20 border-cyan-400/20'
                          : 'bg-white/5 border-white/15'
            }`}
          >
            <div className={`${isSpecialSubtypeQuestion ? 'mb-5' : 'mb-8'}`}>
              <div className="flex items-center gap-2 text-sm text-slate-300 flex-wrap mb-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white">
                  {isBlitzMode ? '⚡' : currentQuestion + 1}
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                  {question.points} points
                </span>
              </div>

              <PlayerQuizVariantHint variant={activeVariant} />

              {!isSpecialSubtypeQuestion && (
                <h2 className="text-2xl font-bold text-white mb-4">{question.question}</h2>
              )}

              {!isSpecialSubtypeQuestion && question.mediaUrl && (
                <div className="mt-4">
                  <QuizMediaImage
                    src={question.mediaUrl}
                    alt="question-media"
                    className="max-h-60 rounded-xl border border-white/20 bg-white/5 object-contain"
                    fallbackClassName="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-slate-400 text-sm"
                  />
                </div>
              )}
            </div>

            {isBlitzMode && blitzFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-4 px-4 py-3 rounded-xl text-center font-bold ${
                  blitzFeedback === 'correct'
                    ? 'bg-green-500/20 text-green-200 border border-green-400/40'
                    : 'bg-red-500/20 text-red-200 border border-red-400/40'
                }`}
              >
                {blitzFeedback === 'correct' ? '✓ Bonne réponse !' : '✗ Raté'}
              </motion.div>
            )}

            {isTrueFalseQuestion ? (
              renderTrueFalseSection()
            ) : isClozeQuestion ? (
              renderClozeSection()
            ) : isImageWordQuestion ? (
              renderImageWordSection()
            ) : isSynonymAntonymQuestion ? (
              renderSynonymAntonymSection()
            ) : isColorTranslationQuestion ? (
              renderColorTranslationSection()
            ) : isAudioColorQuestion ? (
              renderAudioColorSection()
            ) : (
              <div className="space-y-3 mb-6">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === question.correctAnswer;
                  const showCorrect = (showExplanation || blitzFeedback !== null) && isCorrectAnswer;
                  const showIncorrect = (showExplanation || blitzFeedback === 'incorrect') && isSelected && !isCorrectAnswer;

                  return (
                    <motion.button
                      key={index}
                      whileHover={!showExplanation && blitzFeedback === null ? { scale: 1.02, x: 5 } : {}}
                      whileTap={!showExplanation && blitzFeedback === null ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showExplanation || blitzFeedback !== null}
                      className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                        showCorrect
                          ? 'bg-green-50 border-green-500 text-green-900'
                          : showIncorrect
                          ? 'bg-red-50 border-red-500 text-red-900'
                          : isSelected
                          ? 'bg-purple-50 border-purple-500 text-purple-900'
                          : 'bg-white/5 border-white/20 text-slate-100 hover:border-fuchsia-300 hover:bg-white/10'
                      } ${showExplanation || blitzFeedback !== null ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showCorrect && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {showIncorrect && <XCircle className="w-6 h-6 text-red-600" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <AnimatePresence>
              {showExplanation && !isBlitzMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-6 rounded-xl mb-6 ${
                    isCorrect ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <h3 className={`font-bold mb-2 ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                        {isCorrect ? '🎉 Correct !' : '❌ Incorrect'}
                      </h3>
                      <div className="flex items-start gap-2">
                        <Lightbulb
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            isCorrect ? 'text-amber-600' : 'text-amber-700'
                          }`}
                        />
                        <p
                          className={`text-sm sm:text-base leading-relaxed ${
                            isCorrect ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          {question.explanation?.trim()
                            ? question.explanation
                            : isCorrect
                              ? 'Bonne réponse !'
                              : 'Ce n’est pas la bonne réponse.'}
                        </p>
                      </div>
                      {isCorrect && (
                        <p className="mt-2 font-semibold text-green-700">+{question.points} points</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isBlitzMode && (
              <div className="flex gap-4">
                {!showExplanation ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyAnswer}
                    disabled={selectedAnswer === null}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                      selectedAnswer === null
                        ? 'bg-white/15 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                    }`}
                  >
                    Vérifier
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextQuestion}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-shadow"
                  >
                    {isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
