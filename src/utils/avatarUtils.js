/**
 * Utilitaires pour la gestion des avatars
 */

/**
 * Liste des avatars prédéfinis disponibles
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

/**
 * Génère l'initiale à partir d'un email ou d'un nom
 */
export function getInitial(email, nom, prenom) {
  if (prenom && nom) {
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }
  if (nom) {
    return nom.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
}

/**
 * Génère un avatar par défaut avec l'initiale
 */
export function generateDefaultAvatar(initial, size = 48) {
  const colors = [
    ["#6366f1", "#ec4899", "#f59e0b"], // Indigo-Pink-Amber
    ["#8b5cf6", "#ec4899", "#06b6d4"], // Purple-Pink-Cyan
    ["#f59e0b", "#ef4444", "#ec4899"], // Amber-Red-Pink
    ["#10b981", "#06b6d4", "#6366f1"], // Green-Cyan-Indigo
    ["#ec4899", "#f59e0b", "#6366f1"], // Pink-Amber-Indigo
  ];

  // Utiliser l'initiale pour choisir une couleur de manière déterministe
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

/**
 * Récupère l'URL de l'avatar ou génère un avatar par défaut
 */
export function getAvatarUrl(avatarUrl, email, nom, prenom) {
  if (avatarUrl) {
    return avatarUrl;
  }
  return null; // null = utiliser l'avatar par défaut généré
}

/**
 * Vérifie si un avatar est un emoji prédéfini
 */
export function isPredefinedAvatar(avatar) {
  return PREDEFINED_AVATARS.includes(avatar);
}
