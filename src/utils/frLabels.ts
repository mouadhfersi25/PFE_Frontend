/** Libellés français partagés pour l’UI (difficulté, type de jeu, statut, enums). */

export const DIFFICULTY_FR: Record<string, string> = {
  Easy: 'Facile',
  Medium: 'Moyen',
  Hard: 'Difficile',
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
  Facile: 'Facile',
  Moyen: 'Moyen',
  Difficile: 'Difficile',
};

export const GAME_TYPE_FR: Record<string, string> = {
  Memory: 'Mémoire',
  Logic: 'Logique',
  Reflex: 'Réflexe',
  Quiz: 'Quiz',
  MEMORY: 'Mémoire',
  LOGIC: 'Logique',
  REFLEX: 'Réflexe',
  MEMOIRE: 'Mémoire',
  LOGIQUE: 'Logique',
  REFLEXE: 'Réflexe',
  QUIZ: 'Quiz',
  Mémoire: 'Mémoire',
  Logique: 'Logique',
  Réflexe: 'Réflexe',
};

export const STATUS_FR: Record<string, string> = {
  Active: 'Actif',
  Inactive: 'Inactif',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  Pending: 'En attente',
  PENDING: 'En attente',
  Approved: 'Approuvé',
  APPROVED: 'Approuvé',
  Rejected: 'Refusé',
  REJECTED: 'Refusé',
  EN_ATTENTE: 'En attente',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  PAUSED: 'En pause',
};

export const MODE_JEU_FR: Record<string, string> = {
  INDIVIDUEL: 'Solo',
  EN_LIGNE: 'Multijoueur',
  Individual: 'Solo',
  Online: 'Multijoueur',
};

export const REFLEX_MODEL_FR: Record<string, string> = {
  CLASSIC: 'Classique',
  GO_NO_GO: 'Aller / Ne pas aller',
  CHOICE_REACTION: 'Réaction à choix',
  STROOP_INVERSE: 'Stroop inversé',
};

export const REFLEX_STIMULI_FR: Record<string, string> = {
  ICON: 'Icône',
  COLOR_FLASH: 'Flash de couleur',
  COLOR: 'Couleur',
  SHAPE: 'Forme',
  SOUND: 'Son',
};

export function difficultyFr(value?: string | null): string {
  if (!value) return '';
  return DIFFICULTY_FR[value] ?? value;
}

export function gameTypeFr(value?: string | null): string {
  if (!value) return '';
  return GAME_TYPE_FR[value] ?? value;
}

export function statusFr(value?: string | null): string {
  if (!value) return '';
  return STATUS_FR[value] ?? value;
}

/** Couleurs UI cohérentes (bleu / gris) pour types de jeux. */
export const GAME_TYPE_COLOR: Record<string, string> = {
  QUIZ: '#3b82f6',
  Quiz: '#3b82f6',
  quiz: '#3b82f6',
  MEMOIRE: '#60a5fa',
  Mémoire: '#60a5fa',
  Memory: '#60a5fa',
  memory: '#60a5fa',
  REFLEXE: '#93c5fd',
  Réflexe: '#93c5fd',
  Reflex: '#93c5fd',
  reflex: '#93c5fd',
  LOGIQUE: '#1d4ed8',
  Logique: '#1d4ed8',
  Logic: '#1d4ed8',
  logic: '#1d4ed8',
};

export function gameTypeColor(value?: string | null): string {
  if (!value) return '#64748b';
  return GAME_TYPE_COLOR[value] ?? GAME_TYPE_COLOR[value.toUpperCase()] ?? '#64748b';
}

/** Palette bleu claire pour difficulté. */
export const DIFFICULTY_COLOR: Record<string, string> = {
  Facile: '#93c5fd',
  Moyen: '#3b82f6',
  Difficile: '#1e40af',
  Easy: '#93c5fd',
  Medium: '#3b82f6',
  Hard: '#1e40af',
  EASY: '#93c5fd',
  MEDIUM: '#3b82f6',
  HARD: '#1e40af',
};

export function difficultyColor(value?: string | null): string {
  if (!value) return '#64748b';
  return DIFFICULTY_COLOR[value] ?? '#64748b';
}

/** Libellé français pour enums / codes API affichés à l’écran. */
export function enumLabelFr(value?: string | null): string {
  if (!value) return '—';
  const key = value.trim();
  return (
    GAME_TYPE_FR[key] ??
    MODE_JEU_FR[key] ??
    STATUS_FR[key] ??
    REFLEX_MODEL_FR[key] ??
    REFLEX_STIMULI_FR[key] ??
    DIFFICULTY_FR[key] ??
    key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  );
}
