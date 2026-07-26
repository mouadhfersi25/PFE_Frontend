export type LogicSubtype = 'SUITE_LOGIQUE' | 'INTRUS' | 'DEDUCTION' | 'COLOR_MATCH';

export interface LogicSubtypeMeta {
  value: LogicSubtype;
  label: string;
  description: string;
  example: string;
  educatorHint: string;
}

export const LOGIC_SUBTYPE_CATALOG: LogicSubtypeMeta[] = [
  {
    value: 'SUITE_LOGIQUE',
    label: 'Suite logique',
    description: 'Le joueur doit trouver l’élément manquant d’une suite (nombres, symboles…).',
    example: '2, 4, 8, 16 → ? (réponse : 32)',
    educatorHint: 'Saisissez au moins 3 éléments séparés par des virgules. La bonne réponse est le terme suivant.',
  },
  {
    value: 'INTRUS',
    label: 'Trouver l’intrus',
    description: 'Le joueur choisit l’élément qui ne correspond pas aux autres.',
    example: 'Chat, Chien, Voiture, Lapin → intrus : Voiture',
    educatorHint: 'Listez les propositions (une par ligne). La bonne réponse doit être exactement l’une des options.',
  },
  {
    value: 'DEDUCTION',
    label: 'Déduction',
    description: 'Énigme de raisonnement avec plusieurs propositions possibles.',
    example: '« Si A alors B… » — choisir la conclusion correcte',
    educatorHint: 'Rédigez un énoncé clair et proposez au moins 2 réponses possibles (une par ligne).',
  },
  {
    value: 'COLOR_MATCH',
    label: 'Couleur ↔ Nom',
    description: 'Le joueur relie chaque pastille couleur au bon mot avec une flèche.',
    example: '🔴 → rouge · 🟣 → violet',
    educatorHint: 'Créez des liaisons couleur → mot (flèche). Le joueur devra reproduire les associations.',
  },
];

export function getLogicSubtypeMeta(subtype?: string | null): LogicSubtypeMeta {
  const key = (subtype || 'DEDUCTION').toUpperCase() as LogicSubtype;
  return LOGIC_SUBTYPE_CATALOG.find((s) => s.value === key) ?? LOGIC_SUBTYPE_CATALOG[2];
}

/** Indication joueur selon le sous-type du puzzle en cours. */
export function getLogicPlayerHint(subtype: LogicSubtype): string {
  switch (subtype) {
    case 'SUITE_LOGIQUE':
      return 'Observe la suite et trouve l’élément manquant.';
    case 'INTRUS':
      return 'Repère l’élément qui ne va pas avec les autres.';
    case 'DEDUCTION':
      return 'Lis l’énoncé attentivement et choisis la bonne conclusion.';
    case 'COLOR_MATCH':
      return 'Relie chaque couleur au mot qui correspond avec une flèche.';
    default:
      return 'Réfléchis bien avant de répondre.';
  }
}

export function normalizeLogicSubtype(raw?: string | null): LogicSubtype {
  const v = (raw || 'DEDUCTION').toUpperCase();
  if (v === 'SUITE_LOGIQUE' || v === 'INTRUS' || v === 'DEDUCTION' || v === 'COLOR_MATCH') {
    return v;
  }
  return 'DEDUCTION';
}

