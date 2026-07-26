/**
 * Utilitaires pour la gestion des avatars
 */

export const PREDEFINED_AVATARS = [
  "👤", "👨", "👩", "🧑", "👨‍💼", "👩‍💼", "👨‍🎓", "👩‍🎓",
  "👨‍🔬", "👩‍🔬", "👨‍⚕️", "👩‍⚕️", "👨‍🏫", "👩‍🏫", "👨‍💻", "👩‍💻",
  "👨‍🎨", "👩‍🎨", "👨‍🚀", "👩‍🚀", "🧑‍🎤", "🧑‍🎨", "🧑‍🏫", "🧑‍💼",
  "🤴", "👸", "🦸", "🦹", "🧙", "🧙‍♂️", "🧙‍♀️", "🧚",
  "🧚‍♂️", "🧚‍♀️", "🧛", "🧛‍♂️", "🧛‍♀️", "🧜", "🧜‍♂️", "🧜‍♀️",
  "🧝", "🧝‍♂️", "🧝‍♀️", "🧞", "🧞‍♂️", "🧞‍♀️", "🧟", "🧟‍♂️", "🧟‍♀️",
  "🎮", "🎯", "🎨", "🎭", "🎪", "🎬", "🎤", "🎧",
  "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾",
  "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋",
  "🤖", "👾", "🎃", "👻", "💀", "☠️", "🤡", "👽",
  "👾", "🤖", "🎮", "🕹️", "🎯", "🎲", "🃏", "🀄",
];

export function getInitial(email?: string | null, nom?: string | null, prenom?: string | null): string {
  if (prenom && nom) return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  if (nom) return nom.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}

export function generateDefaultAvatar(initial: string, size = 48): Record<string, string | number> {
  const colors = [
    ["#6366f1", "#ec4899", "#f59e0b"],
    ["#8b5cf6", "#ec4899", "#06b6d4"],
    ["#f59e0b", "#ef4444", "#ec4899"],
    ["#10b981", "#06b6d4", "#6366f1"],
    ["#ec4899", "#f59e0b", "#6366f1"],
  ];
  const colorIndex = initial.charCodeAt(0) % colors.length;
  const gradient = colors[colorIndex];
  return {
    background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 50%, ${gradient[2]} 100%)`,
    color: "white",
    fontSize: `${size * 0.4}px`,
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    textTransform: "uppercase",
  };
}

export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  _email?: string,
  _nom?: string,
  _prenom?: string
): string | null {
  return avatarUrl || null;
}

export function isPredefinedAvatar(avatar: string): boolean {
  return PREDEFINED_AVATARS.includes(avatar);
}
