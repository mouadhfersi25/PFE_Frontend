import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Lock, LockOpen, CheckCircle2, Ticket, Sparkles, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import userApi from '@/api/user/user.api';
import type { PlayerRewardOverviewItemDTO } from '@/api/types/api.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';

const rewardTypeLabel = (type: string) => {
  if (type === 'BON_D_ACHAT') return "Bon d'achat";
  if (type === 'REDUCTION') return 'Réduction';
  if (type === 'CADEAU') return 'Cadeau';
  return 'Récompense';
};

const seenApprovedRewardsStorageKey = 'player-seen-approved-rewards';

const getSeenApprovedRewards = (): Set<string> => {
  try {
    const raw = window.localStorage.getItem(seenApprovedRewardsStorageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value) => typeof value === 'string'));
  } catch {
    return new Set();
  }
};

const markApprovedRewardAsSeen = (key: string) => {
  const seen = getSeenApprovedRewards();
  seen.add(key);
  window.localStorage.setItem(seenApprovedRewardsStorageKey, JSON.stringify([...seen]));
};

export default function Rewards() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<PlayerRewardOverviewItemDTO[]>([]);
  const [claimingRewardId, setClaimingRewardId] = useState<number | null>(null);
  const [approvedCelebrationReward, setApprovedCelebrationReward] = useState<PlayerRewardOverviewItemDTO | null>(null);
  const previousStatusByRewardIdRef = useRef<Map<number, string>>(new Map());

  const loadRewards = async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const res = await userApi.getRewardsOverview();
      const incoming = Array.isArray(res.data?.rewards) ? res.data.rewards : [];
      const previousMap = previousStatusByRewardIdRef.current;
      const seenApproved = getSeenApprovedRewards();
      const newlyApproved = incoming.find((reward) => {
        const prevStatus = (previousMap.get(reward.id) || '').toUpperCase();
        const nextStatus = (reward.requestStatus || '').toUpperCase();
        return prevStatus === 'PENDING' && nextStatus === 'APPROVED';
      });
      const unseenApproved = incoming.find((reward) => {
        const nextStatus = (reward.requestStatus || '').toUpperCase();
        if (nextStatus !== 'APPROVED') return false;
        const key = reward.claimId ? `claim-${reward.claimId}` : `reward-${reward.id}`;
        return !seenApproved.has(key);
      });
      const nextMap = new Map<number, string>();
      incoming.forEach((reward) => {
        nextMap.set(reward.id, (reward.requestStatus || '').toUpperCase());
      });
      previousStatusByRewardIdRef.current = nextMap;
      setRewards(incoming);
      const approvedToCelebrate = newlyApproved || unseenApproved;
      if (approvedToCelebrate) {
        setApprovedCelebrationReward(approvedToCelebrate);
      }
    } catch {
      setRewards([]);
    } finally {
      if (withLoader) setLoading(false);
    }
  };

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    void loadRewards();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadRewards(false);
    }, 8000);
    return () => window.clearInterval(interval);
  }, []);

  const pendingRewards = useMemo(() => rewards.filter((r) => r.requestStatus === 'PENDING'), [rewards]);
  const claimedRewards = useMemo(
    () => rewards.filter((r) => r.requestStatus === 'APPROVED' || r.claimed),
    [rewards]
  );
  const availableRewards = useMemo(() => {
    const rank = (reward: PlayerRewardOverviewItemDTO) => (reward.claimable ? 0 : 1);
    return rewards
      .filter((reward) => !reward.requestStatus || reward.requestStatus === 'REJECTED')
      .sort((a, b) => rank(a) - rank(b) || a.nom.localeCompare(b.nom));
  }, [rewards]);

  const handleClaimReward = async (reward: PlayerRewardOverviewItemDTO) => {
    if (!reward?.id) return;
    setClaimingRewardId(reward.id);
    try {
      await userApi.claimReward(reward.id);
      toast.success(`Réclamation envoyée: ${reward.nom}`);
      await loadRewards();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Impossible de réclamer cette récompense.';
      toast.error(message);
    } finally {
      setClaimingRewardId(null);
    }
  };

  const handlePrintRewardPdf = async (reward: PlayerRewardOverviewItemDTO) => {
    try {
      const claimRef = reward.claimId ? `EDU-CLM-${reward.claimId}` : `EDU-RWD-${reward.id}`;
      const issuedAt = reward.requestedDate || new Date().toISOString().slice(0, 10);
      const qrPayload = JSON.stringify({
        claimRef,
        rewardId: reward.id,
        rewardName: reward.nom,
        rewardType: reward.typeRecompense,
        status: reward.requestStatus || 'APPROVED',
        issuedAt,
      });
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 300 });

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFillColor(22, 28, 64);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 12, 186, 273, 6, 6, 'F');

      doc.setFillColor(49, 46, 129);
      doc.roundedRect(12, 12, 186, 42, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('EduGame AI - Bon de recompense', 20, 28);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reference: ${claimRef}`, 20, 38);

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Details de la recompense', 20, 65);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Nom: ${reward.nom}`, 20, 76);
      doc.text(`Type: ${rewardTypeLabel(reward.typeRecompense)}`, 20, 84);
      doc.text(`Date de reclamation: ${issuedAt}`, 20, 92);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Presentation du QR code a l entree', 20, 116);
      doc.addImage(qrDataUrl, 'PNG', 20, 122, 56, 56);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const infoText = doc.splitTextToSize(
        "Ce bon est personnel. Le sponsor verifiera le QR code pour confirmer la validite de la recompense. " +
        "Toute tentative de duplication ou modification rend ce bon invalide.",
        108
      );
      doc.text(infoText, 84, 132);

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(20, 202, 190, 202);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Signature / Cachet sponsor', 20, 212);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('EduGame AI - Portail recompenses physiques', 20, 220);

      doc.setFontSize(9);
      doc.text(`Document genere automatiquement le ${new Date().toLocaleString('fr-FR')}`, 20, 270);

      const safeName = reward.nom.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`recompense_${safeName}_${claimRef}.pdf`);
    } catch {
      toast.error("Impossible de generer le PDF de la recompense.");
    }
  };

  const renderRewardCard = (reward: PlayerRewardOverviewItemDTO, variant: 'available' | 'pending' | 'claimed') => {
    const claimed = variant === 'claimed';
    const pending = variant === 'pending';
    const claimable = variant === 'available' && reward.claimable;
    const locked = variant === 'available' && !reward.claimable;
    const approved = (reward.requestStatus || '').toUpperCase() === 'APPROVED';

    return (
      <motion.article
        key={reward.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={[
          'rounded-2xl border p-6 flex flex-col min-h-[260px] overflow-hidden relative backdrop-blur-xl',
          claimable ? 'border-emerald-300/45 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 shadow-[0_10px_28px_rgba(16,185,129,0.18)]' : '',
          claimed ? 'border-cyan-300/45 bg-gradient-to-br from-indigo-500/22 via-cyan-500/14 to-violet-500/18 shadow-[0_12px_35px_rgba(34,211,238,0.20)]' : '',
          pending ? 'border-amber-300/45 bg-gradient-to-br from-amber-500/16 to-orange-500/10 shadow-[0_10px_26px_rgba(251,191,36,0.16)]' : '',
          approved ? 'ring-1 ring-violet-300/35' : '',
          locked ? 'border-white/15 bg-slate-900/45 opacity-75' : '',
        ].join(' ')}
      >
        {claimed ? <div className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-cyan-300/16 blur-3xl" /> : null}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[1.55rem] font-black leading-tight text-white">{reward.nom}</h3>
            <p className="text-xs tracking-wide uppercase text-indigo-200/90 mt-1">{rewardTypeLabel(reward.typeRecompense)}</p>
          </div>
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${locked ? 'border-white/20 bg-white/5' : 'border-white/30 bg-white/10'}`}>
            {claimed ? <CheckCircle2 className="h-4 w-4 text-cyan-300" /> : pending ? <Ticket className="h-4 w-4 text-amber-300" /> : locked ? <Lock className="h-4 w-4 text-slate-300" /> : <Ticket className="h-4 w-4 text-emerald-300" />}
          </span>
        </div>

        <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-100/95">{reward.description || 'Récompense physique disponible pour les joueurs.'}</p>

        {claimable ? (
          <button
            type="button"
            onClick={() => void handleClaimReward(reward)}
            disabled={claimingRewardId === reward.id}
            className="mt-auto rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-black text-slate-900 hover:from-emerald-300 hover:to-green-400 disabled:opacity-60"
          >
            {claimingRewardId === reward.id ? 'Envoi...' : 'Réclamer la récompense'}
          </button>
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            {claimed ? (
              <button
                type="button"
                onClick={() => void handlePrintRewardPdf(reward)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-400 to-violet-500 px-4 py-2 text-sm font-black text-white hover:from-indigo-300 hover:to-violet-400"
              >
                <Download className="h-4 w-4" />
                Imprimer le bon PDF
              </button>
            ) : null}
            <span className={`inline-flex w-fit self-start rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${
              claimed
                ? 'border-cyan-300/50 bg-cyan-400/15 text-cyan-200'
                : pending
                  ? 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                : 'border-slate-300/30 bg-slate-700/35 text-slate-200'
            }`}>
              {claimed ? <LockOpen className="h-4 w-4" /> : pending ? 'En attente sponsor' : 'Bloquée'}
            </span>
          </div>
        )}
      </motion.article>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/player/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white inline-flex items-center gap-2">
                <Gift className="h-6 w-6 text-amber-300" />
                Récompenses physiques
              </h1>
              <p className="text-sm text-slate-300">Débloque et réclame tes récompenses sponsorisées.</p>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? <div className="rounded-2xl border border-white/15 bg-white/5 p-6">Chargement des récompenses...</div> : null}

        <section>
          <h2 className="text-xl font-bold text-white mb-4">Récompenses disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableRewards.map((reward) => renderRewardCard(reward, 'available'))}
          </div>
          {!loading && availableRewards.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-300 mt-4">
              Aucune récompense disponible pour le moment.
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">Récompenses réclamées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {claimedRewards.map((reward) => renderRewardCard(reward, 'claimed'))}
          </div>
          {!loading && claimedRewards.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-300 mt-4">
              Aucune récompense réclamée pour l'instant.
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">Demandes en cours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingRewards.map((reward) => renderRewardCard(reward, 'pending'))}
          </div>
          {!loading && pendingRewards.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-300 mt-4">
              Aucune demande en attente.
            </div>
          ) : null}
        </section>
      </main>

      {approvedCelebrationReward ? (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg rounded-3xl border border-violet-300/60 bg-gradient-to-br from-violet-500/20 via-indigo-500/20 to-cyan-500/20 p-7 text-center text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                const key = approvedCelebrationReward.claimId
                  ? `claim-${approvedCelebrationReward.claimId}`
                  : `reward-${approvedCelebrationReward.id}`;
                markApprovedRewardAsSeen(key);
                setApprovedCelebrationReward(null);
              }}
              className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200/60 bg-white/10">
              <Sparkles className="h-8 w-8 text-amber-300" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-100 font-bold mb-1">Reward Unlocked</p>
            <h3 className="text-3xl font-black mb-2">Récompense débloquée !</h3>
            <p className="text-lg font-semibold text-cyan-100">{approvedCelebrationReward.nom}</p>
            <p className="text-sm text-slate-200 mt-2">
              Le sponsor a approuvé ta demande. Ta récompense est maintenant débloquée.
            </p>
            <button
              type="button"
              onClick={() => {
                const key = approvedCelebrationReward.claimId
                  ? `claim-${approvedCelebrationReward.claimId}`
                  : `reward-${approvedCelebrationReward.id}`;
                markApprovedRewardAsSeen(key);
                setApprovedCelebrationReward(null);
              }}
              className="mt-6 rounded-xl bg-white text-slate-900 px-5 py-2 font-bold hover:bg-violet-100 transition-colors"
            >
              Super !
            </button>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
