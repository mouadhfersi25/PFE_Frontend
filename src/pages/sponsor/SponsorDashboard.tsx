import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Gift,
  BarChart3,
  TrendingUp,
  Coins,
  Eye,
  MousePointerClick,
  Power,
  Play,
  Pause,
  LogOut,
  Loader2,
  X,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import sponsorApi from '@/api/sponsor';
import type { SponsorPubliciteDTO, SponsorRecompenseDTO, SponsorRewardRequestDTO } from '@/api/types';

type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';

type SponsorCampaign = {
  id: number;
  title: string;
  audience: string;
  status: CampaignStatus;
  budgetSpent: number;
  budgetTotal: number;
  impressions: number;
  clicks: number;
};

type SponsorReward = {
  id: number;
  name: string;
  description: string;
  rewardType: string;
  pointsCost: number;
  enabled: boolean;
};

type RewardRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const initialCampaigns: SponsorCampaign[] = [
  {
    id: 1,
    title: 'Back to School 2026',
    audience: '7-12 ans',
    status: 'ACTIVE',
    budgetSpent: 1200,
    budgetTotal: 2000,
    impressions: 45200,
    clicks: 2380,
  },
  {
    id: 2,
    title: 'Challenge Logique',
    audience: '13-18 ans',
    status: 'PAUSED',
    budgetSpent: 820,
    budgetTotal: 1600,
    impressions: 23100,
    clicks: 970,
  },
  {
    id: 3,
    title: 'Promo badges premium',
    audience: 'Tous',
    status: 'DRAFT',
    budgetSpent: 0,
    budgetTotal: 900,
    impressions: 0,
    clicks: 0,
  },
];

const initialRewards: SponsorReward[] = [
  {
    id: 1,
    name: 'Ticket Match Football',
    description: 'Place tribune standard pour un match de championnat.',
    rewardType: 'CADEAU',
    pointsCost: 1500,
    enabled: true,
  },
  {
    id: 2,
    name: 'Ticket Concert',
    description: 'Billet standard pour concert partenaire.',
    rewardType: 'CADEAU',
    pointsCost: 2200,
    enabled: true,
  },
  {
    id: 3,
    name: "Bon d'achat",
    description: 'Bon d achat utilisable chez un partenaire retail.',
    rewardType: 'BON_D_ACHAT',
    pointsCost: 1000,
    enabled: true,
  },
];

type SponsorDashboardStatsDTO = {
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  distributedRewards: number;
  rewardStock: number;
};

const statusBadge = (status: CampaignStatus) => {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'PAUSED') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const statusLabel = (status: CampaignStatus) => {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'PAUSED') return 'En pause';
  return 'Brouillon';
};

const rewardTypeLabels: Record<string, string> = {
  BON_D_ACHAT: "Bon d'achat",
  REDUCTION: 'Réduction',
  CADEAU: 'Cadeau',
  AUTRE: 'Autre',
};

const rewardTypeOptions = Object.keys(rewardTypeLabels);

