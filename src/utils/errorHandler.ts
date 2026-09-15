import { ENV } from "@/config/env";

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
      case 401: return "E-mail ou mot de passe incorrect";
      case 403: return "Accès refusé";
      case 404: return "Service non trouvé";
      case 409: return "Cet e-mail est déjà utilisé";
      case 500: return "Erreur serveur. Veuillez réessayer plus tard";
      default: return `Erreur ${status}`;
    }
  }

  if (e?.request) {
    const msg = (e.message || "").toLowerCase();
    if (msg.includes("timeout") || (e as { code?: string }).code === "ECONNABORTED") {
      return "Le serveur met trop de temps à répondre. Réessayez dans un instant.";
    }
    return `Impossible de contacter le serveur (${ENV.API_URL}). Réessayez dans un instant.`;
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
