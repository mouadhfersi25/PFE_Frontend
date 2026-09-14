// Storage
//
// Jeton et données de session persistés dans localStorage par défaut
// ("Rester connecté" coché). Quand l'utilisateur décoche cette option à la
// connexion, on bascule sur sessionStorage : la session est alors effacée à
// la fermeture de l'onglet/navigateur. Le drapeau lui-même vit toujours dans
// localStorage pour survivre à la navigation.
const REMEMBER_KEY = "remember_me";

function backing(): globalThis.Storage {
  const remember = localStorage.getItem(REMEMBER_KEY) !== "false";
  return remember ? localStorage : sessionStorage;
}

const storage = {
  get(key: string): string | null {
    return backing().getItem(key);
  },
  set(key: string, value: string): void {
    backing().setItem(key, value);
  },
  remove(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
  /** À appeler avant de stocker le jeton de connexion. */
  setRemember(remember: boolean): void {
    localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  },
};

export default storage;
