import type { GameDTO } from '@/api/types';

/** Liste « Mes jeux » : afficher tous les jeux de l'éducateur, tous états confondus. */
export function filterGamesForManageList(games: GameDTO[]): GameDTO[] {
  return games;
}
