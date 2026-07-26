import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import userApi from '@/api/user/user.api';
import type { LinkedChildProfileDTO, PlayerBadgeOverviewItemDTO } from '@/api/types';

export default function ParentBadges() {
  const navigate = useNavigate();
  const location = useLocation();
  const [children, setChildren] = useState<LinkedChildProfileDTO[]>([]);
  const [badges, setBadges] = useState<PlayerBadgeOverviewItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const childIdFromState = (location.state as { childId?: number } | null)?.childId ?? null;

  useEffect(() => {
    let cancelled = false;
    userApi
      .getLinkedChildren()
      .then((res) => {
        if (cancelled) return;
        setChildren(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setChildren([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedChild = useMemo(() => {
    if (children.length === 0) return null;
    if (childIdFromState != null) {
      const match = children.find((c) => c.id === childIdFromState);
      if (match) return match;
    }
    return children[0];
  }, [children, childIdFromState]);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    setLoading(true);
    userApi
      .getLinkedChildBadges(selectedChild.id)
      .then((res) => {
        if (cancelled) return;
        setBadges(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBadges([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChild?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/90 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/parent/dashboard')}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Badges enfant</h1>
            <p className="text-sm text-slate-500">
              {selectedChild ? `${selectedChild.prenom} ${selectedChild.nom}` : 'Aucun enfant sélectionné'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          </div>
        ) : badges.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Aucun badge disponible pour cet enfant.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <article key={badge.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Award className="h-5 w-5" />
                  </div>
                  {badge.earned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Obtenu
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      <Circle className="h-3.5 w-3.5" />
                      Non obtenu
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-900">{badge.nom}</h2>
                <p className="mt-1 text-sm text-slate-600">{badge.description || 'Badge de progression'}</p>
                <p className="mt-3 text-xs text-slate-500">{badge.unlockCondition}</p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

