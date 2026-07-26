import { createRoom } from '@/services/roomService';

type NavigateFn = (to: string, options?: { state?: unknown }) => void;

interface LaunchPlayerGameParams {
  gameId: string | number;
  gameTypeRoute: string;
  modeJeu?: 'INDIVIDUEL' | 'EN_LIGNE';
  gamePayload: unknown;
  navigate: NavigateFn;
  enterFullscreen?: () => Promise<void> | void;
  player?: { id: string; name: string; avatar?: string; age?: number };
}

export async function launchPlayerGame(params: LaunchPlayerGameParams): Promise<void> {
  const {
    gameId,
    gameTypeRoute,
    modeJeu,
    gamePayload,
    navigate,
    enterFullscreen,
    player,
  } = params;

  if (enterFullscreen) await enterFullscreen();

  if (modeJeu === 'EN_LIGNE') {
    const safePlayer = player ?? { id: 'guest', name: 'Joueur', avatar: '👤' };
    const roomCode = await createRoom(String(gameId), safePlayer);
    navigate(`/player/waiting-room/${gameId}?room=${roomCode}`, {
      state: {
        game: gamePayload,
        mode: 'Online',
        roomCode,
      },
    });
    return;
  }

  navigate(`/player/game/${gameTypeRoute}/${gameId}`, {
    state: {
      game: gamePayload,
      mode: 'Individual',
    },
  });
}
