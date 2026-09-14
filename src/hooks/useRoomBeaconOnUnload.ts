import { useEffect } from 'react';
import { leaveRoomBeacon, forfeitRoomBeacon } from '@/services/roomService';

/**
 * Détecte la fermeture de l'onglet/navigateur (ou un rechargement) pendant qu'un joueur est
 * dans une salle multijoueur, et prévient le serveur via `navigator.sendBeacon` (fiable même
 * pendant le déchargement de la page, contrairement à un appel réseau classique).
 *
 * - kind: 'leave'   → salle d'attente (avant le début de la partie) : le joueur est retiré de
 *   la salle, un autre membre est promu hôte si besoin.
 * - kind: 'forfeit' → partie déjà démarrée : le joueur reste visible dans le classement final,
 *   marqué comme ayant abandonné, pour que l'adversaire restant soit déclaré vainqueur
 *   immédiatement plutôt que d'attendre le délai de sécurité.
 *
 * N'a aucun effet sur la navigation interne (SPA) : `beforeunload`/`pagehide` ne se déclenchent
 * que sur une vraie fermeture/rechargement de page, jamais sur un `navigate()` de react-router.
 */
export function useRoomBeaconOnUnload(
  active: boolean,
  roomCode: string | null | undefined,
  kind: 'leave' | 'forfeit'
) {
  useEffect(() => {
    if (!active || !roomCode) return;

    const handleUnload = () => {
      if (kind === 'forfeit') forfeitRoomBeacon(roomCode);
      else leaveRoomBeacon(roomCode);
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [active, roomCode, kind]);
}
