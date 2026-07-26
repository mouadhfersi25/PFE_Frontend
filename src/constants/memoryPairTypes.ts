import type { MemoryCardDTO } from '@/api/types/api.types';

/** Mode de paire choisi par l'éducateur (pas de variante au niveau jeu). */
export type MemoryPairMode = 'IDENTICAL' | 'BILINGUAL' | 'IMAGE_WORD' | 'COLOR_WORD';

export interface MemoryPairModeMeta {
  value: MemoryPairMode;
  label: string;
  description: string;
  example: string;
  sousType: 'DEFAULT' | 'BILINGUAL_WORD_PAIR' | 'IMAGE_WORD_PAIR' | 'COLOR_WORD_PAIR';
  card1Label: string;
  card2Label: string;
}

export const MEMORY_PAIR_MODES: MemoryPairModeMeta[] = [
  {
    value: 'IDENTICAL',
    label: 'Identique',
    description: 'Deux cartes identiques à retrouver (mémoire classique).',
    example: '🦁 / 🦁',
    sousType: 'DEFAULT',
    card1Label: 'Emoji (carte 1 & 2)',
    card2Label: '',
  },
  {
    value: 'BILINGUAL',
    label: 'Bilingue',
    description: 'Associer un mot français à sa traduction anglaise.',
    example: 'chat / cat',
    sousType: 'BILINGUAL_WORD_PAIR',
    card1Label: 'Mot français',
    card2Label: 'Mot anglais',
  },
  {
    value: 'IMAGE_WORD',
    label: 'Image + mot',
    description: 'Associer une image au mot correspondant.',
    example: 'pomme / apple',
    sousType: 'IMAGE_WORD_PAIR',
    card1Label: 'Image (URL ou fichier)',
    card2Label: 'Mot',
  },
  {
    value: 'COLOR_WORD',
    label: 'Couleur + mot',
    description: 'Associer une pastille couleur au mot correspondant.',
    example: 'rouge / red',
    sousType: 'COLOR_WORD_PAIR',
    card1Label: 'Couleur',
    card2Label: 'Mot',
  },
];

