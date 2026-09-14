import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Megaphone } from 'lucide-react';
import type { PlayerAdDTO } from '@/api/types';

type InGameAdOverlayProps = {
  ad: PlayerAdDTO;
  onContinue: () => void;
  onCtaClick: () => void;
};

export default function InGameAdOverlay({ ad, onContinue, onCtaClick }: InGameAdOverlayProps) {
  const duration = Math.max(3, Math.min(60, ad.adDurationSeconds ?? 8));
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSecondsLeft(duration);
    setCanSkip(false);
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [ad.id, duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => undefined);
  }, [ad.videoUrl]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
            <Megaphone className="h-4 w-4" />
            Publicité partenaire
          </div>
          <p className="text-xs text-slate-300">
            {canSkip ? 'Vous pouvez continuer' : `Continuez dans ${secondsLeft}s`}
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              src={ad.videoUrl}
              className="aspect-video w-full object-contain"
              controls
              playsInline
              autoPlay
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {ad.ctaUrl ? (
              <button
                type="button"
                onClick={onCtaClick}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/30"
              >
                <ExternalLink className="h-4 w-4" />
                {ad.ctaLabel || "Voir l'offre"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={!canSkip}
              onClick={onContinue}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer la partie
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
