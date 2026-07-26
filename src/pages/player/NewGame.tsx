import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Users, User as UserIcon, Filter, LogIn } from 'lucide-react';
import { useAuth } from '@/context';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import { joinRoom, getRoom, MAX_ROOM_PLAYERS } from '@/services/roomService';
import type { Game } from '@/data/types';
import userApi from '@/api/user/user.api';
import type { GameDTO } from '@/api/types';
import { getQuizVariantMeta } from '@/constants/quizVariants';
import { PlayerQuizVariantChip } from '@/components/player/PlayerQuizVariant';
import { launchPlayerGame } from './utils/launchPlayerGame';

export default function NewGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { playerProfile } = useAuth();
  const modeFromState = (location.state as { mode?: 'Individual' | 'Online' } | null)?.mode;

  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<'Individual' | 'Online'>(modeFromState ?? 'Individual');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [games, setGames] = useState<Game[]>([]);

  const mapType = (typeJeu: GameDTO['typeJeu']): Game['type'] => {
    if (typeJeu === 'QUIZ') return 'quiz';
    if (typeJeu === 'MEMOIRE') return 'memory';
    if (typeJeu === 'LOGIQUE') return 'logic';
    return 'reflex';
  };

  const mapDifficulty = (difficulte: number | null | undefined): Game['difficulty'] => {
    const d = difficulte ?? 5;
    if (d <= 3) return 'Easy';
    if (d <= 6) return 'Medium';
    return 'Hard';
  };

  const toPlayerGame = (g: GameDTO): Game => ({
    id: String(g.id),
    title: g.titre,
    description: g.description || '',
    type: mapType(g.typeJeu),
    modeJeu: g.modeJeu,
    ageRange: `${g.ageMin ?? 7}-${g.ageMax ?? 18}`,
    difficulty: mapDifficulty(g.difficulte),
    estimatedTime: `${g.dureeMinutes ?? 10} min`,
    durationMinutes: g.dureeMinutes ?? 10,
    quizPlayMode: g.quizPlayMode ?? 'CLASSIC',
    quizVariant: g.quizVariant ?? 'DEFAULT',
    icon: g.icone || (g.typeJeu === 'QUIZ' ? '🧮' : g.typeJeu === 'MEMOIRE' ? '🧠' : g.typeJeu === 'LOGIQUE' ? '🎯' : '⚡'),
    coverImageUrl: g.coverImageUrl || undefined,
    active: g.actif,
  });

  useEffect(() => {
    if (modeFromState) setSelectedMode(modeFromState);
  }, [modeFromState]);

  useEffect(() => {
    let cancelled = false;
    userApi.getAvailableGames()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setGames(rows.map(toPlayerGame));
      })
      .catch(() => {
        if (!cancelled) setGames([]);
      });
    return () => { cancelled = true; };
  }, []);

  const currentPlayer = playerProfile
    ? { id: playerProfile.id, name: playerProfile.name, avatar: '👦', age: playerProfile.age }
    : { id: 'guest', name: 'Joueur', avatar: '👤', age: 12 };

  const parseAgeRange = (ageRange: string): { min: number; max: number } => {
    const [rawMin, rawMax] = ageRange.split('-').map((v) => Number(v));
    const min = Number.isFinite(rawMin) ? rawMin : 7;
    const max = Number.isFinite(rawMax) ? rawMax : 18;
    return { min, max };
  };

  const isGameAllowedForPlayerAge = (game: Game): boolean => {
    const { min, max } = parseAgeRange(game.ageRange);
    return currentPlayer.age >= min && currentPlayer.age <= max;
  };

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
      // Ignore browser/user denial and continue game launch.
    }
  };

  const handleJoinRoom = async () => {
    setJoinError('');
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setJoinError('Code invalide (min. 4 caractères)');
      return;
    }
    const room = await getRoom(code);
    if (!room) {
      setJoinError('Aucune room avec ce code');
      return;
    }
    const alreadyInRoom = room.players.some((p) => p.id === currentPlayer.id);
    if (!alreadyInRoom && room.players.length >= MAX_ROOM_PLAYERS) {
      setJoinError(`Room complète (${MAX_ROOM_PLAYERS}/${MAX_ROOM_PLAYERS})`);
      return;
    }
    const joinedRoom = await joinRoom(code, currentPlayer);
    if (!joinedRoom) {
      setJoinError(`Impossible de rejoindre la room (${MAX_ROOM_PLAYERS} joueurs max)`);
      return;
    }
    const game = games.find((g) => g.id === room.gameId);
    if (!game) {
      setJoinError('Jeu introuvable');
      return;
    }
    if (!isGameAllowedForPlayerAge(game)) {
      setJoinError(`Tu ne peux pas rejoindre ce jeu: tranche d'age ${game.ageRange} ans.`);
      return;
    }
    navigate(`/player/waiting-room/${room.gameId}?room=${code}`, {
      state: { game, mode: 'Online' as const, roomCode: code },
    });
  };

  const filteredGames = games.filter((game) => {
    if (selectedMode === 'Online' && game.modeJeu !== 'EN_LIGNE') return false;
    if (selectedMode === 'Individual' && game.modeJeu !== 'INDIVIDUEL') return false;
    if (selectedType !== 'all' && game.type !== selectedType) return false;
    if (selectedDifficulty !== 'all' && game.difficulty !== selectedDifficulty) return false;
    if (selectedAge !== 'all') {
      const [min, max] = game.ageRange.split('-').map(Number);
      const age = parseInt(selectedAge);
      if (age < min || age > max) return false;
    }
    return true;
  });

  const handlePlayGame = (game: Game) => {
    if (!isGameAllowedForPlayerAge(game)) return;
    void launchPlayerGame({
      gameId: game.id,
      gameTypeRoute: game.type,
      modeJeu: game.modeJeu,
      gamePayload: game,
      navigate,
      enterFullscreen,
      player: currentPlayer,
    });
  };

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Hard: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-10 -right-16 w-72 h-72 rounded-full bg-cyan-500/30 blur-3xl" />
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/player/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Nouvelle Partie</h1>
              <p className="text-sm text-slate-300">Choisis ton jeu et ton mode</p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 md:p-5 mb-5 border border-white/20 text-white bg-gradient-to-r from-violet-700/90 via-fuchsia-700/90 to-cyan-700/90 relative overflow-hidden"
        >
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="uppercase text-xs tracking-widest text-white/75 mb-1">Experience Hub</p>
              <h2 className="text-xl md:text-2xl font-extrabold mb-1">Choisis ton prochain défi</h2>
              <p className="text-white/90 text-xs md:text-sm">Sélectionne un jeu adapté à ton profil et maximise ta progression.</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-white/15 border border-white/25 text-xs font-semibold">
                Mode: {selectedMode === 'Individual' ? 'Solo' : 'Solo en ligne'}
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/15 border border-white/25 text-xs font-semibold">
                Jeux: {filteredGames.length}
              </div>
            </div>
          </div>
        </motion.div>
        {/* Mode en ligne : adversaires jouant chacun en solo */}
        {selectedMode === 'Online' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/15 rounded-2xl p-5 mb-6 backdrop-blur-xl"
          >
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              Solo en ligne compétitif
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/15">
                <h3 className="font-bold text-white mb-2">Créer une room</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Choisis un jeu puis clique sur <strong>Play</strong>. Une room sera créée avec un <strong>code</strong> à partager avec tes adversaires. Chacun joue seul et le meilleur score gagne.
                </p>
                <p className="text-xs text-violet-600 font-medium">↓ Choisis un jeu plus bas puis clique sur Play</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/15">
                <h3 className="font-bold text-white mb-2">Rejoindre une room</h3>
                <p className="text-sm text-slate-300 mb-3">Tu as reçu un code ? Saisis-le ici pour rejoindre la room.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                    placeholder="Ex: ABC123"
                    maxLength={6}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 uppercase"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoinRoom}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Rejoindre
                  </motion.button>
                </div>
                {joinError && <p className="mt-1 text-sm text-red-600">{joinError}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-4 border border-white/15 mb-5 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-200" />
            <h2 className="text-lg font-bold text-white">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Age Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Tranche d'age</label>
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              >
                <option className="bg-white text-slate-900" value="all">All Ages</option>
                <option className="bg-white text-slate-900" value="7">7-9 years</option>
                <option className="bg-white text-slate-900" value="10">10-12 years</option>
                <option className="bg-white text-slate-900" value="13">13-15 years</option>
                <option className="bg-white text-slate-900" value="16">16-18 years</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Difficulté</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              >
                <option className="bg-white text-slate-900" value="all">All Levels</option>
                <option className="bg-white text-slate-900" value="Easy">Easy</option>
                <option className="bg-white text-slate-900" value="Medium">Medium</option>
                <option className="bg-white text-slate-900" value="Hard">Hard</option>
              </select>
            </div>

            {/* Game Type Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Type de jeu</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              >
                <option className="bg-white text-slate-900" value="all">All Types</option>
                <option className="bg-white text-slate-900" value="quiz">Quiz</option>
                <option className="bg-white text-slate-900" value="memory">Memory</option>
                <option className="bg-white text-slate-900" value="logic">Logic</option>
                <option className="bg-white text-slate-900" value="reflex">Reflex</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Mode</label>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMode('Individual')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMode === 'Individual'
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Solo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMode('Online')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMode === 'Online'
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Solo en ligne
                </motion.button>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-slate-300">
            Affichage de <span className="font-bold text-violet-600">{filteredGames.length}</span> jeu
            {filteredGames.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game, index) => {
            const ageAllowed = isGameAllowedForPlayerAge(game);
            return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -8 }}
              className="bg-white/5 rounded-xl border border-white/15 transition-all overflow-hidden hover:border-fuchsia-400/60 backdrop-blur-xl"
            >
              <div className="relative h-28 overflow-hidden">
                {game.coverImageUrl ? (
                  <img
                    src={game.coverImageUrl}
                    alt={`Cover ${game.title}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center">
                    <span className="text-7xl">{game.icon}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/35 border border-white/30 text-[10px] text-white font-semibold uppercase tracking-wide">
                  {game.type}
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/35 border border-white/30 flex items-center justify-center text-lg">
                  {game.icon}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex-1 line-clamp-2">{game.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColors[game.difficulty]}`}>
                    {game.difficulty}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                    game.modeJeu === 'EN_LIGNE'
                      ? 'bg-violet-500/20 text-violet-200 border-violet-300/40'
                      : 'bg-cyan-500/20 text-cyan-200 border-cyan-300/40'
                  }`}>
                    Mode: {game.modeJeu === 'EN_LIGNE' ? 'Solo en ligne · contre adversaires' : 'Solo'}
                  </span>
                  {game.type === 'quiz' && (
                    <PlayerQuizVariantChip variant={game.quizVariant ?? 'DEFAULT'} />
                  )}
                </div>
                <p className="text-slate-300 text-sm mb-3 line-clamp-2 min-h-[36px]">{game.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-300 mb-3">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{game.ageRange} years</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{game.estimatedTime}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlayGame(game)}
                  disabled={!ageAllowed}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                    ageAllowed
                      ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500'
                      : 'bg-white/15 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-5 h-5" />
                  {ageAllowed ? 'Play Now' : 'Tranche d\'age non compatible'}
                </motion.button>
                {!ageAllowed && (
                  <p className="mt-2 text-xs text-rose-600">
                    Ton age ({currentPlayer.age} ans) ne correspond pas a ce jeu ({game.ageRange} ans).
                  </p>
                )}
              </div>
            </motion.div>
          )})}
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-2xl p-12 text-center border border-white/15"
          >
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-2xl font-bold text-white mb-2">Aucun jeu trouvé</h3>
            <p className="text-slate-300 mb-6">Modifie les filtres pour afficher plus de jeux.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedAge('all');
                setSelectedDifficulty('all');
                setSelectedType('all');
              }}
              className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              Réinitialiser les filtres
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
