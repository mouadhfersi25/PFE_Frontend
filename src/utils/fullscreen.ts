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

