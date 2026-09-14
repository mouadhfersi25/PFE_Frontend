import type { GameDTO } from '@/api/types';

/**
 * Miroir front-end de EducatorGameEditPolicy.requireDraft (backend) : détermine si l'éducateur
 * peut modifier le contenu pédagogique d'un jeu (questions, cartes mémoire, puzzles, réflexe).
 *
 * - BROUILLON / REFUSE : toujours modifiable.
 * - ACCEPTE mais désactivé par l'admin (suite à signalement, actif=false) : modifiable le temps
 *   que l'éducateur corrige, tant qu'une demande de réactivation n'est pas déjà en cours.
 * - Tout le reste (EN_ATTENTE, ACCEPTE actif, ou réactivation en attente) : verrouillé.
 */
export function canEditGameContent(
  game: Pick<GameDTO, 'etat' | 'actif' | 'reactivationPending'> | null | undefined
): boolean {
  if (!game) return false;
  if (game.etat === 'BROUILLON' || game.etat === 'REFUSE') return true;
  return game.etat === 'ACCEPTE' && !game.actif && !game.reactivationPending;
}
