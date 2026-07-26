// Constantes globales de l'application

export const ROLES = {
  JOUEUR: 'JOUEUR',
  PARENT: 'PARENT',
  EDUCATEUR: 'EDUCATEUR',
  ADMIN: 'ADMIN',
  SPONSOR: 'SPONSOR',
};

// Labels des rôles pour l'affichage
export const ROLE_LABELS = {
  JOUEUR: 'Joueur',
  PARENT: 'Parent',
  EDUCATEUR: 'Éducateur',
  ADMIN: 'Administrateur',
  SPONSOR: 'Sponsor',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  ROLE: 'auth_role',
  EMAIL: 'auth_email',
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
};
