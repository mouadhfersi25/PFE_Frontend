import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  RotateCcw, 
  Trophy, 
  Star, 
  TrendingUp, 
  Target,
  Clock,
  Zap,
  Flag,
  Crown,
  Medal
} from 'lucide-react';
import { useAuth } from '@/context';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import ReportGameModal from '@/components/player/ReportGameModal';
import userApi from '@/api/user/user.api';
import type { CompetitiveRoomResultDTO, MotifReclamation } from '@/api/types/api.types';
import { toast } from 'sonner';
import { resolveGameMaxScore } from '@/utils/gameMaxScore';
import { subscribeCompetitiveResult } from '@/services/roomService';

export default function GameResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { playerProfile, updatePlayerProfile, refreshUser } = useAuth();
  const { game, mode, roomCode, sessionData } = location.state || {};

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [officialScore, setOfficialScore] = useState<number>(() => Number(sessionData?.scoreFinal || 0));
  const [maxScore, setMaxScore] = useState<number>(() => resolveGameMaxScore(game));
  const [xpGained, setXpGained] = useState<number>(0);
  const [scoringVersion, setScoringVersion] = useState<string>('');
  const [displayDuration, setDisplayDuration] = useState<string>('—');
  const [roomResult, setRoomResult] = useState<CompetitiveRoomResultDTO | null>(null);
  const hasSavedSessionRef = useRef(false);
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const normalizeRoomCode = (raw: unknown) => String(raw ?? '').trim().toUpperCase();

  const formatDurationFromSeconds = (secondsRaw?: number) => {
    const total = Math.max(0, Number(secondsRaw || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    if (mins <= 0) return `${secs} sec`;
    return `${mins} min ${secs} sec`;
  };

  const formatDurationFromDates = (startRaw?: string, endRaw?: string) => {
    if (!startRaw || !endRaw) return null;
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const diffSeconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
    return formatDurationFromSeconds(diffSeconds);
  };

  useEffect(() => {
    if (!game || !sessionData) {
      navigate('/player/dashboard');
    }
  }, [game, sessionData, navigate]);

  useEffect(() => {
    if (mode !== 'Online') return;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const gameId = Number(game?.id ?? sessionData?.gameId);
    if (!normalizedRoomCode || !Number.isFinite(gameId) || gameId <= 0) return;

    let cancelled = false;
    userApi.getRoomResult(normalizedRoomCode, gameId)
      .then((response) => {
        if (!cancelled) setRoomResult(response.data);
      })
      .catch(() => {
        // Le premier résultat peut ne pas encore exister; le WebSocket prendra le relais.
      });

    const unsubscribe = subscribeCompetitiveResult(
      normalizedRoomCode,
      (result) => {
        if (!cancelled && Number(result.gameId) === gameId) {
          setRoomResult(result);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [mode, roomCode, game?.id, sessionData?.gameId]);

  useEffect(() => {
    if (!game || !sessionData || hasSavedSessionRef.current) return;
    const parsedGameId = Number(game.id ?? sessionData.gameId);
    if (!Number.isFinite(parsedGameId) || parsedGameId <= 0) {
      console.error('Game session save skipped: invalid game id', { game, sessionData });
      toast.error("Impossible d'enregistrer la session: gameId invalide");
      return;
    }

    const parsedDurationSeconds = (() => {
      if (typeof sessionData.durationSeconds === 'number') {
        return Math.max(0, sessionData.durationSeconds);
      }
      const raw = String(sessionData.duration || '').trim().toLowerCase();
      const mmssMatch = raw.match(/^(\d+):(\d{1,2})$/);
      if (mmssMatch) {
        const mins = Number(mmssMatch[1] || 0);
        const secs = Number(mmssMatch[2] || 0);
        return mins * 60 + secs;
      }
      const minMatch = raw.match(/(\d+)\s*min/);
      if (minMatch) return Number(minMatch[1] || 0) * 60;
      return 0;
    })();

    hasSavedSessionRef.current = true;

    const persistSession = async () => {
      const isOnline = mode === 'Online';
      const res = await userApi.createGameSession({
        gameId: parsedGameId,
        modeJeu: isOnline ? 'EN_LIGNE' : 'INDIVIDUEL',
        roomCode: isOnline ? String(roomCode || '').trim() : undefined,
        etatSession: 'TERMINE',
        durationSeconds: parsedDurationSeconds,
        accuracyPercent: sessionData.accuracy != null ? Number(sessionData.accuracy) : undefined,
        reactionTimeMs: sessionData.reactionTime != null ? Number(sessionData.reactionTime) : undefined,
        totalQuestions: sessionData.totalQuestions != null ? Number(sessionData.totalQuestions) : undefined,
        correctAnswers: sessionData.correctAnswers != null ? Number(sessionData.correctAnswers) : undefined,
        moves: sessionData.moves != null ? Number(sessionData.moves) : undefined,
        matches: sessionData.matches != null ? Number(sessionData.matches) : undefined,
        attempts: sessionData.attempts != null ? Number(sessionData.attempts) : undefined,
        hintsUsed: sessionData.hintsUsed != null ? Number(sessionData.hintsUsed) : undefined,
        totalRounds: sessionData.totalRounds != null ? Number(sessionData.totalRounds) : undefined,
        successfulRounds: sessionData.successfulRounds != null ? Number(sessionData.successfulRounds) : undefined,
        reussite: sessionData.reussite != null ? Boolean(sessionData.reussite) : undefined,
      });

      const progression = res.data;
      if (progression?.sessionId != null && Number(progression.sessionId) > 0) {
        setSavedSessionId(Number(progression.sessionId));
      }
      setOfficialScore(Number(progression?.scoreFinal ?? progression?.scoreGlobal ?? 0));
      setMaxScore(
        Number(progression?.scoreMaxPossible) > 0
          ? Number(progression.scoreMaxPossible)
          : resolveGameMaxScore(game)
      );
      setXpGained(Math.max(0, progression?.xpGained ?? 0));
      setScoringVersion(String(progression?.scoringRulesVersion || ''));
      const durationFromDates = formatDurationFromDates(progression?.dateDebut, progression?.dateFin);
      const durationFromSeconds = progression?.durationSeconds != null
        ? formatDurationFromSeconds(progression.durationSeconds)
        : null;
      if (durationFromDates) {
        const start = progression?.dateDebut ? new Date(progression.dateDebut) : null;
        const end = progression?.dateFin ? new Date(progression.dateFin) : null;
        if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          const diffSeconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
          setDisplayDuration(formatDurationFromSeconds(diffSeconds));
        } else {
          setDisplayDuration(durationFromDates);
        }
      } else if (durationFromSeconds) {
        setDisplayDuration(durationFromSeconds);
      } else if (typeof sessionData.durationSeconds === 'number') {
        setDisplayDuration(formatDurationFromSeconds(sessionData.durationSeconds));
      } else {
        const raw = String(sessionData?.duration || '').trim().toLowerCase();
        const mmssMatch = raw.match(/^(\d+):(\d{1,2})$/);
        if (mmssMatch) {
          const mins = Number(mmssMatch[1] || 0);
          const secs = Number(mmssMatch[2] || 0);
          setDisplayDuration(formatDurationFromSeconds(mins * 60 + secs));
        } else {
          setDisplayDuration('—');
        }
      }
      if (playerProfile) {
        updatePlayerProfile({
          niveau: progression?.newLevel ?? playerProfile.niveau ?? playerProfile.level,
          pointsExperience: progression?.newXp ?? playerProfile.pointsExperience ?? playerProfile.xp,
          scoreTotal: progression?.totalScore ?? playerProfile.scoreTotal ?? playerProfile.totalScore,
          level: progression?.newLevel ?? playerProfile.level,
          xp: progression?.newXp ?? playerProfile.xp,
          xpToNextLevel: progression?.xpToNextLevel ?? playerProfile.xpToNextLevel,
          totalScore: progression?.totalScore ?? playerProfile.totalScore,
        });
      }
      if (progression?.levelUp) {
        setShowLevelUp(true);
      }

      if (isOnline && progression?.roomResult) {
        setRoomResult(progression.roomResult);
      }

      await refreshUser();
    };

    persistSession().catch((err: any) => {
      hasSavedSessionRef.current = false;
      const backendMessage = err?.response?.data?.message;
      console.error('Game session save failed', {
        status: err?.response?.status,
        data: err?.response?.data,
      });
      toast.error(backendMessage || "Echec d'enregistrement de la session");
    });
  }, [game, sessionData, playerProfile, updatePlayerProfile, refreshUser]);

  useEffect(() => {
    if (displayDuration !== '—') return;
    if (typeof sessionData?.durationSeconds === 'number') {
      setDisplayDuration(formatDurationFromSeconds(sessionData.durationSeconds));
      return;
    }
    const raw = String(sessionData?.duration || '').trim().toLowerCase();
    const mmssMatch = raw.match(/^(\d+):(\d{1,2})$/);
    if (mmssMatch) {
      const mins = Number(mmssMatch[1] || 0);
      const secs = Number(mmssMatch[2] || 0);
      setDisplayDuration(formatDurationFromSeconds(mins * 60 + secs));
    }
  }, [sessionData, displayDuration]);

  const currentRoomPlayer = roomResult?.players.find(
    (player) => Number(player.playerId) === Number(playerProfile?.id)
  );
  const sortedRoomPlayers = [...(roomResult?.players ?? [])].sort((a, b) => {
    if (!a.submitted && b.submitted) return 1;
    if (a.submitted && !b.submitted) return -1;
    return (b.score ?? 0) - (a.score ?? 0);
  });
  const roomLeaders = roomResult?.players
    .filter((player) => player.outcome === 'WINNER' || player.outcome === 'DRAW')
    .map((player) => player.playerName)
    .join(', ');

  if (!game || !sessionData) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="fixed top-4 right-4 z-40">
        <PlayerHeaderActions />
      </div>
      {/* Level Up Animation */}
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowLevelUp(false)}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-12 text-center shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-24 h-24 text-white mx-auto mb-4" />
            </motion.div>
            <h2 className="text-5xl font-bold text-white mb-2">Level Up!</h2>
            <p className="text-2xl text-white">
              You're now Level {playerProfile?.level}
            </p>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-3xl border border-white/15 backdrop-blur-xl p-8 max-w-3xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              sessionData.reussite
                ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                : 'bg-gradient-to-br from-orange-400 to-red-500'
            }`}
          >
            {sessionData.reussite ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <Target className="w-12 h-12 text-white" />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            {sessionData.reussite ? '🎉 Great Job!' : '💪 Good Effort!'}
          </motion.h1>
          <p className="text-slate-300">{game.title}</p>
          {mode === 'Online' && (
            <span className="inline-block mt-2 px-3 py-1 bg-purple-500/30 text-purple-100 rounded-full text-sm font-medium border border-purple-300/30">
              Solo en ligne · contre adversaires
            </span>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-6 text-white"
          >
            <Trophy className="w-8 h-8 mb-2" />
            <p className="text-sm opacity-90 mb-1">
              Score personnel
            </p>
            <p className="text-4xl font-bold tabular-nums">
              {officialScore}
              <span className="text-2xl font-semibold opacity-85">/{maxScore}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white"
          >
            <Star className="w-8 h-8 mb-2" />
            <p className="text-sm opacity-90 mb-1">XP Gained</p>
            <p className="text-4xl font-bold">+{xpGained}</p>
          </motion.div>
        </div>
        {scoringVersion && (
          <div className="text-xs text-slate-400 mb-6 text-center">
            Scoring rules: {scoringVersion}
          </div>
        )}

        {mode === 'Online' && roomResult?.complete && currentRoomPlayer && (
          <motion.section
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            className={`relative overflow-hidden rounded-3xl border-2 p-8 mb-8 text-center shadow-2xl ${
              currentRoomPlayer.outcome === 'WINNER'
                ? 'border-amber-300/70 bg-gradient-to-br from-amber-500/35 via-yellow-500/20 to-emerald-500/25 shadow-amber-500/20'
                : currentRoomPlayer.outcome === 'DRAW'
                  ? 'border-cyan-300/60 bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-cyan-500/25 shadow-cyan-500/20'
                  : 'border-rose-300/40 bg-gradient-to-br from-rose-500/20 via-slate-800/80 to-indigo-500/20 shadow-rose-500/10'
            }`}
          >
            <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <motion.div
              initial={{ rotate: -12, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring' }}
              className={`relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 ${
                currentRoomPlayer.outcome === 'WINNER'
                  ? 'border-amber-200 bg-amber-400/25 text-amber-200'
                  : currentRoomPlayer.outcome === 'DRAW'
                    ? 'border-cyan-200 bg-cyan-400/20 text-cyan-100'
                    : 'border-rose-200/60 bg-rose-400/15 text-rose-100'
              }`}
            >
              {currentRoomPlayer.outcome === 'WINNER' ? (
                <Crown className="h-12 w-12" />
              ) : currentRoomPlayer.outcome === 'DRAW' ? (
                <Medal className="h-12 w-12" />
              ) : (
                <Target className="h-12 w-12" />
              )}
            </motion.div>
            <p className="relative text-sm font-bold uppercase tracking-[0.3em] text-white/70">
              Résultat de la room
            </p>
            <h2 className="relative mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
              {currentRoomPlayer.outcome === 'WINNER'
                ? 'VICTOIRE !'
                : currentRoomPlayer.outcome === 'DRAW'
                  ? 'ÉGALITÉ EN TÊTE !'
                  : 'DÉFAITE'}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-slate-100 sm:text-lg">
              {currentRoomPlayer.outcome === 'WINNER'
                ? `Bravo ! Vous remportez la room avec ${currentRoomPlayer.score ?? 0} points.`
                : currentRoomPlayer.outcome === 'DRAW'
                  ? `Vous partagez la première place avec ${currentRoomPlayer.score ?? 0} points.`
                  : `Première place : ${roomLeaders || 'un adversaire'} avec ${roomResult.highestScore ?? 0} points. Votre score : ${currentRoomPlayer.score ?? 0} points.`}
            </p>
          </motion.section>
        )}

        {mode === 'Online' && roomResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-indigo-500/10 rounded-2xl p-6 mb-8 border border-indigo-300/25"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-white">Classement de la room</h3>
              <span className={`text-xs font-semibold rounded-full px-3 py-1 ${
                roomResult.complete
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'bg-amber-500/20 text-amber-200'
              }`}>
                {roomResult.complete
                  ? 'Résultat final'
                  : `En attente : ${roomResult.completedPlayers}/${roomResult.expectedPlayers}`}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {sortedRoomPlayers.map((player, index) => (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm ${
                    player.outcome === 'WINNER'
                      ? 'border-amber-300/40 bg-amber-400/10'
                      : player.outcome === 'DRAW'
                        ? 'border-cyan-300/35 bg-cyan-400/10'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black ${
                      player.outcome === 'WINNER'
                        ? 'bg-amber-400/20 text-amber-200'
                        : player.outcome === 'DRAW'
                          ? 'bg-cyan-400/20 text-cyan-100'
                          : 'bg-white/10 text-slate-200'
                    }`}>
                      {player.outcome === 'WINNER'
                        ? '👑'
                        : player.outcome === 'DRAW'
                          ? '🏅'
                          : player.submitted
                            ? `${index + 1}e`
                            : '…'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {player.playerName}
                        {Number(player.playerId) === Number(playerProfile?.id) ? ' (vous)' : ''}
                      </p>
                      <p className="text-xs text-slate-400">
                        {player.outcome === 'WINNER'
                          ? 'Vainqueur de la room'
                          : player.outcome === 'DRAW'
                            ? 'Première place partagée'
                            : player.outcome === 'LOSER'
                              ? 'Adversaire'
                              : 'Partie en cours'}
                      </p>
                    </div>
                  </div>
                  <p className={player.submitted ? 'shrink-0 text-lg font-black text-cyan-200' : 'shrink-0 text-amber-200'}>
                    {player.submitted ? `${player.score ?? 0} pts` : 'En cours…'}
                  </p>
                </div>
              ))}
            </div>
            {!roomResult.complete && (
              <p className="mt-4 text-xs text-slate-300">
                Cette page se met à jour automatiquement lorsque les adversaires terminent.
              </p>
            )}
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10"
        >
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Details
          </h3>
          <div className="space-y-3">
            {sessionData.accuracy !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Accuracy</span>
                <span className="font-bold text-white">{sessionData.accuracy}%</span>
              </div>
            )}
            {displayDuration && displayDuration !== '—' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration
                </span>
                <span className="font-bold text-white">{displayDuration}</span>
              </div>
            )}
            {sessionData.reactionTime && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Avg Reaction Time
                </span>
                <span className="font-bold text-white">{sessionData.reactionTime}ms</span>
              </div>
            )}
            {sessionData.totalQuestions && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Questions</span>
                <span className="font-bold text-white">
                  {sessionData.correctAnswers || 0} / {sessionData.totalQuestions}
                </span>
              </div>
            )}
            {sessionData.moves && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Moves</span>
                <span className="font-bold text-white">{sessionData.moves}</span>
              </div>
            )}
            {sessionData.attempts && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Attempts</span>
                <span className="font-bold text-white">{sessionData.attempts}</span>
              </div>
            )}
            {sessionData.hintsUsed !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Hints Used</span>
                <span className="font-bold text-white">{sessionData.hintsUsed}</span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="mt-4">
          <button
            type="button"
            disabled={!savedSessionId || reportSent}
            onClick={() => setReportModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-100 font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Flag className="w-5 h-5" />
            {reportSent ? 'Signalement envoyé' : 'Signaler un problème'}
          </button>
        </div>

        <ReportGameModal
          open={reportModalOpen}
          gameTitle={game?.title || 'Jeu'}
          loading={reportSubmitting}
          onClose={() => setReportModalOpen(false)}
          onSubmit={async (motif: MotifReclamation, commentaire: string) => {
            if (!savedSessionId || !game?.id) return;
            setReportSubmitting(true);
            try {
              await userApi.createReclamation({
                sessionId: savedSessionId,
                gameId: Number(game.id),
                motif,
                commentaire: commentaire || undefined,
              });
              setReportSent(true);
              setReportModalOpen(false);
              toast.success('Signalement envoyé. Merci pour votre retour.');
            } finally {
              setReportSubmitting(false);
            }
          }}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (mode === 'Online') {
                navigate('/player/new-game', { state: { mode: 'Online' } });
                return;
              }
              navigate(`/player/game/${game.type}/${game.id}`, { state: { game, mode } });
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/10 text-slate-100 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            <RotateCcw className="w-5 h-5" />
            {mode === 'Online' ? 'Nouvelle partie en ligne' : 'Rejouer'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/player/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </motion.button>
        </div>
        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-slate-300"
        >
          <p>
            {sessionData.reussite
              ? "🌟 Excellent work! You're improving every day!"
              : "💪 Keep practicing! Every attempt makes you stronger!"}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
