import { useEffect, useMemo, useRef, useState } from 'react';
import userApi from '@/api/user/user.api';
import type { PlayerAdDTO } from '@/api/types';

/**
 * Pub sponsor affichée juste à la FIN de la partie, avant l'écran de résultat — pour garder le
 * joueur motivé à voir son score (au lieu d'interrompre le jeu en plein milieu).
 *
 * `finished` doit passer à `true` une seule fois, quand la partie est terminée mais AVANT toute
 * navigation vers le résultat. `ready` devient `true` dès qu'il n'y a plus rien à afficher (pas
 * de pub disponible, ou pub déjà vue/fermée par le joueur) : c'est le signal que l'appelant doit
 * attendre avant de naviguer vers l'écran de résultat.
 */
export function useInGameAd(
  gameId: number | string | undefined | null,
  finished: boolean
) {
  const [ad, setAd] = useState<PlayerAdDTO | null>(null);
  const [adChecked, setAdChecked] = useState(false);
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);
  const viewRecordedRef = useRef(false);

  useEffect(() => {
    if (gameId == null || gameId === '') {
      setAd(null);
      setAdChecked(true);
      return;
    }
    let cancelled = false;
    setAdChecked(false);
    userApi
      .getActiveAd(gameId)
      .then((res) => {
        if (cancelled) return;
        setAd(res.status === 204 || !res.data ? null : res.data);
      })
      .catch(() => {
        if (!cancelled) setAd(null);
      })
      .finally(() => {
        if (!cancelled) setAdChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    if (!finished || !adChecked || shownRef.current) return;
    shownRef.current = true;
    if (ad) {
      setVisible(true);
      if (!viewRecordedRef.current) {
        viewRecordedRef.current = true;
        void userApi.recordAdInteraction(ad.id, 'VIEW').catch(() => undefined);
      }
    }
  }, [finished, adChecked, ad]);

  const dismiss = () => setVisible(false);

  const openCta = () => {
    if (!ad) return;
    void userApi.recordAdInteraction(ad.id, 'CLICK').catch(() => undefined);
    if (ad.ctaUrl) {
      window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Rien (ou plus rien) à afficher : la navigation vers le résultat peut avoir lieu.
  const ready = !finished || (adChecked && (!ad || (shownRef.current && !visible)));

  return useMemo(
    () => ({ ad, visible, ready, dismiss, openCta }),
    [ad, visible, ready]
  );
}
