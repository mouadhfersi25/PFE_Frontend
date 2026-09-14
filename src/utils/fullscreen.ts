/** Demande le plein écran sur toute la page (document.documentElement). Ignore les refus. */
export async function enterFullscreenSafely(): Promise<void> {
  try {
    if (document.fullscreenElement) return;
    const element = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  } catch {
    // Refus navigateur/utilisateur : on ignore pour ne pas bloquer le jeu.
  }
}

export async function exitFullscreenSafely(): Promise<void> {
  try {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    if (doc.fullscreenElement && doc.exitFullscreen) {
      await doc.exitFullscreen();
      return;
    }
    if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  } catch {
    // Ignore failures to avoid blocking navigation.
  }
}