export function normalizeHexColor(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function parseColorOptions(raw: string): string[] {
  return raw
    .split('\n')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function formatColorOptions(colors: string[]): string {
  return colors.map((c) => c.trim()).filter(Boolean).join('\n');
}

/** Compare réponses texte ou couleur (insensible à la casse). */
export function logicAnswersMatch(userAnswer: string, expected: string): boolean {
  const a = userAnswer.trim();
  const b = expected.trim();
  if (!a || !b) return false;
  if (isValidHexColor(a) && isValidHexColor(b)) {
    return normalizeHexColor(a) === normalizeHexColor(b);
  }
  return a.toLowerCase() === b.toLowerCase();
}

export interface ColorWordPair {
  color: string;
  word: string;
}

export interface LogicPuzzleDataExtended {
  type?: string;
  sequence?: Array<string | number>;
  options?: string[];
  colorPairs?: ColorWordPair[];
}

export const LOGIC_COLOR_PRESETS = [
  { hex: '#ef4444', label: 'Rouge' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#eab308', label: 'Jaune' },
  { hex: '#22c55e', label: 'Vert' },
  { hex: '#3b82f6', label: 'Bleu' },
  { hex: '#a855f7', label: 'Violet' },
  { hex: '#ec4899', label: 'Rose' },
  { hex: '#78716c', label: 'Gris' },
  { hex: '#171717', label: 'Noir' },
  { hex: '#ffffff', label: 'Blanc' },
] as const;

export function hexColorLabel(hex: string): string {
  const normalized = normalizeHexColor(hex);
  const found = LOGIC_COLOR_PRESETS.find((c) => normalizeHexColor(c.hex) === normalized);
  return found?.label ?? hex;
}

/** Sérialise les paires couleur→mot pour bonneReponse (JSON). */
export function serializeColorMatchLinks(pairs: ColorWordPair[]): string {
  const map: Record<string, string> = {};
  for (const p of pairs) {
    if (p.color && p.word.trim()) {
      map[normalizeHexColor(p.color)] = p.word.trim();
    }
  }
  return JSON.stringify(map);
}

/** Parse bonneReponse / donnees en paires couleur→mot. */
export function parseColorWordPairs(
  donnees: LogicPuzzleDataExtended | null | undefined,
  bonneReponse?: string | null,
): ColorWordPair[] {
  if (donnees?.colorPairs && Array.isArray(donnees.colorPairs) && donnees.colorPairs.length > 0) {
    return donnees.colorPairs
      .filter((p) => p.color && p.word)
      .map((p) => ({ color: normalizeHexColor(p.color), word: p.word.trim() }));
  }

  if (bonneReponse?.trim().startsWith('{')) {
    try {
      const map = JSON.parse(bonneReponse) as Record<string, string>;
      return Object.entries(map).map(([color, word]) => ({
        color: normalizeHexColor(color),
        word: String(word).trim(),
      }));
    } catch {
      /* legacy */
    }
  }

  const options = (donnees?.options ?? []).filter((o) => isValidHexColor(String(o)));
  if (options.length > 0 && bonneReponse && isValidHexColor(bonneReponse)) {
    return options.map((hex) => ({
      color: normalizeHexColor(String(hex)),
      word: normalizeHexColor(String(hex)) === normalizeHexColor(bonneReponse)
        ? hexColorLabel(bonneReponse)
        : hexColorLabel(String(hex)),
    }));
  }

  return options.map((hex) => ({
    color: normalizeHexColor(String(hex)),
    word: hexColorLabel(String(hex)),
  }));
}

export function validateColorWordPairs(pairs: ColorWordPair[]): string | null {
  if (pairs.length < 2) return 'Ajoutez au moins 2 liaisons couleur → mot.';
  const colors = new Set<string>();
  const words = new Set<string>();
  for (const p of pairs) {
    if (!isValidHexColor(p.color)) return 'Chaque couleur doit être un code hex valide.';
    if (!p.word.trim()) return 'Chaque couleur doit être reliée à un mot.';
    const c = normalizeHexColor(p.color);
    const w = p.word.trim().toLowerCase();
    if (colors.has(c)) return 'Deux liaisons utilisent la même couleur.';
    if (words.has(w)) return 'Deux liaisons utilisent le même mot.';
    colors.add(c);
    words.add(w);
  }
  return null;
}

export function parseUserColorLinks(raw: string): Record<string, string> {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[normalizeHexColor(k)] = String(v).trim();
    }
    return out;
  } catch {
    return {};
  }
}

export function colorMatchLinksAreCorrect(
  userLinks: Record<string, string>,
  expectedPairs: ColorWordPair[],
): boolean {
  if (expectedPairs.length === 0) return false;
  const linked = Object.entries(userLinks).filter(([, w]) => w.trim());
  if (linked.length !== expectedPairs.length) return false;
  return expectedPairs.every((p) => {
    const expectedWord = p.word.trim().toLowerCase();
    const userWord = (userLinks[normalizeHexColor(p.color)] ?? '').trim().toLowerCase();
    return userWord === expectedWord;
  });
}

