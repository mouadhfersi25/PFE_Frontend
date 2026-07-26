import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userApi from '@/api/user/user.api';
import type { GameDTO } from '@/api/types/api.types';
import storage from '@/utils/storage';
import { useAuth } from '@/context';

export type PlayerNotificationKind = 'badge' | 'reward' | 'new_game';

export interface PlayerNotificationItem {
  id: string;
  kind: PlayerNotificationKind;
  title: string;
  message: string;
  createdAt: number;
}

function seenGamesKey(playerId: string) {
  return `player_seen_games_${playerId}`;
}

function readSeenGameIds(playerId: string): Set<string> {
  const raw = storage.get(seenGamesKey(playerId));
  if (!raw) return new Set();
  return new Set(raw.split(',').map((v) => v.trim()).filter(Boolean));
}

function writeSeenGameIds(playerId: string, ids: Set<string>) {
  storage.set(seenGamesKey(playerId), Array.from(ids).join(','));
}

export function usePlayerNotifications(games: GameDTO[] = []) {
  const navigate = useNavigate();
  const { playerProfile } = useAuth();
  const playerId = playerProfile?.id != null ? String(playerProfile.id) : '';

  const [claimableBadges, setClaimableBadges] = useState<{ id: number; nom: string }[]>([]);
  const [claimableRewards, setClaimableRewards] = useState<{ id: number; nom: string }[]>([]);
  const [seenGameIds, setSeenGameIds] = useState<Set<string>>(() =>
    playerId ? readSeenGameIds(playerId) : new Set()
  );

  const refresh = useCallback(() => {
    Promise.all([
      userApi.getBadgesOverview().catch(() => null),
      userApi.getRewardsOverview().catch(() => null),
    ]).then(([badgesRes, rewardsRes]) => {
      const badges = badgesRes?.data?.badges ?? [];
      setClaimableBadges(
        badges.filter((b) => b.claimable).map((b) => ({ id: b.id, nom: b.nom }))
      );
      const rewards = rewardsRes?.data?.rewards ?? [];
      setClaimableRewards(
        rewards.filter((r) => r.claimable && !r.claimed).map((r) => ({ id: r.id, nom: r.nom }))
      );
    });
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!playerId) return;
    setSeenGameIds(readSeenGameIds(playerId));
  }, [playerId]);

  const markGameSeen = useCallback(
    (gameId: number) => {
      if (!playerId) return;
      setSeenGameIds((prev) => {
        const next = new Set(prev);
        next.add(String(gameId));
        writeSeenGameIds(playerId, next);
        return next;
      });
    },
    [playerId]
  );

  const markAllGamesSeen = useCallback(() => {
    if (!playerId) return;
    const next = new Set(games.map((g) => String(g.id)));
    setSeenGameIds(next);
    writeSeenGameIds(playerId, next);
  }, [games, playerId]);

  const notifications = useMemo<PlayerNotificationItem[]>(() => {
    const items: PlayerNotificationItem[] = [];

    claimableBadges.forEach((b) => {
      items.push({
        id: `badge-${b.id}`,
        kind: 'badge',
        title: 'Badge à réclamer',
        message: b.nom,
        createdAt: 3,
      });
    });

    claimableRewards.forEach((r) => {
      items.push({
        id: `reward-${r.id}`,
        kind: 'reward',
        title: 'Récompense disponible',
        message: r.nom,
        createdAt: 2,
      });
    });

    games.forEach((g) => {
      if (seenGameIds.has(String(g.id))) return;
      items.push({
        id: `game-${g.id}`,
        kind: 'new_game',
        title: 'Nouveau jeu',
        message: g.titre,
        createdAt: 1,
      });
    });

    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [claimableBadges, claimableRewards, games, seenGameIds]);

  const handleNotificationClick = useCallback(
    (item: PlayerNotificationItem) => {
      if (item.kind === 'badge') {
        navigate('/player/badges');
        return;
      }
      if (item.kind === 'reward') {
        navigate('/player/rewards');
        return;
      }
      if (item.kind === 'new_game') {
        const gameId = Number(item.id.replace('game-', ''));
        if (Number.isFinite(gameId)) markGameSeen(gameId);
        navigate('/player/dashboard', { state: { highlightGameId: gameId } });
      }
    },
    [markGameSeen, navigate]
  );

  return {
    notifications,
    unreadCount: notifications.length,
    markGameSeen,
    markAllGamesSeen,
    refresh,
    handleNotificationClick,
  };
}
