/** Plafonds de score par type (alignés sur le backend ScoreCalculatorService / UserService). */
const MAX_SCORE_BY_TYPE: Record<string, number> = {
  QUIZ: 400,
  MEMOIRE: 350,
  LOGIQUE: 300,
  REFLEXE: 300,
};

const ROUTE_TYPE_TO_DB: Record<string, string> = {
  QUIZ: 'QUIZ',
  MEMORY: 'MEMOIRE',
  MEMOIRE: 'MEMOIRE',
  LOGIC: 'LOGIQUE',
  LOGIQUE: 'LOGIQUE',
  REFLEX: 'REFLEXE',
  REFLEXE: 'REFLEXE',
};

export function resolveGameMaxScore(game?: { type?: string; typeJeu?: string } | null): number {
  if (!game) return 100;
  const raw = String(game.typeJeu ?? game.type ?? '').trim().toUpperCase();
  const dbType = ROUTE_TYPE_TO_DB[raw] ?? raw;
  return MAX_SCORE_BY_TYPE[dbType] ?? 100;
}
