import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import userApi from '@/api/user/user.api';
import storage from '@/utils/storage';
import type {
  RealtimeRoomPlayerDTO,
  RealtimeRoomStateDTO,
  CompetitiveRoomResultDTO,
} from '@/api/types/api.types';
import { ENV } from '@/config/env';

export const MAX_ROOM_PLAYERS = 4;

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  age?: number;
  ready: boolean;
  isHost: boolean;
}

export interface Room {
  roomCode: string;
  gameId: string;
  players: RoomPlayer[];
  createdAt: number;
  startedAt?: number;
}

export interface RoomStartResult {
  ok: boolean;
  reason?:
    | 'ROOM_NOT_FOUND'
    | 'STALE_ROOM'
    | 'HOST_ONLY'
    | 'NOT_ALL_READY'
    | 'ROOM_FULL'
    | 'MIN_ONLINE_PLAYERS_REQUIRED'
    | 'ROOM_ALREADY_STARTED';
}

let stompClient: Client | null = null;
let activeSubscription: { roomCode: string; unsubscribe: () => void } | null = null;
const resultSubscriptions = new Map<string, () => void>();

function mapPlayer(p: RealtimeRoomPlayerDTO): RoomPlayer {
  return {
    id: String(p.id),
    name: p.name,
    avatar: p.avatar,
    age: p.age ?? undefined,
    ready: Boolean(p.ready),
    isHost: Boolean(p.host),
  };
}

function mapRoom(dto: RealtimeRoomStateDTO): Room {
  return {
    roomCode: dto.roomCode,
    gameId: String(dto.gameId),
    players: Array.isArray(dto.players) ? dto.players.map(mapPlayer) : [],
    createdAt: dto.createdAt,
    startedAt: dto.startedAt ?? undefined,
  };
}

function resolveWsBaseUrl(): string {
  const apiUrl = ENV.API_URL || 'http://localhost:8081/api';
  if (apiUrl.endsWith('/api')) return apiUrl.slice(0, -4);
  return apiUrl;
}

function parseRoomError(err: unknown): RoomStartResult['reason'] {
  const message =
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err as Error)?.message ||
    '';
  if (message.includes('ROOM_FULL')) return 'ROOM_FULL';
  if (message.includes('HOST_ONLY')) return 'HOST_ONLY';
  if (message.includes('NOT_ALL_READY')) return 'NOT_ALL_READY';
  if (message.includes('MIN_ONLINE_PLAYERS_REQUIRED')) return 'MIN_ONLINE_PLAYERS_REQUIRED';
  if (message.includes('ROOM_ALREADY_STARTED')) return 'ROOM_ALREADY_STARTED';
  if (message.includes('STALE_ROOM')) return 'STALE_ROOM';
  if (message.includes('ROOM_NOT_FOUND')) return 'ROOM_NOT_FOUND';
  return undefined;
}

export async function createRoom(
  gameId: string,
  _player: { id: string; name: string; avatar?: string; age?: number }
): Promise<string> {
  const response = await userApi.createRoom({
    gameId: Number(gameId),
  });
  return String(response.data.roomCode);
}

export async function getRoom(code: string): Promise<Room | null> {
  if (!code) return null;
  try {
    const response = await userApi.getRoom(code.toUpperCase());
    return mapRoom(response.data);
  } catch {
    return null;
  }
}

/** Salles en ligne ouvertes (pas encore démarrées, pas encore pleines) que n'importe
 * quel joueur connecté peut voir et rejoindre — optionnellement filtrées sur un jeu. */
export async function listAvailableRooms(gameId?: string): Promise<Room[]> {
  try {
    const response = await userApi.listAvailableRooms(gameId ? Number(gameId) : undefined);
    return Array.isArray(response.data) ? response.data.map(mapRoom) : [];
  } catch {
    return [];
  }
}

export async function joinRoom(
  code: string,
  _player: { id: string; name: string; avatar?: string; age?: number }
): Promise<Room | null> {
  try {
    const response = await userApi.joinRoom({ roomCode: code.toUpperCase() });
    return mapRoom(response.data);
  } catch {
    return null;
  }
}

export async function setPlayerReady(code: string, _playerId: string, ready: boolean): Promise<Room | null> {
  try {
    const response = await userApi.setRoomReady(code.toUpperCase(), ready);
    return mapRoom(response.data);
  } catch {
    return null;
  }
}

export async function setRoomStarted(code: string, _requesterId: string): Promise<RoomStartResult> {
  try {
    await userApi.startRoom(code.toUpperCase());
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: parseRoomError(err) };
  }
}

/** Quitte la salle — symétrique de joinRoom. Si l'hôte part, un autre membre est promu hôte. */
export async function leaveRoom(code: string): Promise<boolean> {
  if (!code) return false;
  try {
    await userApi.leaveRoom(code.toUpperCase());
    return true;
  } catch {
    return false;
  }
}

/** Abandon en cours de partie : contrairement à leaveRoom, le joueur reste visible dans le
 * classement final avec le statut "abandonné" au lieu de disparaître de la salle. */
export async function forfeitRoom(code: string): Promise<boolean> {
  if (!code) return false;
  try {
    await userApi.forfeitRoom(code.toUpperCase());
    return true;
  } catch {
    return false;
  }
}

