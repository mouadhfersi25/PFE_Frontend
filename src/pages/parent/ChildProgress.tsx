import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Target, Flame, Loader2 } from 'lucide-react';
import userApi from '@/api/user/user.api';
import type { LinkedChildProfileDTO } from '@/api/types';

type SkillsMap = { math: number; logic: number; memory: number; reflex: number };

type ChildView = {
  id: number;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalScore: number;
  currentStreak: number;
  skills: SkillsMap;
};

function mapChildToView(child: LinkedChildProfileDTO): ChildView {
  return {
    id: child.id,
    name: `${child.prenom} ${child.nom}`.trim(),
    level: child.niveau ?? 1,
    xp: child.pointsExperience ?? 0,
    xpToNextLevel: Math.max(1, child.xpToNextLevel ?? 100),
    totalScore: child.scoreTotal ?? 0,
    currentStreak: child.currentStreakDays ?? 0,
    skills: {
      math: child.skillMath ?? 0,
      logic: child.skillLogic ?? 0,
      memory: child.skillMemory ?? 0,
      reflex: child.skillReflex ?? 0,
    },
  };
}

export default function ChildProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const [children, setChildren] = useState<LinkedChildProfileDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const childIdFromState = (location.state as { childId?: number } | null)?.childId ?? null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    userApi
      .getLinkedChildren()
      .then((res) => {
        if (cancelled) return;
        setChildren(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setChildren([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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

  const childProfile = selectedChild ? mapChildToView(selectedChild) : null;
  const xpPct = childProfile
    ? Math.min(100, Math.max(0, (childProfile.xp / Math.max(1, childProfile.xpToNextLevel)) * 100))
    : 0;

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
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Progression enfant</h1>
            <p className="text-sm text-slate-500">Données dynamiques liées à l’enfant sélectionné</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          </div>
        ) : !childProfile ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            Aucun enfant rattaché à ce compte parent.
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{childProfile.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Niveau actuel et progression XP</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="mb-1 flex items-center gap-2 text-slate-600">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold uppercase">Niveau</span>
                  </div>
                  <p className="text-2xl font-bold">{childProfile.level}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="mb-1 flex items-center gap-2 text-slate-600">
                    <Target className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold uppercase">Score total</span>
                  </div>
                  <p className="text-2xl font-bold">{childProfile.totalScore.toLocaleString('fr-FR')}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="mb-1 flex items-center gap-2 text-slate-600">
                    <Flame className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold uppercase">Série actuelle</span>
                  </div>
                  <p className="text-2xl font-bold">{childProfile.currentStreak} j</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>XP</span>
                  <span className="tabular-nums">
                    {childProfile.xp} / {childProfile.xpToNextLevel}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Compétences</h3>
              <p className="mt-1 text-sm text-slate-500">Calculées à partir des sessions terminées</p>
              <div className="mt-5 space-y-4">
                {Object.entries(childProfile.skills).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800 capitalize">{key}</span>
                      <span className="tabular-nums font-bold text-slate-600">{value}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