export default function SponsorDashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>(initialCampaigns);
  const [rewards, setRewards] = useState<SponsorReward[]>(initialRewards);
  const [apiStats, setApiStats] = useState<SponsorDashboardStatsDTO | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'campaigns' | 'rewards' | 'analytics'>('overview');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creatingReward, setCreatingReward] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [editingRewardId, setEditingRewardId] = useState<number | null>(null);
  const [rewardActionLoadingId, setRewardActionLoadingId] = useState<number | null>(null);
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);
  const [rewardRequests, setRewardRequests] = useState<SponsorRewardRequestDTO[]>([]);
  const [rewardRequestActionLoadingId, setRewardRequestActionLoadingId] = useState<number | null>(null);
  const [selectedReward, setSelectedReward] = useState<SponsorReward | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    nom: '',
    description: '',
    typeRecompense: 'BON_D_ACHAT',
    scoreMin: '1500',
  });
  const [createForm, setCreateForm] = useState({
    contenu: '',
    typePublicite: 'VIDEO',
    imageUrl: '',
    adDurationSeconds: '8',
    budgetUtilise: '0',
    ctaLabel: 'Voir l offre',
    ctaUrl: '',
  });

  const mapPublicitesToCampaigns = (rows: SponsorPubliciteDTO[]) => {
    return rows.map((item) => {
      const budgetSpent = item.budgetUtilise ?? 0;
      const budgetTotal = budgetSpent > 0 ? Math.round(budgetSpent * 1.25) : 100;
      const rawStatus = (item.status ?? '').toUpperCase();
      return {
        id: item.id,
        title: item.contenu,
        audience: 'Tous',
        status: rawStatus === 'ACTIVE' ? 'ACTIVE' : rawStatus === 'PAUSED' ? 'PAUSED' : 'DRAFT',
        budgetSpent,
        budgetTotal,
        impressions: item.nbVues ?? 0,
        clicks: item.nbClics ?? 0,
      } satisfies SponsorCampaign;
    });
  };

  const loadCampaigns = () => {
    sponsorApi.listPublicites()
      .then((res) => {
        const rows = Array.isArray(res.data) ? (res.data as SponsorPubliciteDTO[]) : [];
        if (rows.length === 0) return;
        setCampaigns(mapPublicitesToCampaigns(rows));
      })
      .catch(() => {
        setCampaigns(initialCampaigns);
      });
  };

  const mapRecompensesToRewards = (rows: SponsorRecompenseDTO[]): SponsorReward[] => {
    return rows.map((item) => {
      const rawStatus = (item.status ?? '').toUpperCase();
      const enabled = rawStatus ? rawStatus === 'ACTIVE' : true;
      return {
        id: item.id,
        name: item.nom ?? 'Récompense',
        description: item.description ?? '',
        rewardType: (item.typeRecompense ?? 'AUTRE').toUpperCase(),
        pointsCost: item.scoreMin ?? 0,
        enabled,
      };
    });
  };

  const mapSingleRecompense = (item: SponsorRecompenseDTO): SponsorReward => {
    return mapRecompensesToRewards([item])[0];
  };

  const loadRewards = () => {
    setIsRewardsLoading(true);
    sponsorApi.listRecompenses()
      .then((res) => {
        const rows = Array.isArray(res.data) ? (res.data as SponsorRecompenseDTO[]) : [];
        setRewards(mapRecompensesToRewards(rows));
      })
      .catch(() => {
        setRewards(initialRewards);
      })
      .finally(() => {
        setIsRewardsLoading(false);
      });
  };

  const loadRewardRequests = () => {
    sponsorApi.listRewardRequests()
      .then((res) => {
        const rows = Array.isArray(res.data) ? (res.data as SponsorRewardRequestDTO[]) : [];
        setRewardRequests(rows);
      })
      .catch(() => {
        setRewardRequests([]);
      });
  };

  useEffect(() => {
    let cancelled = false;

    sponsorApi.getDashboardStats()
      .then((res) => {
        if (cancelled) return;
        const data = res.data as Partial<SponsorDashboardStatsDTO>;
        setApiStats({
          activeCampaigns: data.activeCampaigns ?? 0,
          totalImpressions: data.totalImpressions ?? 0,
          totalClicks: data.totalClicks ?? 0,
          ctr: data.ctr ?? 0,
          distributedRewards: data.distributedRewards ?? 0,
          rewardStock: data.rewardStock ?? 0,
        });
      })
      .catch(() => {
        if (!cancelled) setApiStats(null);
      });

    sponsorApi.listPublicites()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? (res.data as SponsorPubliciteDTO[]) : [];
        if (rows.length === 0) return;
        setCampaigns(mapPublicitesToCampaigns(rows));
      })
      .catch(() => {
        if (!cancelled) setCampaigns(initialCampaigns);
      });

    sponsorApi.listRecompenses()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? (res.data as SponsorRecompenseDTO[]) : [];
        setRewards(mapRecompensesToRewards(rows));
      })
      .catch(() => {
        if (!cancelled) setRewards(initialRewards);
      });

    sponsorApi.listRewardRequests()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? (res.data as SponsorRewardRequestDTO[]) : [];
        setRewardRequests(rows);
      })
      .catch(() => {
        if (!cancelled) setRewardRequests([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const computedStats = useMemo(() => {
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
    const distributedRewards = 0;
    const rewardStock = rewards.length;

    return {
      activeCampaigns,
      totalImpressions,
      totalClicks,
      ctr,
      distributedRewards,
      rewardStock,
    };
  }, [campaigns, rewards]);

  const stats = apiStats ?? computedStats;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleCampaignStatus = (campaignId: number) => {
    setCampaigns((prev) => {
      const current = prev.find((c) => c.id === campaignId);
      if (!current) return prev;
      const nextActive = current.status !== 'ACTIVE';
      sponsorApi.setPubliciteStatus(campaignId, nextActive).catch(() => {
        // Keep optimistic UI behavior even if provider fails temporarily.
      });
      return prev.map((campaign) => {
        if (campaign.id !== campaignId) return campaign;
        return { ...campaign, status: nextActive ? 'ACTIVE' : 'PAUSED' };
      });
    });
  };

  const toggleReward = async (rewardId: number) => {
    const current = rewards.find((reward) => reward.id === rewardId);
    if (!current) return;
    const nextActive = !current.enabled;
    setRewardActionLoadingId(rewardId);
    try {
      const response = await sponsorApi.setRecompenseStatus(rewardId, nextActive);
      const updated = mapSingleRecompense(response.data as SponsorRecompenseDTO);
      setRewards((prev) => prev.map((reward) => (reward.id === rewardId ? updated : reward)));
      if (selectedReward?.id === rewardId) {
        setSelectedReward(updated);
      }
    } catch {
      setRewardError('Impossible de changer le statut pour cette récompense.');
    } finally {
      setRewardActionLoadingId(null);
    }
  };

  const resetRewardForm = () => {
    setRewardForm({
      nom: '',
      description: '',
      typeRecompense: 'BON_D_ACHAT',
      scoreMin: '1500',
    });
  };

  const handleEditReward = (reward: SponsorReward) => {
    setEditingRewardId(reward.id);
    setRewardError(null);
    setRewardForm({
      nom: reward.name,
      description: reward.description,
      typeRecompense: reward.rewardType,
      scoreMin: String(reward.pointsCost),
    });
  };

  const handleDeleteReward = async (rewardId: number) => {
    setRewardActionLoadingId(rewardId);
    try {
      await sponsorApi.deleteRecompense(rewardId);
      setRewards((prev) => prev.filter((reward) => reward.id !== rewardId));
      if (selectedReward?.id === rewardId) {
        setSelectedReward(null);
        setIsRewardModalOpen(false);
      }
    } catch {
      setRewardError("Suppression échouée. Réessayez dans quelques instants.");
    } finally {
      setRewardActionLoadingId(null);
    }
  };

  const handleViewReward = async (rewardId: number) => {
    setRewardActionLoadingId(rewardId);
    try {
      const response = await sponsorApi.getRecompenseById(rewardId);
      const reward = mapSingleRecompense(response.data as SponsorRecompenseDTO);
      setSelectedReward(reward);
      setIsRewardModalOpen(true);
    } catch {
      setRewardError('Impossible de charger les détails de cette récompense.');
    } finally {
      setRewardActionLoadingId(null);
    }
  };

  const rewardRequestStatusBadge = (status?: string | null) => {
    const normalized = (status ?? '').toUpperCase();
    if (normalized === 'APPROVED') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (normalized === 'REJECTED') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const rewardRequestStatusLabel = (status?: string | null) => {
    const normalized = (status ?? '').toUpperCase();
    if (normalized === 'APPROVED') return 'Approuvée';
    if (normalized === 'REJECTED') return 'Rejetée';
    return 'En attente';
  };

  const updateRewardRequestStatus = async (requestId: number, status: RewardRequestStatus) => {
    setRewardRequestActionLoadingId(requestId);
    try {
      const response = await sponsorApi.updateRewardRequestStatus(requestId, status);
      const updated = response.data as SponsorRewardRequestDTO;
      setRewardRequests((prev) => prev.map((item) => (item.id === requestId ? updated : item)));
    } catch {
      setRewardError('Impossible de mettre à jour le statut de la demande.');
    } finally {
      setRewardRequestActionLoadingId(null);
    }
  };

  const handleCreateOrUpdateReward = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nom = rewardForm.nom.trim();
    if (!nom) {
      setRewardError('Le nom de la récompense est obligatoire.');
      return;
    }
    const scoreMin = Number.parseInt(rewardForm.scoreMin, 10);
    if (Number.isNaN(scoreMin) || scoreMin < 0) {
      setRewardError('Le score minimum doit être un nombre positif.');
      return;
    }

    setRewardError(null);
    setCreatingReward(true);
    const payload = {
      nom,
      description: rewardForm.description.trim(),
      typeRecompense: rewardForm.typeRecompense,
      scoreMin,
    };
    try {
      if (editingRewardId) {
        const response = await sponsorApi.updateRecompense(editingRewardId, payload);
        const updated = mapRecompensesToRewards([response.data as SponsorRecompenseDTO])[0];
        setRewards((prev) => prev.map((reward) => (reward.id === editingRewardId ? updated : reward)));
        if (selectedReward?.id === editingRewardId) {
          setSelectedReward(updated);
        }
      } else {
        const response = await sponsorApi.createRecompense(payload);
        const created = mapRecompensesToRewards([response.data as SponsorRecompenseDTO])[0];
        setRewards((prev) => [created, ...prev]);
      }
      loadRewards();
      setEditingRewardId(null);
      resetRewardForm();
    } catch (error: unknown) {
      const fallbackMessage = "Opération échouée. Vérifiez les données saisies.";
      const responseMessage = (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response?: { data?: unknown } }).response?.data &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
      )
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setRewardError(responseMessage || fallbackMessage);
    } finally {
      setCreatingReward(false);
    }
  };

  const handleCreateCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const contenu = createForm.contenu.trim();
    const budget = Number.parseFloat(createForm.budgetUtilise);
    if (!contenu) {
      setCreateError('Le contenu est obligatoire.');
      return;
    }
    if (Number.isNaN(budget) || budget < 0) {
      setCreateError('Le budget doit être un nombre positif.');
      return;
    }
    if (!createForm.ctaUrl.trim()) {
      setCreateError("L'URL de l'offre est obligatoire pour le bouton de redirection.");
      return;
    }
    if (!createForm.imageUrl.trim()) {
      setCreateError('L URL video est obligatoire (mp4/webm/ogg).');
      return;
    }
    if (!/\.(mp4|webm|ogg)(\?.*)?$/i.test(createForm.imageUrl.trim())) {
      setCreateError('L URL video doit pointer vers un fichier .mp4, .webm ou .ogg.');
      return;
    }
    const adDuration = Number.parseInt(createForm.adDurationSeconds, 10);
    if (Number.isNaN(adDuration) || adDuration < 3 || adDuration > 60) {
      setCreateError('La duree pub doit etre entre 3 et 60 secondes.');
      return;
    }

    setCreateError(null);
    setCreatingCampaign(true);
    try {
      await sponsorApi.createPublicite({
        contenu,
        typePublicite: 'VIDEO',
        imageUrl: createForm.imageUrl.trim(),
        adDurationSeconds: adDuration,
        budgetUtilise: budget,
        ctaLabel: createForm.ctaLabel.trim(),
        ctaUrl: createForm.ctaUrl.trim(),
      });
      setCreateForm({
        contenu: '',
        typePublicite: 'VIDEO',
        imageUrl: '',
        adDurationSeconds: '8',
        budgetUtilise: '0',
        ctaLabel: 'Voir l offre',
        ctaUrl: '',
      });
      setIsCreateFormOpen(false);
      loadCampaigns();
    } catch {
      setCreateError('Création échouée. Vérifiez la configuration du provider externe.');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const sections = [
    { id: 'overview' as const, label: 'Vue d ensemble', icon: LayoutDashboard },
    { id: 'campaigns' as const, label: 'Publicités', icon: Megaphone },
    { id: 'rewards' as const, label: 'Récompenses', icon: Gift },
    { id: 'analytics' as const, label: 'Statistiques', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen flex">
        <aside className="hidden lg:flex w-72 border-r border-slate-200 bg-white flex-col">
          <div className="px-6 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img src="/logo-edugame.png" alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
              <div>
                <p className="text-base font-bold text-slate-900">EduGame AI</p>
                <p className="text-xs text-slate-500">Portail Sponsor</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  activeSection === section.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src="/logo-edugame.png"
                  alt="EduGame"
                  className="hidden h-7 max-h-7 w-auto max-w-[180px] shrink-0 object-contain object-left sm:block"
                />
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold text-slate-900">Dashboard Sponsor</h1>
                  <p className="text-sm text-slate-500">Espace professionnel de gestion publicitaire et récompenses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
            <div className="px-4 sm:px-6 pb-4 lg:hidden flex gap-2 overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${
                    activeSection === section.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500 mb-1">Campagnes actives</p>
                <p className="text-2xl font-black text-slate-900">{stats.activeCampaigns}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500 mb-1">Impressions total</p>
                <p className="text-2xl font-black text-slate-900">{stats.totalImpressions.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500 mb-1">CTR moyen</p>
                <p className="text-2xl font-black text-slate-900">{stats.ctr.toFixed(2)}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500 mb-1">Stock récompenses</p>
                <p className="text-2xl font-black text-slate-900">{stats.rewardStock}</p>
              </div>
            </section>

            {activeSection === 'overview' && (
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 inline-flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-slate-700" />
                    Publicités en cours
                  </h2>
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">{campaign.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(campaign.status)}`}>
                            {statusLabel(campaign.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{campaign.impressions.toLocaleString()} impressions</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 inline-flex items-center gap-2">
                    <Gift className="h-5 w-5 text-slate-700" />
                    Récompenses sponsorisées
                  </h2>
                  <div className="space-y-3">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">{reward.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${reward.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {reward.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{reward.pointsCost} pts • Type {rewardTypeLabels[reward.rewardType] ?? reward.rewardType}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'campaigns' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-slate-900 inline-flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-slate-700" />
                    Gestion des publicités
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateFormOpen((prev) => !prev)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    {isCreateFormOpen ? 'Fermer le formulaire' : 'Ajouter une pub'}
                  </button>
                </div>

                {isCreateFormOpen && (
                  <form onSubmit={handleCreateCampaign} className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Contenu</label>
                        <input
                          type="text"
                          value={createForm.contenu}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, contenu: e.target.value }))}
                          placeholder="Ex: Promo rentrée -10%"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                        <input
                          value="VIDEO"
                          disabled
                          className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">URL video (mp4/webm/ogg)</label>
                        <input
                          type="url"
                          value={createForm.imageUrl}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://exemple.com/annonce.mp4"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Duree pub (sec)</label>
                        <input
                          type="number"
                          min={3}
                          max={60}
                          value={createForm.adDurationSeconds}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, adDurationSeconds: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Label bouton</label>
                        <input
                          type="text"
                          value={createForm.ctaLabel}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                          placeholder="Ex: Voir l offre"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Budget utilisé</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={createForm.budgetUtilise}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, budgetUtilise: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">URL de l offre (obligatoire pour clic)</label>
                        <input
                          type="url"
                          value={createForm.ctaUrl}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                          placeholder="https://exemple.com/offre"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                    {createError && <p className="mt-2 text-xs font-semibold text-rose-600">{createError}</p>}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={creatingCampaign}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {creatingCampaign ? 'Création...' : 'Créer la pub'}
                      </button>
                    </div>
                  </form>
                )}
                <div className="space-y-3">
                  {campaigns.map((campaign) => {
                    const budgetPercent = campaign.budgetTotal > 0
                      ? Math.min(100, Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100))
                      : 0;
                    return (
                      <motion.article
                        key={campaign.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="text-base font-bold text-slate-900">{campaign.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Audience: {campaign.audience}</p>
                            <span className={`inline-flex mt-2 text-xs px-2 py-0.5 rounded-full border ${statusBadge(campaign.status)}`}>
                              {statusLabel(campaign.status)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCampaignStatus(campaign.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            {campaign.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {campaign.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                          <p className="inline-flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> {campaign.budgetSpent}/{campaign.budgetTotal} TND</p>
                          <p className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {campaign.impressions.toLocaleString()} impressions</p>
                          <p className="inline-flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5" /> {campaign.clicks.toLocaleString()} clics</p>
                        </div>

                        <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-900" style={{ width: `${budgetPercent}%` }} />
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            )}

            {activeSection === 'rewards' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-slate-900 inline-flex items-center gap-2">
                    <Gift className="h-5 w-5 text-slate-700" />
                    Gestion des récompenses physiques
                  </h2>
                  {editingRewardId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRewardId(null);
                        setRewardError(null);
                        resetRewardForm();
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Annuler l édition
                    </button>
                  ) : null}
                </div>

                <form onSubmit={handleCreateOrUpdateReward} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="xl:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nom de la récompense</label>
                      <input
                        type="text"
                        value={rewardForm.nom}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, nom: e.target.value }))}
                        placeholder="Ex: Ticket match football"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                      <select
                        value={rewardForm.typeRecompense}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, typeRecompense: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        {rewardTypeOptions.map((type) => (
                          <option key={type} value={type}>{rewardTypeLabels[type]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Score minimum</label>
                      <input
                        type="number"
                        min={0}
                        value={rewardForm.scoreMin}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, scoreMin: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                      <textarea
                        value={rewardForm.description}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                  {rewardError ? <p className="mt-2 text-xs font-semibold text-rose-600">{rewardError}</p> : null}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={creatingReward}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {creatingReward ? 'Enregistrement...' : editingRewardId ? 'Mettre à jour la récompense' : 'Créer la récompense'}
                    </button>
                  </div>
                </form>

                {isRewardsLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des récompenses...
                  </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {rewards.map((reward) => (
                    <article key={reward.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-900">{reward.name}</p>
                      <p className="text-xs text-indigo-700 font-semibold mt-1">{rewardTypeLabels[reward.rewardType] ?? reward.rewardType}</p>
                      {reward.description ? <p className="text-xs text-slate-500 mt-1">{reward.description}</p> : null}
                      <p className="text-xs text-slate-600 mt-2">{reward.pointsCost} pts</p>
                      <span className={`inline-flex mt-2 text-[11px] px-2 py-0.5 rounded-full border ${reward.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {reward.enabled ? 'Active' : 'Inactive'}
                      </span>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleReward(reward.id)}
                          disabled={rewardActionLoadingId === reward.id}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            reward.enabled
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-slate-700 text-white hover:bg-slate-800'
                          } disabled:opacity-60`}
                        >
                          {rewardActionLoadingId === reward.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                          {reward.enabled ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewReward(reward.id)}
                          disabled={rewardActionLoadingId === reward.id}
                          className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-60"
                        >
                          Voir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditReward(reward)}
                          disabled={rewardActionLoadingId === reward.id}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReward(reward.id)}
                          disabled={rewardActionLoadingId === reward.id}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
                        >
                          Supprimer
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">Demandes joueurs</h3>
                    <button
                      type="button"
                      onClick={loadRewardRequests}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Actualiser
                    </button>
                  </div>

                  {rewardRequests.length === 0 ? (
                    <p className="text-xs text-slate-500">Aucune demande pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      {rewardRequests.map((request) => {
                        const normalizedStatus = (request.status ?? 'PENDING').toUpperCase();
                        const isPending = normalizedStatus === 'PENDING';
                        return (
                          <article key={request.id} className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{request.rewardName ?? 'Récompense'}</p>
                                <p className="text-xs text-slate-500">
                                  Joueur: {request.playerName ?? 'Inconnu'} {request.playerEmail ? `(${request.playerEmail})` : ''}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Score joueur: {request.playerScoreTotal ?? 0} • Seuil: {request.rewardScoreMin ?? 0}
                                </p>
                              </div>
                              <span className={`inline-flex w-fit text-[11px] px-2 py-0.5 rounded-full border ${rewardRequestStatusBadge(request.status)}`}>
                                {rewardRequestStatusLabel(request.status)}
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {isPending ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={rewardRequestActionLoadingId === request.id}
                                    onClick={() => {
                                      if (!request.id) return;
                                      void updateRewardRequestStatus(request.id, 'APPROVED');
                                    }}
                                    className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
                                  >
                                    Approuver
                                  </button>
                                  <button
                                    type="button"
                                    disabled={rewardRequestActionLoadingId === request.id}
                                    onClick={() => {
                                      if (!request.id) return;
                                      void updateRewardRequestStatus(request.id, 'REJECTED');
                                    }}
                                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                  >
                                    Rejeter
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === 'analytics' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold text-slate-900 inline-flex items-center gap-2 mb-5">
                  <BarChart3 className="h-5 w-5 text-slate-700" />
                  Statistiques publicitaires
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaigns.map((campaign) => {
                    const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
                    const scaled = Math.min(100, Math.round(ctr * 10));
                    return (
                      <div key={campaign.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900 truncate">{campaign.title}</p>
                        <p className="text-xs text-slate-500 mt-1">CTR: {ctr.toFixed(2)}%</p>
                        <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-900" style={{ width: `${scaled}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700 inline-flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance globale: {stats.totalClicks.toLocaleString()} clics sur {stats.totalImpressions.toLocaleString()} impressions.
                  </p>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {isRewardModalOpen && selectedReward ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
          onClick={() => setIsRewardModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-slate-50 to-cyan-50 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Détail récompense</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">{selectedReward.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                  {rewardTypeLabels[selectedReward.rewardType] ?? selectedReward.rewardType}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  selectedReward.enabled
                    ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
                }`}>
                  {selectedReward.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Score minimum</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{selectedReward.pointsCost} pts</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {selectedReward.description || 'Aucune description fournie pour cette récompense.'}
                </p>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
