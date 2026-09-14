import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { enterFullscreenSafely, exitFullscreenSafely } from '@/utils/fullscreen';

/**
 * Icône pour (ré)activer le plein écran manuellement — utile car quitter le plein écran via la
 * touche Échap (comportement navigateur non interceptable) ne laissait auparavant aucun moyen
 * d'y revenir sans quitter la partie.
 */
export default function FullscreenToggleButton({ className = '' }: { className?: string }) {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (isFullscreen) {
      void exitFullscreenSafely();
    } else {
      void enterFullscreenSafely();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'}
      aria-label={isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'}
      className={`p-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors ${className}`}
    >
      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
    </button>
  );
}
