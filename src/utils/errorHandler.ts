/**
 * Fonction utilitaire pour extraire le message d'erreur depuis une erreur Axios
 */
export function getErrorMessage(
  err: unknown,
  defaultMessage = "Une erreur est survenue"
): string {
  const e = err as { response?: { status?: number; data?: { error?: string; message?: string } }; request?: unknown; message?: string };
  if (e?.response) {
    const status = e.response.status;
    const data = e.response.data;

    if (data?.error) return data.error;
    if (data?.message) return data.message;

    switch (status) {
      case 400: return "Données invalides";
      case 401: return "Email ou mot de passe incorrect";
      case 403: return "Accès refusé";
      case 404: return "Service non trouvé";
      case 409: return "Cet email est déjà utilisé";
      case 500: return "Erreur serveur. Veuillez réessayer plus tard";
      default: return `Erreur ${status}`;
    }
  }

  if (e?.request) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
  }

  return e?.message || defaultMessage;
}

export function isTimeoutError(err: unknown): boolean {
  const e = err as { code?: string; message?: string; request?: unknown };
  return (
    e?.code === "ECONNABORTED" ||
    (e?.message?.includes("timeout") ?? false) ||
    (e?.message?.includes("exceeded") ?? false) ||
    (!!e?.request && !("response" in (err as object)))
  );
}
