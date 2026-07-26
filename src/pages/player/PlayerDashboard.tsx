import { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Award, 
  History, 
  Star,
  User as UserIcon,
  Users,
  Trophy,
  Sparkles,
  Zap,
  Gift,
  Mic,
} from 'lucide-react';
import { useAuth } from '@/context';
import userApi from '@/api/user/user.api';
import type { GameDTO, UserDTO } from '@/api/types/api.types';
import PlayerAppHeader from '@/components/player/PlayerAppHeader';
import { PlayerQuizVariantChip } from '@/components/player/PlayerQuizVariant';
import { launchPlayerGame } from './utils/launchPlayerGame';

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const highlightGameId = (location.state as { highlightGameId?: number } | null)?.highlightGameId;
  const { playerProfile } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [availableGames, setAvailableGames] = useState<GameDTO[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [selectedGameType, setSelectedGameType] = useState<'ALL' | 'QUIZ' | 'MEMOIRE' | 'LOGIQUE' | 'REFLEXE'>('ALL');
  const [showStreakDetails, setShowStreakDetails] = useState(false);

  useEffect(() => {
    userApi
      .getMe()
      .then((res) => {
        const data = res.data as UserDTO;
        const isPlayer = (data.role || '').toUpperCase() === 'JOUEUR';
        const incomplete = isPlayer && !data.onboardingCompleted;
        setNeedsOnboarding(incomplete);
      })
      .catch(() => setNeedsOnboarding(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setGamesLoading(true);
    userApi.getAvailableGames()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setAvailableGames(rows);
      })
      .catch(() => {
        if (!cancelled) setAvailableGames([]);
      })
      .finally(() => {
        if (!cancelled) setGamesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (needsOnboarding === true) {
      navigate('/player/profile?onboarding=true');
    }
  }, [needsOnboarding, navigate]);

  useLayoutEffect(() => {
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (highlightGameId == null) {
      window.scrollTo(0, 0);
    }
    return () => {
      if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, [location.pathname, location.key, highlightGameId]);

  const filteredGamesByType = useMemo(
    () => availableGames.filter((g) => selectedGameType === 'ALL' || g.typeJeu === selectedGameType),
    [availableGames, selectedGameType]
  );

  const playableGames = useMemo(() => {
    if (!playerProfile) return availableGames;
    return availableGames.filter((g) => {
      const min = g.ageMin ?? 7;
      const max = g.ageMax ?? 18;
      return playerProfile.age >= min && playerProfile.age <= max;
    });
  }, [availableGames, playerProfile]);

  const dashboardGamesPreview = useMemo(() => {
    let list = filteredGamesByType;
    if (highlightGameId != null) {
      const highlighted = list.find((g) => g.id === highlightGameId);
      if (highlighted) {
        list = [highlighted, ...list.filter((g) => g.id !== highlightGameId)];
      }
    }
    return list.slice(0, 6);
  }, [filteredGamesByType, highlightGameId]);

  useEffect(() => {
    if (highlightGameId == null || availableGames.length === 0) return;
    const game = availableGames.find((g) => g.id === highlightGameId);
    if (game) setSelectedGameType(game.typeJeu);
  }, [highlightGameId, availableGames]);

  useEffect(() => {
    if (highlightGameId == null || gamesLoading) return;
    const timer = window.setTimeout(() => {
      const catalog = document.getElementById('player-games-catalog');
      const gameCard = document.getElementById(`player-game-${highlightGameId}`);
      const target = gameCard ?? catalog;
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (gameCard) {
        gameCard.classList.add('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-[#090f2b]');
        window.setTimeout(() => {
          gameCard.classList.remove('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-[#090f2b]');
        }, 2800);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [highlightGameId, gamesLoading, dashboardGamesPreview]);

  if (!playerProfile) return null;

  const niveau = playerProfile.niveau ?? playerProfile.level;
  const pointsExperience = playerProfile.pointsExperience ?? playerProfile.xp;
  const scoreTotal = playerProfile.scoreTotal ?? playerProfile.totalScore;
  const xpToNextLevel = playerProfile.xpToNextLevel;
  const currentStreakDays = playerProfile.currentStreakDays ?? playerProfile.currentStreak ?? 0;
  const bestStreakDays = playerProfile.bestStreakDays ?? currentStreakDays;

  const xpPercentage = (pointsExperience / xpToNextLevel) * 100;
  const safeXpPercentage = Math.max(0, Math.min(100, xpPercentage));
  const xpRemaining = Math.max(0, xpToNextLevel - pointsExperience);
  const avatarValue = (playerProfile.avatar || '').trim();
  const isImageAvatar =
    avatarValue.startsWith('http://') ||
    avatarValue.startsWith('https://') ||
    avatarValue.startsWith('data:image/');
  const isShortAvatarText = avatarValue.length > 0 && avatarValue.length <= 2;

  const dashboardCards = [
    { title: 'Badges', icon: Award, gradient: 'from-violet-500 to-indigo-700', action: () => navigate('/player/badges') },
    { title: 'Recompenses', icon: Gift, gradient: 'from-emerald-500 to-teal-700', action: () => navigate('/player/rewards') },
    { title: 'Historique', icon: History, gradient: 'from-slate-600 to-indigo-700', action: () => navigate('/player/history') },
    { title: 'Classement', icon: Trophy, gradient: 'from-blue-600 to-indigo-700', action: () => navigate('/player/ranking') },
  ];

  const formatType = (type: GameDTO['typeJeu']) => {
    if (type === 'QUIZ') return 'Quiz';
    if (type === 'MEMOIRE') return 'Mémoire';
    if (type === 'LOGIQUE') return 'Logique';
    return 'Réflexe';
  };

  const gameTypeMeta: Record<'QUIZ' | 'MEMOIRE' | 'LOGIQUE' | 'REFLEXE', { title: string; subtitle: string; accent: string }> = {
    QUIZ: { title: 'Quiz', subtitle: 'Culture, rapidite, precision', accent: 'from-sky-500 to-blue-600' },
    MEMOIRE: { title: 'Memoire', subtitle: 'Concentration et retention', accent: 'from-fuchsia-500 to-violet-600' },
    LOGIQUE: { title: 'Logique', subtitle: 'Analyse et raisonnement', accent: 'from-emerald-500 to-teal-600' },
    REFLEXE: { title: 'Reflexe', subtitle: 'Vitesse et reaction', accent: 'from-amber-500 to-orange-600' },
  };

  const playerRouteType = (type: GameDTO['typeJeu']) => {
    if (type === 'QUIZ') return 'quiz';
    if (type === 'MEMOIRE') return 'memory';
    if (type === 'LOGIQUE') return 'logic';
    return 'reflex';
  };

  const difficultyLabel = (d: number | null | undefined) => {
    const value = d ?? 5;
    if (value <= 3) return 'Facile';
    if (value <= 6) return 'Moyen';
    return 'Difficile';
  };

  const difficultyClass = (d: number | null | undefined) => {
    const label = difficultyLabel(d);
    if (label === 'Facile') return 'bg-emerald-500/20 text-emerald-200 border-emerald-300/40';
    if (label === 'Moyen') return 'bg-amber-500/20 text-amber-200 border-amber-300/40';
    return 'bg-rose-500/20 text-rose-200 border-rose-300/40';
  };

  const firstName = playerProfile.name.split(' ')[0];
  const canPlayByAge = (game: GameDTO) => {
    const min = game.ageMin ?? 7;
    const max = game.ageMax ?? 18;
    return playerProfile.age >= min && playerProfile.age <= max;
  };
  const totalPlayableGames = availableGames.filter(canPlayByAge).length;
  const motivationText =
    currentStreakDays >= 7
      ? 'Excellent rythme, tu es dans une dynamique de champion.'
      : currentStreakDays >= 3
        ? 'Super progression, continue encore quelques jours pour monter plus vite.'
        : 'Lance ta serie aujourd hui, chaque partie te rapproche du niveau suivant.';

  const parseIsoDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const chunks = value.split('-').map((c) => Number(c));
    if (chunks.length !== 3 || chunks.some((n) => Number.isNaN(n))) return null;
    const [year, month, day] = chunks;
    return new Date(year, month - 1, day);
  };

  const addDays = (date: Date, days: number) => {
    const clone = new Date(date);
    clone.setDate(clone.getDate() + days);
    return clone;
  };

  const lastStreakDate = parseIsoDate(playerProfile.lastStreakDate) ?? new Date();
  const maxVisibleStreakDays = 120;
  const visibleStreakDaysCount = Math.min(Math.max(0, currentStreakDays), maxVisibleStreakDays);
  const isStreakTimelineTruncated = currentStreakDays > maxVisibleStreakDays;
  const visibleStartDate = addDays(lastStreakDate, -(Math.max(visibleStreakDaysCount, 1) - 1));
  const streakTimelineDays = Array.from({ length: visibleStreakDaysCount }, (_, idx) => {
    const date = addDays(visibleStartDate, idx);
    return {
      date,
      weekday: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', ''),
      shortDate: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(date),
    };
  });

  const enterFullscreen = async () => {
    try {
      if (document.fullscreenElement) return;
      const element = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      }
    } catch {
      // Ignore browser/user denial and continue navigation.
    }
  };

  const launchGameFromCard = async (g: GameDTO) => {
    if (!canPlayByAge(g)) return;
    const mappedGame = {
      id: String(g.id),
      title: g.titre,
      description: g.description || '',
      type: playerRouteType(g.typeJeu),
      modeJeu: g.modeJeu,
      ageRange: `${g.ageMin ?? 7}-${g.ageMax ?? 18}`,
      difficulty: difficultyLabel(g.difficulte) === 'Facile' ? 'Easy' : difficultyLabel(g.difficulte) === 'Moyen' ? 'Medium' : 'Hard',
      estimatedTime: `${g.dureeMinutes ?? 10} min`,
      durationMinutes: g.dureeMinutes ?? 10,
      quizPlayMode: g.quizPlayMode ?? 'CLASSIC',
      quizVariant: g.quizVariant ?? 'DEFAULT',
      icon: g.icone || '🎮',
    };

    await launchPlayerGame({
      gameId: g.id,
      gameTypeRoute: playerRouteType(g.typeJeu),
      modeJeu: g.modeJeu,
      gamePayload: mappedGame,
      navigate,
      enterFullscreen,
      player: {
        id: playerProfile.id,
        name: playerProfile.name,
        avatar: '👦',
        age: playerProfile.age,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#040716] via-[#070d24] to-[#030712] text-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />

      <PlayerAppHeader
        searchGames={playableGames}
        notificationGames={availableGames}
        onSelectGame={(game) => {
          void launchGameFromCard(game);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-3xl border border-indigo-300/25 bg-gradient-to-br from-indigo-900/75 via-[#1d2457]/80 to-slate-950/90 p-6 md:p-7 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-300/20 blur-3xl" />
            <div className="absolute left-8 bottom-2 h-24 w-24 rounded-full bg-blue-300/20 blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/30 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                <Sparkles className="h-3.5 w-3.5" />
                Espace joueur 
              </div>

              <div className="mt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                    Salut {firstName}, pret a franchir un nouveau cap ?
                  </h2>
                  <p className="mt-2 text-sm md:text-base text-indigo-100/85">
                    {motivationText}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/player/new-game')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-700 font-extrabold px-4 py-2.5 text-sm shadow-lg shadow-indigo-950/30 hover:bg-indigo-50 transition-colors"
                  >
                    <Zap className="h-4 w-4" />
                    Jouer maintenant
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/player/voice')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/40 bg-rose-500/15 text-rose-100 font-extrabold px-4 py-2.5 text-sm hover:bg-rose-500/25 transition-colors"
                  >
                    <Mic className="h-4 w-4" />
                    Atelier oral
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  <p className="text-xs text-indigo-100/80 mb-1">niveau</p>
                  <p className="text-xl font-black text-white">{niveau}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStreakDetails(true)}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left transition-all hover:border-amber-300/60 hover:bg-white/15"
                >
                  <p className="text-xs text-indigo-100/80 mb-1">Streak</p>
                  <p className="text-2xl font-black text-white inline-flex items-center gap-2">
                    {currentStreakDays}
                    <span
                      className="text-2xl leading-none drop-shadow-[0_0_10px_rgba(251,146,60,0.9)] animate-pulse"
                      role="img"
                      aria-label="Streak en feu"
                    >
                      🔥
                    </span>
                  </p>
                </button>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  <p className="text-xs text-indigo-100/80 mb-1">Jeux jouables</p>
                  <p className="text-xl font-black text-white">{totalPlayableGames}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-3xl border border-indigo-300/25 bg-gradient-to-b from-indigo-900/60 to-slate-900/90 p-5"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/25 flex items-center justify-center text-3xl">
                {isImageAvatar ? <img src={avatarValue} alt="Avatar joueur" className="w-full h-full object-cover" /> : isShortAvatarText ? avatarValue : '👦'}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-indigo-200/80">Profil joueur</p>
                <h2 className="text-lg font-black text-white truncate">{playerProfile.name}</h2>
                <p className="text-xs text-slate-300">{playerProfile.age} ans</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300">pointsExperience</span>
                <span className="font-bold text-indigo-100">{pointsExperience}/{xpToNextLevel}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-blue-300" style={{ width: `${safeXpPercentage}%` }} />
              </div>
              <p className="mt-2 text-xs text-indigo-100/80">
                Encore {xpRemaining} XP pour atteindre le niveau {niveau + 1}.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                  <span className="text-slate-300">scoreTotal</span>
                  <p className="font-bold text-white">{scoreTotal}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-amber-200/90">Record streak</p>
                <p className="mt-1 text-sm font-semibold text-amber-100">{bestStreakDays} jour(s)</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="player-games-catalog"
          className="scroll-mt-24 rounded-3xl border border-fuchsia-300/20 bg-gradient-to-b from-[#0f1438]/95 to-[#090f2b]/95 p-4 md:p-5"
        >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-white">Jeux disponibles</h2>
              <button type="button" onClick={() => navigate('/player/new-game')} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                Voir tout
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <button type="button" onClick={() => setSelectedGameType('ALL')} className={`rounded-2xl p-3 border text-left transition-all ${selectedGameType === 'ALL' ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-900/25' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
                <p className="text-sm font-bold text-white">Tous</p>
                <p className="text-xs text-slate-300">Tous les types</p>
              </button>
              {(['QUIZ', 'MEMOIRE', 'LOGIQUE', 'REFLEXE'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setSelectedGameType(type)} className={`rounded-2xl p-3 border text-left transition-all ${selectedGameType === type ? 'border-fuchsia-400 bg-fuchsia-500/20 shadow-lg shadow-fuchsia-900/25' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gameTypeMeta[type].accent} mb-2`} />
                  <p className="text-sm font-bold text-white">{gameTypeMeta[type].title}</p>
                  <p className="text-xs text-slate-300">{gameTypeMeta[type].subtitle}</p>
                </button>
              ))}
            </div>

            {gamesLoading ? (
              <div className="rounded-2xl p-6 border border-white/15 text-slate-300 bg-white/5">Chargement des jeux...</div>
            ) : filteredGamesByType.length === 0 ? (
              <div className="rounded-2xl p-6 border border-white/15 text-slate-300 bg-white/5">Aucun jeu disponible dans cette section.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {dashboardGamesPreview.map((g) => {
                  const isAllowedByAge = canPlayByAge(g);
                  return (
                    <article
                      key={g.id}
                      id={`player-game-${g.id}`}
                      className="min-w-0 rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/15 overflow-hidden transition-all duration-200 flex flex-col hover:border-cyan-300/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-900/20"
                    >
                      <div className="relative h-32 overflow-hidden">
                        {g.coverImageUrl ? (
                          <img src={g.coverImageUrl} alt={`Illustration ${formatType(g.typeJeu)}`} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-700 via-indigo-700 to-cyan-700" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2 min-h-[44px]">
                          <h3 className="font-bold text-white leading-tight line-clamp-2">{g.titre}</h3>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${difficultyClass(g.difficulte)}`}>{difficultyLabel(g.difficulte)}</span>
                        </div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                            g.modeJeu === 'EN_LIGNE'
                              ? 'bg-violet-500/20 text-violet-200 border-violet-300/40'
                              : 'bg-cyan-500/20 text-cyan-200 border-cyan-300/40'
                          }`}>
                            Mode: {g.modeJeu === 'EN_LIGNE' ? 'Solo en ligne · contre adversaires' : 'Solo'}
                          </span>
                          {g.typeJeu === 'QUIZ' && (
                            <PlayerQuizVariantChip variant={g.quizVariant ?? 'DEFAULT'} />
                          )}
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2 min-h-[44px]">{g.description || 'Jeu educatif.'}</p>
                        <div className="mt-3 text-xs text-slate-300">{g.dureeMinutes ?? 10} min • {g.ageMin ?? 7}-{g.ageMax ?? 18} ans</div>
                        <button
                          type="button"
                          onClick={() => {
                            void launchGameFromCard(g);
                          }}
                          disabled={!isAllowedByAge}
                          className={`mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold ${isAllowedByAge ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white hover:from-fuchsia-500 hover:to-cyan-400' : 'bg-white/15 text-slate-400 cursor-not-allowed'}`}
                        >
                          <Play className="w-4 h-4" />
                          {isAllowedByAge ? 'Jouer maintenant' : "Hors tranche d'age"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>

        <section className="rounded-3xl border border-indigo-300/20 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Raccourcis de progression</h3>
            <button
              type="button"
              onClick={() => navigate('/player/new-game')}
              className="rounded-xl border border-white/25 bg-white/10 text-white font-bold px-4 py-2 text-sm hover:bg-white/15 transition-colors"
            >
              Defi rapide
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {dashboardCards.map((card) => (
              <button
                key={card.title}
                onClick={card.action}
                className="w-full flex items-center gap-3 rounded-xl border border-white/15 bg-gradient-to-b from-white/10 to-white/5 px-3 py-3 text-left hover:border-indigo-300/60 hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm text-white">{card.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div whileHover={{ y: -5 }} onClick={() => navigate('/player/new-game', { state: { mode: 'Individual' } })} className="rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-900/60 to-slate-900/90 p-6 cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Mode Solo</h3>
            <p className="text-slate-300 mb-4">Progression personnelle et objectifs de performance.</p>
            <span className="text-indigo-200 font-semibold inline-flex items-center gap-2"><Play className="w-4 h-4" /> Commencer</span>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} onClick={() => navigate('/player/new-game', { state: { mode: 'Online' } })} className="rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-slate-800/80 to-indigo-950/80 p-6 cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Solo en ligne</h3>
            <p className="text-slate-300 mb-4">Affronte d’autres joueurs : chacun joue seul et le meilleur score gagne.</p>
            <span className="text-indigo-200 font-semibold inline-flex items-center gap-2"><Play className="w-4 h-4" /> Affronter des joueurs</span>
          </motion.div>
        </section>

        <div className="rounded-2xl border border-indigo-300/20 bg-gradient-to-r from-indigo-900/70 to-slate-900/90 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Star className="h-4 w-4 text-amber-300" />
            </div>
            <h3 className="text-lg font-bold text-white">Continue comme ca, {firstName} !</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Tu as une streak de {currentStreakDays} (record: {bestStreakDays}). Plus que {xpRemaining} XP pour atteindre le niveau {niveau + 1}.
          </p>
        </div>
      </div>

      {showStreakDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer le detail de streak"
            onClick={() => setShowStreakDetails(false)}
            className="absolute inset-0"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative z-10 w-full max-w-md rounded-3xl border border-amber-300/40 bg-gradient-to-b from-[#1b214d] to-[#0b102a] p-6 text-white shadow-2xl shadow-black/40"
          >
            <button
              type="button"
              onClick={() => setShowStreakDetails(false)}
              aria-label="Fermer la fenetre streak"
              className="absolute top-3 right-3 z-20 inline-flex h-10 min-w-[40px] items-center justify-center rounded-full border border-white/25 bg-white/15 px-3 text-sm font-semibold text-white shadow-md shadow-black/20 transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="text-5xl mb-1 drop-shadow-[0_0_14px_rgba(251,146,60,0.9)]">🔥</div>
              <p className="text-5xl font-black text-amber-300 leading-none">{currentStreakDays}</p>
              <p className="text-sm text-amber-100/90 mt-1">streak actuel</p>
              <p className="text-xs text-indigo-100/80 mt-2">Derniere activite: {playerProfile.lastStreakDate ?? 'aujourd hui'}</p>
            </div>

            {streakTimelineDays.length > 0 ? (
              <div className="mt-6 max-h-64 overflow-y-auto pr-1">
                <div className="grid grid-cols-7 gap-2">
                  {streakTimelineDays.map((day) => (
                    <div key={`${day.shortDate}-${day.weekday}`} className="flex flex-col items-center gap-1">
                      <span className="text-[11px] text-slate-300 capitalize">{day.weekday}</span>
                      <span className="h-7 w-7 rounded-full border bg-amber-500 border-amber-300 text-white shadow-[0_0_10px_rgba(251,146,60,0.7)] flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <span className="text-[10px] text-slate-400">{day.shortDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-slate-300">Aucune streak pour le moment.</p>
            )}

            <p className="mt-5 text-center text-xs text-slate-300">
              {isStreakTimelineTruncated
                ? `Affichage des ${maxVisibleStreakDays} derniers jours sur ${currentStreakDays} jours de streak.`
                : `Affichage complet de ta streak (${currentStreakDays} jours).`}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