/**
 * Variantes "beacon" de leaveRoom/forfeitRoom, à utiliser sur les événements de fermeture de
 * page (`beforeunload`/`pagehide`) : navigator.sendBeacon envoie la requête de façon fiable
 * même pendant que la page se décharge, contrairement à un appel axios classique qui serait
 * annulé. En contrepartie, sendBeacon ne permet pas d'en-tête Authorization personnalisé — le
 * jeton est donc passé en paramètre de requête (le backend l'accepte en repli, voir JwtFilter).
 */
function sendRoomBeacon(action: 'leave' | 'forfeit', code: string): void {
  if (!code || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
  const token = storage.get('jwt_token');
  if (!token) return;
  const apiBase = (ENV.API_URL || 'http://localhost:8081/api').replace(/\/+$/, '');
  const url = `${apiBase}/users/rooms/${code.toUpperCase()}/${action}?token=${encodeURIComponent(token)}`;
  try {
    navigator.sendBeacon(url);
  } catch {
    // Best-effort uniquement : rien à faire si le navigateur refuse l'appel.
  }
}

/** À utiliser avant le début de la partie (salle d'attente) : ferme l'onglet = quitte la salle. */
export function leaveRoomBeacon(code: string): void {
  sendRoomBeacon('leave', code);
}

/** À utiliser pendant une partie en cours : ferme l'onglet = abandon (forfait). */
export function forfeitRoomBeacon(code: string): void {
  sendRoomBeacon('forfeit', code);
}

export function subscribeRoom(
  roomCode: string,
  onRoomState: (room: Room) => void,
  onError?: (error: string) => void
): () => void {
  const token = storage.get('jwt_token');
  if (!token) {
    onError?.('Missing auth token');
    return () => {};
  }

  const wsBase = resolveWsBaseUrl();
  if (!stompClient || !stompClient.active) {
    stompClient = new Client({
      reconnectDelay: 2500,
      connectHeaders: { Authorization: `Bearer ${token}` },
      webSocketFactory: () => new SockJS(`${wsBase}/ws`),
      debug: () => undefined,
      onStompError: (frame) => {
        onError?.(frame.body || 'WebSocket STOMP error');
      },
    });
    stompClient.activate();
  }

  const subscribeNow = () => {
    if (!stompClient) return;
    if (activeSubscription?.roomCode === roomCode) return;
    if (activeSubscription) {
      activeSubscription.unsubscribe();
      activeSubscription = null;
    }
    const subscription = stompClient.subscribe(`/topic/rooms/${roomCode}`, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body) as RealtimeRoomStateDTO;
        onRoomState(mapRoom(payload));
      } catch {
        onError?.('Invalid room payload');
      }
    });
    activeSubscription = {
      roomCode,
      unsubscribe: () => subscription.unsubscribe(),
    };
  };

  if (stompClient.connected) {
    subscribeNow();
  } else {
    const prevOnConnect = stompClient.onConnect;
    stompClient.onConnect = (frame) => {
      prevOnConnect?.(frame);
      subscribeNow();
    };
  }

  return () => {
    if (activeSubscription?.roomCode === roomCode) {
      activeSubscription.unsubscribe();
      activeSubscription = null;
    }
  };
}

/** Synchronise le classement de la room pendant que les adversaires terminent. */
export function subscribeCompetitiveResult(
  roomCode: string,
  onResult: (result: CompetitiveRoomResultDTO) => void,
  onError?: (error: string) => void
): () => void {
  let disposed = false;
  const normalizedRoomCode = roomCode.trim().toUpperCase();
  const token = storage.get('jwt_token');
  if (!token || !normalizedRoomCode) {
    onError?.('Missing room or auth token');
    return () => {};
  }

  const wsBase = resolveWsBaseUrl();
  if (!stompClient || !stompClient.active) {
    stompClient = new Client({
      reconnectDelay: 2500,
      connectHeaders: { Authorization: `Bearer ${token}` },
      webSocketFactory: () => new SockJS(`${wsBase}/ws`),
      debug: () => undefined,
      onStompError: (frame) => onError?.(frame.body || 'WebSocket STOMP error'),
    });
    stompClient.activate();
  }

  const subscribeNow = () => {
    if (disposed || !stompClient || resultSubscriptions.has(normalizedRoomCode)) return;
    const subscription = stompClient.subscribe(
      `/topic/rooms/${normalizedRoomCode}/results`,
      (message: IMessage) => {
        try {
          onResult(JSON.parse(message.body) as CompetitiveRoomResultDTO);
        } catch {
          onError?.('Invalid competitive result payload');
        }
      }
    );
    resultSubscriptions.set(normalizedRoomCode, () => subscription.unsubscribe());
  };

  if (stompClient.connected) {
    subscribeNow();
  } else {
    const previousOnConnect = stompClient.onConnect;
    stompClient.onConnect = (frame) => {
      previousOnConnect?.(frame);
      subscribeNow();
    };
  }

  return () => {
    disposed = true;
    const unsubscribe = resultSubscriptions.get(normalizedRoomCode);
    unsubscribe?.();
    resultSubscriptions.delete(normalizedRoomCode);
  };
}

/** Lien de partage pour rejoindre la room (à afficher / copier). */
export function getShareLink(gameId: string, roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const path = `/player/waiting-room/${gameId}?room=${roomCode}`;
  return window.location.origin + path;
}
