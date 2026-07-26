/**
 * Fonction utilitaire pour extraire le message d'erreur depuis une erreur Axios
 */
export function getErrorMessage(err, defaultMessage = "Une erreur est survenue") {
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    if (data?.error) {
      return data.error;
    }
    if (data?.message) {
      return data.message;
    }

    // Messages par défaut selon le status
    switch (status) {
      case 400:
        return "Données invalides";
      case 401:
        return "Email ou mot de passe incorrect";
      case 403:
        return "Accès refusé";
      case 404:
        return "Service non trouvé";
      case 409:
        return "Cet email est déjà utilisé";
      case 500:
        return "Erreur serveur. Veuillez réessayer plus tard";
      default:
        return `Erreur ${status}`;
    }
  }

  if (err.request) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
  }

  return err.message || defaultMessage;
}

/**
 * Vérifie si l'erreur est un timeout
 */
export function isTimeoutError(err) {
  return (
    err.code === 'ECONNABORTED' ||
    err.message?.includes('timeout') ||
    err.message?.includes('exceeded') ||
    (err.request && !err.response)
  );
}
