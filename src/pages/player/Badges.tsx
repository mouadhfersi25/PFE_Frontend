import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import userApi from '@/api/user/user.api';
import type { PlayerBadgeOverviewItemDTO } from '@/api/types/api.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';

export default function Badges() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<PlayerBadgeOverviewItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingBadgeId, setClaimingBadgeId] = useState<number | null>(null);
  const [celebrationBadge, setCelebrationBadge] = useState<PlayerBadgeOverviewItemDTO | null>(null);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const res = await userApi.getBadgesOverview();
      setBadges(Array.isArray(res.data?.badges) ? res.data.badges : []);
    } catch {
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    void loadBadges();
  }, []);

  useEffect(() => {
    if (!celebrationBadge) return;
    const timeout = window.setTimeout(() => setCelebrationBadge(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [celebrationBadge]);

  const earnedCount = useMemo(() => badges.filter((b) => b.earned).length, [badges]);
  const earnedBadges = useMemo(
    () => [...badges].filter((b) => b.earned).sort((a, b) => a.nom.localeCompare(b.nom)),
    [badges]
  );
  const availableBadges = useMemo(() => {
    const rank = (b: PlayerBadgeOverviewItemDTO) => (b.claimable ? 0 : 1);
    return [...badges]
      .filter((b) => !b.earned)
      .sort((a, b) => rank(a) - rank(b) || a.nom.localeCompare(b.nom));
  }, [badges]);

  const renderBadgeIcon = (badge: PlayerBadgeOverviewItemDTO, locked: boolean) => {
    const icon = (badge.icone || '🏅').trim();
    const isImage =
      icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('data:image/') ||
      icon.startsWith('/');
    if (isImage) {
      return (
        <img
          src={icon}
          alt={badge.nom}
          className={`h-16 w-16 object-cover rounded-xl ${locked ? 'grayscale opacity-50' : ''}`}
        />
      );
    }
    return <span className={`text-6xl ${locked ? 'grayscale opacity-50' : ''}`}>{icon}</span>;
  };

  const handleClaimBadge = async (badge: PlayerBadgeOverviewItemDTO) => {
    if (!badge || !badge.id) return;
    setClaimingBadgeId(badge.id);
    try {
      const res = await userApi.claimBadge(badge.id);
      await loadBadges();
      setCelebrationBadge(res.data ?? badge);
      toast.success(`Badge réclamé: ${badge.nom}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Impossible de réclamer ce badge.';
      toast.error(message);
    } finally {
      setClaimingBadgeId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-20 w-72 h-72 rounded-full bg-cyan-500/30 blur-3xl" />
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/player/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">Badges Collection</h1>
              <p className="text-sm text-slate-300">
                {earnedCount} of {badges.length} badges earned
              </p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl p-6 text-white border border-indigo-200/70 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">Your Progress</h3>
              <p className="text-white/90">Keep collecting badges to unlock special rewards!</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">{earnedCount}</p>
              <p className="text-white/90">badges</p>
            </div>
          </div>
          <div className="relative h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${badges.length ? (earnedCount / badges.length) * 100 : 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
            />
          </div>
        </motion.div>

        {loading && (
          <div className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-6 text-slate-200">
            Chargement des badges...
          </div>
        )}

        {/* Earned Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-cyan-300" />
            Badges gagnés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedBadges.map((badge, index) => {
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.06 * index }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="relative overflow-hidden rounded-2xl p-6 border-2 border-indigo-300/35 bg-gradient-to-br from-indigo-900/70 via-[#1d2457]/80 to-slate-950/90 backdrop-blur-xl transition-all flex flex-col min-h-[320px] shadow-[0_14px_40px_rgba(79,70,229,0.22)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-300/20 to-transparent" />
                  <div className="pointer-events-none absolute -top-14 -right-10 h-36 w-36 rounded-full bg-fuchsia-300/15 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
                  <div className="text-center mb-4 flex-1">
                    <div className="relative inline-block mb-3">
                      <div className="rounded-2xl p-3 bg-white/10 border border-indigo-200/35 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                        {renderBadgeIcon(badge, false)}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-white">{badge.nom}</h3>
                    <p className="text-sm mb-2 text-slate-200">{badge.description || 'Badge gagné.'}</p>

                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200/55 bg-cyan-500/20 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.22)] px-2 py-1 text-[11px] font-semibold">
                      ✓ Gagné
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {!loading && earnedBadges.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-300 mt-4">
              Aucun badge gagné pour le moment.
            </div>
          )}
        </motion.div>

        {/* Available Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300" />
            Badges disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableBadges.map((badge, index) => {
              const isClaimable = badge.claimable;
              const isLocked = !badge.claimable;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.06 * index }}
                  whileHover={{ scale: isLocked ? 1.01 : 1.04, y: isLocked ? 0 : -4 }}
                  className={[
                    'rounded-2xl p-6 border-2 backdrop-blur-xl transition-all flex flex-col min-h-[320px]',
                    isClaimable ? 'bg-amber-500/10 border-amber-300/45' : 'bg-white/5 border-white/20 opacity-60 shadow-none',
                  ].join(' ')}
                >
                  <div className="text-center mb-4 flex-1">
                    <div className="relative inline-block mb-3">
                      <div className={isLocked ? 'drop-shadow-none' : 'drop-shadow-[0_0_12px_rgba(250,204,21,0.35)]'}>
                        {renderBadgeIcon(badge, isLocked)}
                      </div>
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <h3 className={`text-xl font-bold mb-1 ${isLocked ? 'text-slate-300' : 'text-white'}`}>{badge.nom}</h3>
                    <p className={`text-sm mb-2 ${isLocked ? 'text-slate-400' : 'text-slate-200'}`}>{badge.description || 'Badge disponible.'}</p>
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold',
                        isClaimable ? 'border-amber-300/50 bg-amber-500/15 text-amber-200' : 'border-slate-400/40 bg-slate-700/40 text-slate-200',
                      ].join(' ')}
                    >
                      {isClaimable ? '⚡ Déblocable' : '🔒 Bloqué'}
                    </span>
                  </div>

                  {isClaimable && (
                    <button
                      type="button"
                      onClick={() => void handleClaimBadge(badge)}
                      disabled={claimingBadgeId === badge.id}
                      className="mt-auto w-full rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-sm font-black text-slate-900 transition-all hover:from-amber-300 hover:to-orange-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {claimingBadgeId === badge.id ? 'Réclamation...' : 'Réclamer ce badge'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
          {!loading && availableBadges.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-300 mt-4">
              Aucun badge disponible à débloquer.
            </div>
          )}
        </motion.div>

        {/* Motivation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎯</span>
            <h3 className="text-xl font-bold text-white">Keep Going!</h3>
          </div>
          <p className="text-slate-300">
            Complete challenges and games to unlock more badges. Each badge represents a unique
            achievement in your learning journey!
          </p>
        </motion.div>
      </div>

      {celebrationBadge && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 26 }).map((_, i) => (
              (() => {
                const angle = (i / 26) * Math.PI * 2;
                const distance = 220 + (i % 6) * 65;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;
                return (
                  <motion.span
                    key={`spark-${i}`}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.45 }}
                    animate={{
                      x: [0, dx],
                      y: [0, dy],
                      opacity: [0, 1, 1, 0],
                      scale: [0.45, 1, 0.8],
                      rotate: [0, 220],
                    }}
                    transition={{ duration: 2.2 + (i % 5) * 0.35, repeat: Infinity, delay: i * 0.06 }}
                    className="absolute left-1/2 top-1/2 text-2xl"
                  >
                    {i % 3 === 0 ? '✨' : i % 3 === 1 ? '🎉' : '🔥'}
                  </motion.span>
                );
              })()
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-xl rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-500/20 via-fuchsia-500/20 to-cyan-500/20 p-8 text-center text-white shadow-2xl shadow-amber-500/20"
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: [0.95, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="text-7xl mb-4 drop-shadow-[0_0_18px_rgba(251,191,36,0.9)]"
            >
              {renderBadgeIcon(celebrationBadge, false)}
            </motion.div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200 font-bold mb-2">CONGRATULATIONS</p>
            <h3 className="text-3xl font-black mb-2">Badge Réclamé !</h3>
            <p className="text-xl font-bold text-amber-200">{celebrationBadge.nom}</p>
            <p className="text-sm text-slate-200 mt-2">{celebrationBadge.description || 'Nouveau badge obtenu.'}</p>
            <div className="mt-5 rounded-xl border border-amber-300/40 bg-amber-400/15 px-4 py-3 text-sm text-amber-100">
              ✅ {celebrationBadge.unlockCondition}
            </div>
            <button
              type="button"
              onClick={() => setCelebrationBadge(null)}
              className="mt-6 rounded-xl bg-white text-slate-900 px-5 py-2 font-bold hover:bg-amber-100 transition-colors"
            >
              Continuer
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
