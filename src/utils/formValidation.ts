/**
 * Contrôle de saisie pour les formulaires admin (sans validation HTML5).
 * Chaque fonction retourne un message d'erreur ou null si valide.
 */

export function validateRequired(value: unknown, message = 'Champ requis'): string | null {
  if (value === undefined || value === null) return message;
  if (typeof value === 'string' && !value.trim()) return message;
  return null;
}

export function validateMaxLength(value: string, max: number, message?: string): string | null {
  if (!value) return null;
  const msg = message ?? `Maximum ${max} caractères`;
  return value.length > max ? msg : null;
}

export function validateMinLength(value: string, min: number, message?: string): string | null {
  if (!value) return null;
  const msg = message ?? `Minimum ${min} caractères`;
  return value.length < min ? msg : null;
}

export function validateNonNegativeNumber(value: number | string, message = 'Doit être ≥ 0'): string | null {
  const n = typeof value === 'string' ? (value.trim() === '' ? NaN : Number(value)) : value;
  if (Number.isNaN(n)) return null; // vide autorisé si optionnel
  return n < 0 ? message : null;
}

export function validateInteger(value: number | string, min: number, max: number, message?: string): string | null {
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  if (Number.isNaN(n)) return message ?? 'Nombre entier attendu';
  if (n < min || n > max) return message ?? `Entre ${min} et ${max}`;
  return null;
}

/** Téléphone optionnel : si renseigné, doit être 8 chiffres. */
export function validatePhone(value: string | undefined, message = 'Le téléphone doit contenir 8 chiffres'): string | null {
  if (!value || !value.trim()) return null;
  return /^[0-9]{8}$/.test(value.trim()) ? null : message;
}

export type ValidationResult = Record<string, string>;

/** Exécute des règles et retourne un objet erreurs (clé = champ, valeur = message). */
export function runValidations(
  rules: Array<{ field: string; message: string | null }>
): ValidationResult {
  const result: ValidationResult = {};
  for (const { field, message } of rules) {
    if (message) result[field] = message;
  }
  return result;
}