export const COLOR_PRESETS = [
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

export function getMemoryPairModeMeta(mode: MemoryPairMode): MemoryPairModeMeta {
  return MEMORY_PAIR_MODES.find((m) => m.value === mode) ?? MEMORY_PAIR_MODES[0];
}

export function inferMemoryPairMode(cards: MemoryCardDTO[]): MemoryPairMode {
  if (cards.length === 0) return 'IDENTICAL';

  const sous = (cards[0]?.sousType || cards[1]?.sousType || 'DEFAULT').toUpperCase();
  if (sous === 'BILINGUAL_WORD_PAIR') return 'BILINGUAL';
  if (sous === 'IMAGE_WORD_PAIR') return 'IMAGE_WORD';
  if (sous === 'COLOR_WORD_PAIR') return 'COLOR_WORD';

  const types = cards.map((c) => (c.cardType || 'EMOJI').toUpperCase());
  if (types.includes('IMAGE') && types.includes('TEXT')) return 'IMAGE_WORD';
  if (types.includes('COLOR') && types.includes('TEXT')) return 'COLOR_WORD';
  if (types.every((t) => t === 'TEXT') && cards.length >= 2) {
    const v1 = cardDisplayValue(cards[0]);
    const v2 = cardDisplayValue(cards[1]);
    if (v1 && v2 && v1.toLowerCase() !== v2.toLowerCase()) return 'BILINGUAL';
  }

  return 'IDENTICAL';
}

export function pairValuesFromCards(
  cards: MemoryCardDTO[],
  mode: MemoryPairMode,
): { card1Value: string; card2Value: string } {
  if (cards.length === 0) return { card1Value: '', card2Value: '' };

  if (mode === 'IDENTICAL') {
    const v = cardDisplayValue(cards[0]) || cardDisplayValue(cards[1] ?? cards[0]);
    return { card1Value: v, card2Value: v };
  }

  if (mode === 'IMAGE_WORD') {
    const imageCard = cards.find((c) => (c.cardType || '').toUpperCase() === 'IMAGE') ?? cards[0];
    const textCard = cards.find((c) => (c.cardType || '').toUpperCase() === 'TEXT') ?? cards[1] ?? cards[0];
    return { card1Value: cardDisplayValue(imageCard), card2Value: cardDisplayValue(textCard) };
  }

  if (mode === 'COLOR_WORD') {
    const colorCard = cards.find((c) => (c.cardType || '').toUpperCase() === 'COLOR') ?? cards[0];
    const textCard = cards.find((c) => (c.cardType || '').toUpperCase() === 'TEXT') ?? cards[1] ?? cards[0];
    return { card1Value: cardDisplayValue(colorCard), card2Value: cardDisplayValue(textCard) };
  }

  return {
    card1Value: cardDisplayValue(cards[0]),
    card2Value: cardDisplayValue(cards[1] ?? cards[0]),
  };
}

export function cardDisplayValue(c: MemoryCardDTO): string {
  const type = (c.cardType || 'EMOJI').toUpperCase();
  if (type === 'EMOJI') return (c.cardValue || c.symbole || '').trim();
  return (c.cardValue || c.symbole || '').trim();
}

export interface MemoryPairCardPayload {
  symbole: string;
  cardType: 'EMOJI' | 'TEXT' | 'IMAGE' | 'COLOR';
  cardValue: string;
  sousType: MemoryPairModeMeta['sousType'];
  pairKey: string;
  categorie: null;
}

export function buildMemoryPairCardPayloads(
  mode: MemoryPairMode,
  pairKey: string,
  card1Value: string,
  card2Value: string,
): MemoryPairCardPayload[] {
  const meta = getMemoryPairModeMeta(mode);
  const key = pairKey.trim();

  switch (mode) {
    case 'IDENTICAL': {
      const emoji = card1Value.trim();
      return [
        { symbole: emoji, cardType: 'EMOJI', cardValue: emoji, sousType: meta.sousType, pairKey: key, categorie: null },
        { symbole: emoji, cardType: 'EMOJI', cardValue: emoji, sousType: meta.sousType, pairKey: key, categorie: null },
      ];
    }
    case 'BILINGUAL': {
      const fr = card1Value.trim();
      const en = card2Value.trim();
      return [
        { symbole: fr.slice(0, 100), cardType: 'TEXT', cardValue: fr, sousType: meta.sousType, pairKey: key, categorie: null },
        { symbole: en.slice(0, 100), cardType: 'TEXT', cardValue: en, sousType: meta.sousType, pairKey: key, categorie: null },
      ];
    }
    case 'IMAGE_WORD': {
      const imageUrl = card1Value.trim();
      const word = card2Value.trim();
      const label = (word || 'image').slice(0, 100);
      return [
        { symbole: label, cardType: 'IMAGE', cardValue: imageUrl, sousType: meta.sousType, pairKey: key, categorie: null },
        { symbole: word.slice(0, 100), cardType: 'TEXT', cardValue: word, sousType: meta.sousType, pairKey: key, categorie: null },
      ];
    }
    case 'COLOR_WORD': {
      const color = card1Value.trim();
      const word = card2Value.trim();
      return [
        { symbole: color.slice(0, 100), cardType: 'COLOR', cardValue: color, sousType: meta.sousType, pairKey: key, categorie: null },
        { symbole: word.slice(0, 100), cardType: 'TEXT', cardValue: word, sousType: meta.sousType, pairKey: key, categorie: null },
      ];
    }
    default:
      return buildMemoryPairCardPayloads('IDENTICAL', key, card1Value, card2Value);
  }
}

export function validateMemoryPair(mode: MemoryPairMode, card1Value: string, card2Value: string): string | null {
  const v1 = card1Value.trim();
  const v2 = card2Value.trim();

  switch (mode) {
    case 'IDENTICAL':
      if (!v1) return 'Choisissez un emoji pour la paire.';
      if (v1.length > 100) return 'L’emoji ne peut pas dépasser 100 caractères.';
      return null;
    case 'BILINGUAL':
      if (!v1) return 'Saisissez le mot français.';
      if (!v2) return 'Saisissez le mot anglais.';
      if (v1.toLowerCase() === v2.toLowerCase()) return 'Les deux mots doivent être différents.';
      return null;
    case 'IMAGE_WORD':
      if (!v1) return 'Ajoutez une image (URL ou fichier).';
      if (!v2) return 'Saisissez le mot associé à l’image.';
      return null;
    case 'COLOR_WORD':
      if (!v1) return 'Choisissez une couleur.';
      if (!v2) return 'Saisissez le mot associé à la couleur.';
      return null;
    default:
      return null;
  }
}

/** Indication joueur selon les sous-types présents dans le jeu. */
export function getMemoryPlayerHint(cards: MemoryCardDTO[]): string {
  const types = new Set(
    cards
      .map((c) => (c.sousType || 'DEFAULT').toUpperCase())
      .filter((t) => t !== 'DEFAULT'),
  );

  if (types.size === 0) {
    return 'Retrouve les paires identiques. Mémorise les positions puis clique pour jouer.';
  }
  if (types.size > 1) {
    return 'Associe les cartes qui vont ensemble. Mémorise les positions puis clique pour jouer.';
  }

  const only = [...types][0];
  switch (only) {
    case 'BILINGUAL_WORD_PAIR':
      return 'Associe chaque mot français à sa traduction anglaise.';
    case 'IMAGE_WORD_PAIR':
      return 'Associe chaque image au mot correspondant.';
    case 'COLOR_WORD_PAIR':
      return 'Associe chaque couleur au mot correspondant.';
    default:
      return 'Associe les cartes qui vont ensemble.';
  }
}
