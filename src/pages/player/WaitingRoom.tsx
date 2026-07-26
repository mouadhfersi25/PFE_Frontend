import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, Check, Clock, Copy, Link2 } from 'lucide-react';
import { useAuth } from '@/context';
import { useAdminData } from '@/context';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import { PlayerQuizVariantChip } from '@/components/player/PlayerQuizVariant';
import {
  getRoom,
  joinRoom,
  setPlayerReady,
  setRoomStarted,
  subscribeRoom,
  getShareLink,
  MAX_ROOM_PLAYERS,
  type Room,
  type RoomPlayer,
} from '@/services/roomService';
import { toast } from 'sonner';

export default function WaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const { playerProfile } = useAuth();
  const { games } = useAdminData();

  const { game: gameFromState, roomCode: roomCodeFromState } = (location.state || {}) as {
    game?: {
      id: string;
      title: string;
      description: string;
      icon: string;
      type: string;
      estimatedTime: string;
      durationMinutes?: number;
      modeJeu?: 'INDIVIDUEL' | 'EN_LIGNE';
      quizVariant?: string;
      quizPlayMode?: string;
    };
    mode?: string;
    roomCode?: string;
  };

  const roomCodeFromUrl = searchParams.get('room')?.toUpperCase() || roomCodeFromState;
  const game = gameFromState || games.find((g) => g.id === gameId);

  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const currentPlayerId = String(playerProfile?.id ?? 'guest');
  const currentPlayerName = playerProfile?.name ?? 'Joueur';
  const isHost = room?.players.some((p) => p.id === currentPlayerId && p.isHost) ?? false;
  const myPlayer = room?.players.find((p) => p.id === currentPlayerId);
  const allReady = (room?.players.length && room.players.every((p) => p.ready)) ?? false;
  const hasEnoughPlayers = (room?.players.length ?? 0) >= 2;

  const refreshRoom = async () => {
    if (!roomCodeFromUrl) return;
    const r = await getRoom(roomCodeFromUrl);
    setRoom(r);
  };

  useEffect(() => {
    if (!roomCodeFromUrl || !gameId) return;
    let cancelled = false;
    const bootstrap = async () => {
      const r = await getRoom(roomCodeFromUrl);
      if (!r) {
        toast.error('Room introuvable');
        navigate('/player/new-game', { state: { mode: 'Online' } });
        return;
      }
      const joinedRoom = await joinRoom(roomCodeFromUrl, {
        id: currentPlayerId,
        name: currentPlayerName,
        avatar: '👤',
        age: playerProfile?.age,
      });
      if (!joinedRoom) {
        toast.error(`Room complète (${MAX_ROOM_PLAYERS} joueurs max)`);
        navigate('/player/new-game', { state: { mode: 'Online' } });
        return;
      }
      if (!cancelled) setRoom(joinedRoom);
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [roomCodeFromUrl, gameId, currentPlayerId, currentPlayerName, navigate, playerProfile?.age]);

  useEffect(() => {
    if (!game) return;
    if (game.modeJeu === 'INDIVIDUEL') {
      toast.error("Ce jeu est en mode solo uniquement");
      navigate('/player/new-game', { state: { mode: 'Individual' } });
    }
  }, [game, navigate]);

  useEffect(() => {
    if (!roomCodeFromUrl) return;
    const unsubscribe = subscribeRoom(
      roomCodeFromUrl,
      (nextRoom) => setRoom(nextRoom),
      () => toast.error('Connexion temps réel interrompue')
    );
    return () => unsubscribe();
  }, [roomCodeFromUrl]);

  useEffect(() => {
    if (!room?.startedAt) return;
    setCountdown(3);
  }, [room?.startedAt]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (countdown !== 0 || !game) return;
    navigate(`/player/game/${game.type}/${gameId}`, {
      state: {
        game,
        mode: 'Online',
        roomCode: roomCodeFromUrl,
      },
    });
  }, [countdown, game, gameId, roomCodeFromUrl, navigate]);

  const handleReady = async () => {
    if (!roomCodeFromUrl) return;
    const updated = await setPlayerReady(roomCodeFromUrl, currentPlayerId, true);
    if (updated) setRoom(updated);
  };

  const handleStart = async () => {
    if (!roomCodeFromUrl || !isHost) return;
    const result = await setRoomStarted(roomCodeFromUrl, currentPlayerId);
    if (!result.ok) {
      if (result.reason === 'NOT_ALL_READY') toast.error("Tous les joueurs doivent être prêts");
      else if (result.reason === 'MIN_ONLINE_PLAYERS_REQUIRED') toast.error("Il faut au moins 2 adversaires pour lancer la partie");
      else if (result.reason === 'HOST_ONLY') toast.error("Seul l'hôte peut démarrer");
      else toast.error("Room invalide ou expirée");
      return;
    }
    setCountdown(3);
    await refreshRoom();
  };

  const shareLink = roomCodeFromUrl ? getShareLink(gameId!, roomCodeFromUrl) : '';
  const copyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    toast.success('Lien copié ! Partage-le pour inviter des joueurs.');
  };

  if (!game) {
    navigate('/player/new-game');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/player/new-game')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">Salle d’attente</h1>
              <p className="text-sm text-slate-300">Solo en ligne · contre adversaires — {game.title}</p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="text-white text-9xl font-bold"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}

        {/* Code + partage */}
        {roomCodeFromUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/15 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-white">Code de la room</h3>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-3xl font-mono font-bold tracking-widest text-purple-600 bg-purple-50 px-4 py-2 rounded-xl">
                {roomCodeFromUrl}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium"
              >
                <Copy className="w-4 h-4" />
                Copier le lien
              </motion.button>
            </div>
            <p className="text-sm text-slate-300 mt-2">
              Envoie ce code ou le lien à tes adversaires pour qu’ils rejoignent la room.
            </p>
          </motion.div>
        )}

        {/* Game Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/15 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center text-5xl">
              {game.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{game.title}</h2>
                {game.type === 'quiz' && (
                  <PlayerQuizVariantChip variant={game.quizVariant ?? 'DEFAULT'} />
                )}
              </div>
              <p className="text-slate-300">{game.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-300 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{game.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4" />
                <span className="text-sm">{room?.players.length ?? 0} / {MAX_ROOM_PLAYERS} joueur(s)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Adversaires */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/15 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-slate-200" />
            <h3 className="text-xl font-bold text-white">Joueurs dans la room</h3>
            <span className="ml-auto text-sm text-slate-300">
              {room?.players.filter((p) => p.ready).length ?? 0} / {room?.players.length ?? 0} prêts
            </span>
          </div>

          <div className="space-y-4">
            {(room?.players ?? []).map((member: RoomPlayer, index: number) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                  member.ready ? 'bg-green-500/15 border-green-300/40' : 'bg-white/5 border-white/20'
                } ${member.id === currentPlayerId ? 'ring-2 ring-purple-400' : ''}`}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center text-3xl">
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">
                    {member.name}
                    {member.isHost && (
                      <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                        Hôte
                      </span>
                    )}
                    {member.id === currentPlayerId && (
                      <span className="ml-2 text-xs font-normal text-slate-300">(toi)</span>
                    )}
                  </h4>
                  {member.age != null && <p className="text-sm text-slate-300">{member.age} ans</p>}
                </div>
                {member.ready ? (
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <Check className="w-5 h-5" />
                    Prêt
                  </div>
                ) : (
                  <div className="text-slate-300 font-semibold">En attente...</div>
                )}
              </motion.div>
            ))}
          </div>

          {(!room?.players?.length || room.players.length === 0) && (
            <p className="text-slate-300 text-center py-4">Aucun joueur pour l’instant. Partage le code ou le lien.</p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4"
        >
          {!myPlayer?.ready ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReady}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              <Check className="w-6 h-6" />
              Je suis prêt !
            </motion.button>
          ) : allReady && hasEnoughPlayers && isHost ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              Lancer la partie
            </motion.button>
          ) : (
            <div className="flex-1 bg-white/10 text-slate-200 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 border border-white/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Clock className="w-6 h-6" />
              </motion.div>
              {!hasEnoughPlayers
                ? 'En attente d’un adversaire…'
                : isHost
                  ? 'En attente que tout le monde soit prêt...'
                  : 'En attente du démarrage par l’hôte...'}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
