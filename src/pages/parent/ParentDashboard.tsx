import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Clock,
  Target,
  Flame,
  Lightbulb,
  ChevronRight,
  Loader2,
  Users,
  UserPlus,
} from 'lucide-react';
import { useAuth, useParentChildren } from '@/context';
import ChildSwitcher from '@/components/parent/ChildSwitcher';
import type { LinkedChildProfileDTO } from '@/api/types';

type SkillsMap = { math: number; logic: number; memory: number; reflex: number };

const SKILL_LABELS: Record<keyof SkillsMap, string> = {
  math: 'Quiz',
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

function formatWeeklyPlaytime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function mapChildToView(selected: LinkedChildProfileDTO) {
  const age = computeAgeFromIsoDate(selected.dateDeNaissance);
  return {
    name: `${selected.prenom} ${selected.nom}`.trim(),
    ageLabel: age != null ? `${age} ans` : 'Âge non renseigné',
    level: selected.niveau ?? 1,
    xp: selected.pointsExperience ?? 0,
    xpToNextLevel: Math.max(1, selected.xpToNextLevel ?? 100),
    totalScore: selected.scoreTotal ?? 0,
    currentStreak: selected.currentStreakDays ?? 0,
    // Calculées côté backend à partir des sessions terminées de cet enfant (0 tant qu'il n'a
    // joué aucune partie — pas d'estimation fictive à partir du niveau/XP).
    weeklyPlayTime: formatWeeklyPlaytime(selected.weeklyPlaytimeMinutes ?? 0),
    averageSuccessRate: selected.averageSuccessRate ?? 0,
    skills: {
      math: selected.skillMath ?? 0,
      logic: selected.skillLogic ?? 0,
      memory: selected.skillMemory ?? 0,
      reflex: selected.skillReflex ?? 0,
    } as SkillsMap,
    avatarUrl: selected.avatarUrl?.trim() || '',
  };
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { linkedChildren, loadingChildren, selectedChildId } = useParentChildren();

  if (user?.role !== 'parent') return null;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50/60 text-slate-900">
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
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : linkedChildren.length === 0 ? (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl border border-sky-200/80 bg-sky-50/50 p-8 text-center shadow-sm"
          >
            <Users className="mx-auto mb-4 h-12 w-12 text-sky-700" />
            <h3 className="text-lg font-bold text-slate-900">Aucun joueur pour le moment</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Ajoutez un compte joueur pour suivre sa progression. L’enfant pourra se connecter avec l’e-mail et le mot de passe que vous définissez.
            </p>
            <button
              type="button"
              onClick={() => navigate('/parent/add-child')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
            >
              <UserPlus className="h-4 w-4" />
              Ajouter un joueur
            </button>
          </motion.article>
        ) : (
          <>
            {linkedChildren.length > 1 && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium text-slate-600">Mes enfants ({linkedChildren.length})</p>
                <ChildSwitcher showAdd />
              </div>
            )}

            {childProfile && (
              <motion.article
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative mb-8 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-sky-400" aria-hidden />
                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr,1.25fr] lg:items-start">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 text-4xl ring-1 ring-white/15">
                        {avatarIsImage ? (
                          <img src={childProfile.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden>👦</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Profil suivi</p>
                        <h3 className="text-2xl font-bold text-slate-900">{childProfile.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-50 px-3 py-0.5 text-xs font-semibold text-slate-600">
                            {childProfile.ageLabel}
                          </span>
                          <span className="rounded-full bg-sky-50 px-3 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-blue-100">
                            Niveau {childProfile.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-300">
                        <span>Progression XP</span>
                        <span className="tabular-nums text-slate-400">
                          {childProfile.xp} / {childProfile.xpToNextLevel}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${xpPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
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
                        className="rounded-2xl border border-blue-100 bg-sky-50/40 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <stat.icon className="h-4 w-4 shrink-0 text-blue-700" />
                          <span className="text-[11px] font-semibold uppercase tracking-wide">{stat.label}</span>
                        </div>
                        <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{stat.value}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
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
                className="mb-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-700 ring-1 ring-amber-400/30">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Conseil personnalisé</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                      Pour <span className="font-semibold text-slate-900">{firstName}</span>, alternez des sessions courtes et des pauses. La régularité
                      aide plus que de longues parties isolées. Les statistiques par type de jeu seront disponibles dans la
                      section Analyses.
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/parent/analytics')}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Voir les analyses détaillées
                      <ChevronRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            )}

            {childProfile && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-sm"
              >
                <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Compétences</h3>
                    <p className="mt-1 text-sm text-slate-400">
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
                        ? 'bg-emerald-400'
                        : value >= 60
                          ? 'bg-cyan-400'
                          : value >= 40
                            ? 'bg-sky-400'
                            : 'bg-amber-400';
                    return (
                      <li key={skill}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-700">{label}</span>
                          <span className="tabular-nums text-sm font-bold text-slate-600">{value} %</span>
                        </div>
                        <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
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
