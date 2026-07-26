// Endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  VERIFY: "/auth/verify",
  FORGOT: "/auth/forgot-password",
  RESET: "/auth/reset-password",
  LOGOUT: "/auth/logout",
};

export const USER_ENDPOINTS = {
  ME: "/users/me",
  UPDATE_PROFILE: "/users/update-profile",
  CHANGE_PASSWORD: "/users/change-password",
};

export const ADMIN_ENDPOINTS = {
  USERS: "/admin/users",
  USER_BY_ID: (id) => `/admin/users/${id}`,
  SUSPEND_USER: (id) => `/admin/users/suspend/${id}`,
  REACTIVATE_USER: (id) => `/admin/users/reactivate/${id}`,
  USER_ROLE: (id) => `/admin/users/${id}/change-role`,
  GAMES: "/admin/games",
  GAME_BY_ID: (id) => `/admin/games/${id}`,
};
