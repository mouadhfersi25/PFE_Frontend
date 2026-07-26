export type QuizVariant =
  | 'DEFAULT'
  | 'TRUE_FALSE'
  | 'CLOZE'
  | 'IMAGE_WORD'
  | 'SYNONYM_ANTONYM'
  | 'COLOR_TRANSLATION'
  | 'AUDIO_COLOR';

export interface QuizVariantMeta {
  value: QuizVariant;
  label: string;
  shortLabel: string;
  description: string;
  example: string;
  icon: string;
  /** Classes Tailwind pour la carte sélectionnée */
  accent: string;
  ring: string;
  badge: string;
}

export const QUIZ_VARIANT_CATALOG: QuizVariantMeta[] = [
  {
    value: 'DEFAULT',
    label: 'Quiz standard (QCM)',
    shortLabel: 'QCM',
    description: 'Question avec 4 réponses possibles. Le joueur choisit la bonne option.',
    example: '« Quelle est la capitale de la France ? » → Paris, Lyon, Marseille…',
    icon: '🧮',
    accent: 'border-slate-300 bg-slate-50',
    ring: 'ring-slate-400',
    badge: 'bg-slate-100 text-slate-800',
  },
  {
    value: 'TRUE_FALSE',
    label: 'Vrai / Faux',
    shortLabel: 'Vrai / Faux',
    description: 'Une affirmation à valider. Le joueur répond Vrai ou Faux.',
    example: '« La Terre tourne autour du Soleil. » → Vrai ou Faux',
    icon: '✅',
    accent: 'border-emerald-300 bg-emerald-50',
    ring: 'ring-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  {
    value: 'CLOZE',
    label: 'Compléter la phrase',
    shortLabel: 'Phrase à trous',
    description: 'Une phrase avec un mot manquant (___). Le joueur choisit le bon mot.',
    example: '« Le chat ___ sur le tapis. » → dort, mange, court…',
    icon: '✏️',
    accent: 'border-violet-300 bg-violet-50',
    ring: 'ring-violet-500',
    badge: 'bg-violet-100 text-violet-800',
  },
  {
    value: 'IMAGE_WORD',
    label: 'Image → Mot',
    shortLabel: 'Image → Mot',
    description: 'Une image s\'affiche. Le joueur associe l\'image au bon mot.',
    example: 'Photo d\'un lion → lion, tigre, chat, chien',
    icon: '🖼️',
    accent: 'border-indigo-300 bg-indigo-50',
    ring: 'ring-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  {
    value: 'SYNONYM_ANTONYM',
    label: 'Synonymes / Antonymes',
    shortLabel: 'Synonyme',
    description: 'Trouver un synonyme ou un antonyme du mot proposé.',
    example: '« Synonyme de grand » → énorme, petit, lent, bleu',
    icon: '🔤',
    accent: 'border-amber-300 bg-amber-50',
    ring: 'ring-amber-500',
    badge: 'bg-amber-100 text-amber-800',
  },
  {
    value: 'COLOR_TRANSLATION',
    label: 'Couleurs FR / EN',
    shortLabel: 'Couleurs',
    description: 'Traduire une couleur du français vers l\'anglais (ou l\'inverse).',
    example: '« Traduis Rouge » → red, blue, green, yellow',
    icon: '🎨',
    accent: 'border-fuchsia-300 bg-fuchsia-50',
    ring: 'ring-fuchsia-500',
    badge: 'bg-fuchsia-100 text-fuchsia-800',
  },
  {
    value: 'AUDIO_COLOR',
    label: 'Écoute couleur',
    shortLabel: 'Audio couleur',
    description: 'Écouter une couleur (audio ou synthèse vocale) et identifier la bonne pastille.',
    example: 'Son « red » → Rouge, Vert, Bleu, Jaune',
    icon: '🔊',
    accent: 'border-cyan-300 bg-cyan-50',
    ring: 'ring-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800',
  },
];

/** @deprecated Utiliser QUIZ_VARIANT_CATALOG */
export const QUIZ_VARIANT_OPTIONS = QUIZ_VARIANT_CATALOG.map(({ value, label }) => ({ value, label }));

export function getQuizVariantMeta(value?: string | null): QuizVariantMeta {
  return QUIZ_VARIANT_CATALOG.find((o) => o.value === value) ?? QUIZ_VARIANT_CATALOG[0];
}

export function quizVariantLabel(value?: string | null): string {
  return getQuizVariantMeta(value).label;
}

export function requiresMedia(variant: string): boolean {
  return variant === 'IMAGE_WORD';
}

export function requiresAudio(variant: string): boolean {
  return variant === 'AUDIO_COLOR';
}

export function isTrueFalse(variant: string): boolean {
  return variant === 'TRUE_FALSE';
}

export function isCloze(variant: string): boolean {
  return variant === 'CLOZE';
}

export function normalizeQuizVariant(value?: string | null): QuizVariant {
  const found = QUIZ_VARIANT_CATALOG.find((o) => o.value === value);
  return found?.value ?? 'DEFAULT';
}
