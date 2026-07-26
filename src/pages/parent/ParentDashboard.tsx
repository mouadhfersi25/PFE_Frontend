import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  TrendingUp,
  Award,
  History,
  BarChart3,
  Clock,
  Target,
  Flame,
  Lightbulb,
  ChevronRight,
  Shield,
  Loader2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context';
import userApi from '@/api/user/user.api';
import type { LinkedChildProfileDTO } from '@/api/types';

type SkillsMap = { math: number; logic: number; memory: number; reflex: number };

const PLACEHOLDER_SKILLS: SkillsMap = { math: 0, logic: 0, memory: 0, reflex: 0 };

const SKILL_LABELS: Record<keyof SkillsMap, string> = {
  math: 'Quiz & culture',
  logic: 'Logique',
  memory: 'Mémoire',
  reflex: 'Réflexes',
};

function computeAgeFromIsoDate(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

function buildDynamicSkills(selected: LinkedChildProfileDTO): SkillsMap {
  const level = Math.max(1, selected.niveau ?? 1);
  const xp = Math.max(0, selected.pointsExperience ?? 0);
  const xpToNext = Math.max(1, selected.xpToNextLevel ?? 100);
  const score = Math.max(0, selected.scoreTotal ?? 0);
  const streak = Math.max(0, selected.currentStreakDays ?? 0);

  const xpRatio = Math.min(1, xp / xpToNext);
  const levelRatio = Math.min(1, level / 20);
  const scoreRatio = Math.min(1, score / 5000);
  const streakRatio = Math.min(1, streak / 30);

  // Estimation pondérée des compétences tant que l'API parent ne renvoie pas un détail par type de jeu.
  return {
    math: clampPercent((xpRatio * 45 + levelRatio * 35 + scoreRatio * 20) * 100),
    logic: clampPercent((levelRatio * 45 + scoreRatio * 35 + xpRatio * 20) * 100),
    memory: clampPercent((scoreRatio * 45 + xpRatio * 30 + streakRatio * 25) * 100),
    reflex: clampPercent((streakRatio * 45 + xpRatio * 25 + scoreRatio * 30) * 100),
  };
}

function mapChildToView(selected: LinkedChildProfileDTO) {
  const age = computeAgeFromIsoDate(selected.dateDeNaissance);
  const backendSkills: SkillsMap = {
    math: selected.skillMath ?? 0,
    logic: selected.skillLogic ?? 0,
    memory: selected.skillMemory ?? 0,
    reflex: selected.skillReflex ?? 0,
  };
  const hasBackendSkills = Object.values(backendSkills).some((v) => v > 0);
  return {
    name: `${selected.prenom} ${selected.nom}`.trim(),
    ageLabel: age != null ? `${age} ans` : 'Âge non renseigné',
    level: selected.niveau ?? 1,
    xp: selected.pointsExperience ?? 0,
    xpToNextLevel: Math.max(1, selected.xpToNextLevel ?? 100),
    totalScore: selected.scoreTotal ?? 0,
    currentStreak: selected.currentStreakDays ?? 0,
    weeklyPlayTime: '—',
    averageSuccessRate: 0,
    skills: hasBackendSkills ? backendSkills : buildDynamicSkills(selected),
    avatarUrl: selected.avatarUrl?.trim() || '',
  };
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [linkedChildren, setLinkedChildren] = useState<LinkedChildProfileDTO[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'parent') return;
    let cancelled = false;
    setLoadingChildren(true);
    userApi
      .getLinkedChildren()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setLinkedChildren(list);
      })
      .catch(() => {
        if (!cancelled) setLinkedChildren([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingChildren(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    if (linkedChildren.length === 0) {
      setSelectedChildId(null);
      return;
    }
    if (selectedChildId == null || !linkedChildren.some((c) => c.id === selectedChildId)) {
      setSelectedChildId(linkedChildren[0].id);
    }
  }, [linkedChildren, selectedChildId]);

  if (user?.role !== 'parent') return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const parentDisplay =
    user?.name && !user.name.includes('@')
      ? user.name
      : user?.email
        ? user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Parent';

  const selectedRaw = linkedChildren.find((c) => c.id === selectedChildId) ?? null;
  const childProfile = selectedRaw ? mapChildToView(selectedRaw) : null;
  const firstName = childProfile?.name.split(/\s+/)[0] ?? '';
  const xpPct =
    childProfile != null
      ? Math.min(100, Math.max(0, (childProfile.xp / Math.max(1, childProfile.xpToNextLevel)) * 100))
      : 0;

  const avatarIsImage =
    childProfile &&
    childProfile.avatarUrl &&
    (childProfile.avatarUrl.startsWith('http://') ||
      childProfile.avatarUrl.startsWith('https://') ||
      childProfile.avatarUrl.startsWith('data:image/'));

  const selectedChildNavState = selectedRaw ? { state: { childId: selectedRaw.id } } : undefined;

  const dashboardCards = [
    {
      title: 'Progression',
      description: 'Parcours, niveau et courbes d’apprentissage',
      icon: TrendingUp,
      accent: 'text-teal-600',
      iconBg: 'bg-teal-50 group-hover:bg-teal-100/80',
      borderHover: 'hover:border-teal-200/80',
      action: () => navigate('/parent/child-progress', selectedChildNavState),
    },
    {
      title: 'Analyses',
      description: 'Graphiques et recommandations personnalisées',
      icon: BarChart3,
      accent: 'text-sky-600',
      iconBg: 'bg-sky-50 group-hover:bg-sky-100/80',
      borderHover: 'hover:border-sky-200/80',
      action: () => navigate('/parent/analytics', selectedChildNavState),
    },
    {
      title: 'Badges',
      description: 'Récompenses et milestones obtenus',
      icon: Award,
      accent: 'text-amber-600',
      iconBg: 'bg-amber-50 group-hover:bg-amber-100/80',
      borderHover: 'hover:border-amber-200/80',
      action: () => navigate('/parent/badges', selectedChildNavState),
    },
    {
      title: 'Historique',
      description: 'Sessions et parties récentes',
      icon: History,
      accent: 'text-violet-600',
      iconBg: 'bg-violet-50 group-hover:bg-violet-100/80',
      borderHover: 'hover:border-violet-200/80',
      action: () => navigate('/parent/history', selectedChildNavState),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/90 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="shrink-0 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/80"
              aria-hidden
            >
              <img src="/logo-edugame.png" alt="" className="h-9 w-9 rounded-xl object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-teal-700/90">EduGame · Espace parent</p>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">Bonjour, {parentDisplay}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 sm:flex">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="max-w-[140px] truncate text-xs font-medium text-slate-600">Suivi bienveillant</span>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Déconnexion</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <p className="text-sm font-medium text-slate-500">Vue d’ensemble</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Tableau de bord</h2>
        </motion.div>

        {loadingChildren ? (
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          </div>
        ) : linkedChildren.length === 0 ? (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl border border-amber-200/80 bg-amber-50/50 p-8 text-center shadow-sm"
          >
            <Users className="mx-auto mb-4 h-12 w-12 text-amber-700" />
            <h3 className="text-lg font-bold text-slate-900">Aucun joueur rattaché</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Un administrateur doit lier un compte <strong>Joueur</strong> à votre compte <strong>Parent</strong> depuis la
              fiche utilisateur (rattachement tuteur).
            </p>
          </motion.article>
        ) : (
          <>
            {linkedChildren.length > 1 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Enfant suivi :</span>
                <select
                  value={selectedChildId ?? ''}
                  onChange={(e) => setSelectedChildId(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm"
                >
                  {linkedChildren.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom} {c.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {childProfile && (
              <motion.article
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500" aria-hidden />
                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr,1.25fr] lg:items-start">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-teal-50 text-4xl ring-1 ring-slate-200/80">
                        {avatarIsImage ? (
                          <img src={childProfile.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden>👦</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Profil suivi</p>
                        <h3 className="text-2xl font-bold text-slate-900">{childProfile.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                            {childProfile.ageLabel}
                          </span>
                          <span className="rounded-full bg-teal-50 px-3 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-200/60">
                            Niveau {childProfile.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                        <span>Progression XP</span>
                        <span className="tabular-nums text-slate-500">
                          {childProfile.xp} / {childProfile.xpToNextLevel}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${xpPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {[
                      {
                        label: 'Score total',
                        value: childProfile.totalScore.toLocaleString('fr-FR'),
                        icon: Target,
                        sub: 'Points cumulés',
                      },
                      {
                        label: 'Temps cette semaine',
                        value: childProfile.weeklyPlayTime,
                        icon: Clock,
                        sub: 'Activité ludique',
                      },
                      {
                        label: 'Taux de réussite',
                        value: `${childProfile.averageSuccessRate} %`,
                        icon: TrendingUp,
                        sub: 'Moyenne estimée',
                      },
                      {
                        label: 'Série actuelle',
                        value: `${childProfile.currentStreak} j`,
                        icon: Flame,
                        sub: 'Jours consécutifs',
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-none ring-1 ring-slate-100/80"
                      >
                        <div className="mb-2 flex items-center gap-2 text-slate-500">
                          <stat.icon className="h-4 w-4 shrink-0 text-teal-600" />
                          <span className="text-[11px] font-semibold uppercase tracking-wide">{stat.label}</span>
                        </div>
                        <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{stat.value}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{stat.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.article>
            )}

            {childProfile && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="mb-8 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 p-6 shadow-sm ring-1 ring-amber-100/50 sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/60">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Conseil personnalisé</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Pour <span className="font-semibold text-slate-800">{firstName}</span>, alternez des sessions courtes et des pauses. La régularité
                      aide plus que de longues parties isolées. Les statistiques par type de jeu seront disponibles dans la
                      section Analyses.
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/parent/analytics', selectedChildNavState)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Voir les analyses détaillées
                      <ChevronRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              className="mb-8"
            >
              <h3 className="mb-4 text-lg font-bold text-slate-900">Accès rapides</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardCards.map((card, index) => (
                  <motion.button
                    key={card.title}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={card.action}
                    className={`group flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${card.borderHover}`}
                  >
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${card.iconBg} ${card.accent}`}
                    >
                      <card.icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <span className="text-base font-bold text-slate-900">{card.title}</span>
                    <span className="mt-1 text-sm leading-snug text-slate-500">{card.description}</span>
                    <span className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${card.accent}`}>
                      Ouvrir
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.section>

            {childProfile && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Compétences</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Calculé à partir des sessions terminées de l’enfant sélectionné
                    </p>
                  </div>
                </div>
                <ul className="space-y-5">
                  {(Object.keys(childProfile.skills) as (keyof SkillsMap)[]).map((skill) => {
                    const value = childProfile.skills[skill];
                    const label = SKILL_LABELS[skill];
                    const barColor =
                      value >= 80
                        ? 'bg-emerald-500'
                        : value >= 60
                          ? 'bg-teal-500'
                          : value >= 40
                            ? 'bg-sky-500'
                            : 'bg-amber-400';
                    return (
                      <li key={skill}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">{label}</span>
                          <span className="tabular-nums text-sm font-bold text-slate-600">{value} %</span>
                        </div>
                        <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
                            className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </motion.section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
