export type VoicePromptSubtype = 'READ_ALOUD' | 'REPEAT_AFTER';
export type VoiceTolerance = 'STRICT' | 'NORMAL' | 'SOUPLE';

export const VOICE_SUBTYPE_OPTIONS = [
  {
    value: 'READ_ALOUD' as const,
    label: 'Lecture à voix haute',
    description: 'Le joueur lit le texte affiché à l’écran.',
  },
  {
    value: 'REPEAT_AFTER' as const,
    label: 'Répétition',
    description: 'Le joueur répète la phrase après l’avoir lue.',
  },
];

export const VOICE_TOLERANCE_OPTIONS = [
  { value: 'STRICT' as const, label: 'Stricte', description: 'Score requis ≥ 85 %' },
  { value: 'NORMAL' as const, label: 'Normale', description: 'Score requis ≥ 70 %' },
  { value: 'SOUPLE' as const, label: 'Souple', description: 'Score requis ≥ 60 %' },
];

export const VOICE_SERIES_STATE_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PUBLIE: 'Publiée',
  ARCHIVE: 'Archivée',
};

export function getVoiceSubtypeLabel(value?: string | null): string {
  return VOICE_SUBTYPE_OPTIONS.find((o) => o.value === value)?.label ?? 'Lecture';
}

export function getVoiceToleranceLabel(value?: string | null): string {
  return VOICE_TOLERANCE_OPTIONS.find((o) => o.value === value)?.label ?? 'Normale';
}
