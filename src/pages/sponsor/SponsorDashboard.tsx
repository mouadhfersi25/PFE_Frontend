import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Gift,
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  Power,
  Play,
  Pause,
  LogOut,
  Loader2,
  X,
  Search,
  UserCircle,
  User,
  Mail,
  Phone,
  Lock,
  Save,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import sponsorApi from '@/api/sponsor';
import { userService } from '@/services/user.service';
import type { GameDTO, SponsorPubliciteDTO, SponsorRecompenseDTO, SponsorRewardRequestDTO, UserDTO } from '@/api/types';
import { validateRequired, validatePhone, validateMaxLength, validateMinLength, type ValidationResult } from '@/utils/formValidation';

type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';

type SponsorCampaign = {
  id: number;
  title: string;
  gamesLabel: string;
  jeuIds: number[];
  status: CampaignStatus;
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

type SponsorDashboardStatsDTO = {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  distributedRewards: number;
  rewardStock: number;
  pendingRewardRequests: number;
};

const statusBadge = (status: CampaignStatus) => {
  if (status === 'ACTIVE') return 'bg-emerald-100/80 text-emerald-800 border-emerald-200';
  if (status === 'PAUSED') return 'bg-amber-100/80 text-amber-900 border-amber-200';
  return 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]';
};

const statusLabel = (status: CampaignStatus) => {
  if (status === 'ACTIVE') return 'Actif';
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
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [rewards, setRewards] = useState<SponsorReward[]>([]);
  const [apiStats, setApiStats] = useState<SponsorDashboardStatsDTO | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'campaigns' | 'rewards' | 'analytics' | 'profile'>('overview');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignActionLoadingId, setCampaignActionLoadingId] = useState<number | null>(null);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);
  const [creatingReward, setCreatingReward] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [editingRewardId, setEditingRewardId] = useState<number | null>(null);
  const [rewardActionLoadingId, setRewardActionLoadingId] = useState<number | null>(null);
  const [isRewardsLoading, setIsRewardsLoading] = useState(true);
  const [rewardRequests, setRewardRequests] = useState<SponsorRewardRequestDTO[]>([]);
  const [rewardRequestActionLoadingId, setRewardRequestActionLoadingId] = useState<number | null>(null);
  const [selectedReward, setSelectedReward] = useState<SponsorReward | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [availableGames, setAvailableGames] = useState<GameDTO[]>([]);
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
    ctaLabel: 'Voir l offre',
    ctaUrl: '',
    jeuIds: [] as number[],
  });
  const [gameFilter, setGameFilter] = useState('');

  const filteredAvailableGames = useMemo(() => {
    const query = gameFilter.trim().toLowerCase();
    if (!query) return availableGames;
    return availableGames.filter((game) =>
      game.titre.toLowerCase().includes(query) || game.typeJeu.toLowerCase().includes(query)
    );
  }, [availableGames, gameFilter]);

  // --- Mon profil ---
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileFormErrors, setProfileFormErrors] = useState<ValidationResult>({});
  const [profileForm, setProfileForm] = useState({ nom: '', prenom: '', telephone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (activeSection !== 'profile' || profile) return;
    let cancelled = false;
    setProfileLoading(true);
    userService
      .getProfile()
      .then((data) => {
        if (cancelled) return;
        const d = data as UserDTO;
        setProfile(d);
        setProfileForm({ nom: d.nom ?? '', prenom: d.prenom ?? '', telephone: d.telephone ?? '' });
      })
      .catch((err: any) => {
        if (!cancelled) setProfileError(err?.response?.data?.message || err?.message || 'Erreur chargement profil');
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeSection, profile]);

  const validateProfileForm = (): boolean => {
    const next: ValidationResult = {};
    const prenomErr = validateRequired(profileForm.prenom, 'Le prénom est requis')
      ?? validateMaxLength(profileForm.prenom, 100, 'Maximum 100 caractères');
    if (prenomErr) next.prenom = prenomErr;
    const nomErr = validateRequired(profileForm.nom, 'Le nom est requis')
      ?? validateMaxLength(profileForm.nom, 100, 'Maximum 100 caractères');
    if (nomErr) next.nom = nomErr;
    const telephoneErr = validateRequired(profileForm.telephone, 'Le téléphone est requis')
      ?? validatePhone(profileForm.telephone, 'Le téléphone doit contenir 8 chiffres');
    if (telephoneErr) next.telephone = telephoneErr;
    setProfileFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await userService.updateProfile({
        nom: profileForm.nom || undefined,
        prenom: profileForm.prenom || undefined,
        telephone: profileForm.telephone || undefined,
      });
      setProfileSuccess('Profil mis à jour avec succès.');
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangeSponsorPassword = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    const pwdErrors: ValidationResult = {};
    const currentErr = validateRequired(passwordForm.currentPassword, 'Mot de passe actuel requis');
    if (currentErr) pwdErrors.currentPassword = currentErr;
    const newErr = validateRequired(passwordForm.newPassword, 'Nouveau mot de passe requis')
      ?? validateMinLength(passwordForm.newPassword, 6, 'Minimum 6 caractères');
    if (newErr) pwdErrors.newPassword = newErr;
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      pwdErrors.confirmPassword = 'La confirmation ne correspond pas au nouveau mot de passe';
    }
    setProfileFormErrors((prev) => ({ ...prev, ...pwdErrors }));
    if (Object.keys(pwdErrors).length > 0) return;

    setProfileSaving(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfileSuccess('Mot de passe modifié avec succès.');
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || err?.message || 'Erreur lors du changement du mot de passe');
    } finally {
      setProfileSaving(false);
    }
  };

  const mapPublicitesToCampaigns = (rows: SponsorPubliciteDTO[]) => {
    return rows.map((item) => {
      const rawStatus = (item.status ?? '').toUpperCase();
      const titres = (item.jeuTitres ?? []).filter(Boolean);
      return {
        id: item.id,
        title: item.contenu,
        gamesLabel: titres.length > 0 ? titres.join(', ') : 'Aucun jeu',
        jeuIds: item.jeuIds ?? [],
        status: rawStatus === 'ACTIVE' ? 'ACTIVE' : rawStatus === 'PAUSED' ? 'PAUSED' : 'DRAFT',
        impressions: item.nbVues ?? 0,
        clicks: item.nbClics ?? 0,
      } satisfies SponsorCampaign;
    });
  };

  const loadDashboardStats = () => {
    sponsorApi.getDashboardStats()
      .then((res) => {
        const data = res.data as Partial<SponsorDashboardStatsDTO>;
        setApiStats({
          totalCampaigns: data.totalCampaigns ?? 0,
          activeCampaigns: data.activeCampaigns ?? 0,
          pausedCampaigns: data.pausedCampaigns ?? 0,
          totalImpressions: data.totalImpressions ?? 0,
          totalClicks: data.totalClicks ?? 0,
          distributedRewards: data.distributedRewards ?? 0,
          rewardStock: data.rewardStock ?? 0,
          pendingRewardRequests: data.pendingRewardRequests ?? 0,
        });
      })
      .catch(() => {
        setApiStats(null);
      });
  };

  const loadCampaigns = () => {
    setIsCampaignsLoading(true);
    setCampaignError(null);
    sponsorApi.listPublicites()
      .then((res) => {
        const rows = Array.isArray(res.data) ? (res.data as SponsorPubliciteDTO[]) : [];
        setCampaigns(mapPublicitesToCampaigns(rows));
      })
      .catch(() => {
        setCampaigns([]);
        setCampaignError('Impossible de charger les publicités depuis le serveur.');
      })
      .finally(() => {
        setIsCampaignsLoading(false);
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
        setRewardError(null);
      })
      .catch(() => {
        setRewards([]);
        setRewardError('Impossible de charger les récompenses depuis le serveur.');
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

    setIsCampaignsLoading(true);
    setIsRewardsLoading(true);

    sponsorApi.getDashboardStats()
      .then((res) => {
        if (cancelled) return;
        const data = res.data as Partial<SponsorDashboardStatsDTO>;
        setApiStats({
          totalCampaigns: data.totalCampaigns ?? 0,
          activeCampaigns: data.activeCampaigns ?? 0,
          pausedCampaigns: data.pausedCampaigns ?? 0,
          totalImpressions: data.totalImpressions ?? 0,
          totalClicks: data.totalClicks ?? 0,
          distributedRewards: data.distributedRewards ?? 0,
          rewardStock: data.rewardStock ?? 0,
          pendingRewardRequests: data.pendingRewardRequests ?? 0,
        });
      })
      .catch(() => {
        if (!cancelled) setApiStats(null);
      });

    sponsorApi.listPublicites()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? (res.data as SponsorPubliciteDTO[]) : [];
        setCampaigns(mapPublicitesToCampaigns(rows));
        setCampaignError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setCampaigns([]);
          setCampaignError('Impossible de charger les publicités depuis le serveur.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsCampaignsLoading(false);
      });

    sponsorApi.listRecompenses()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? (res.data as SponsorRecompenseDTO[]) : [];
        setRewards(mapRecompensesToRewards(rows));
      })
      .catch(() => {
        if (!cancelled) {
          setRewards([]);
          setRewardError('Impossible de charger les récompenses depuis le serveur.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsRewardsLoading(false);
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

    sponsorApi.listJeux()
      .then((res) => {
        if (cancelled) return;
        setAvailableGames(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setAvailableGames([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const computedStats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const pausedCampaigns = campaigns.filter((c) => c.status !== 'ACTIVE').length;
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const distributedRewards = rewardRequests.filter(
      (request) => (request.status ?? '').toUpperCase() === 'APPROVED'
    ).length;
    const pendingRewardRequests = rewardRequests.filter(
      (request) => (request.status ?? '').toUpperCase() === 'PENDING'
    ).length;
    const rewardStock = rewards.filter((reward) => reward.enabled).length;

    return {
      totalCampaigns,
      activeCampaigns,
      pausedCampaigns,
      totalImpressions,
      totalClicks,
      distributedRewards,
      rewardStock,
      pendingRewardRequests,
    };
  }, [campaigns, rewards, rewardRequests]);

  const stats = useMemo(() => {
    if (!isCampaignsLoading || campaigns.length > 0) {
      return computedStats;
    }
    if (apiStats != null) {
      return apiStats;
    }
    return computedStats;
  }, [apiStats, campaigns.length, computedStats, isCampaignsLoading]);

  const campaignPerformance = useMemo(() => {
    return [...campaigns]
      .map((campaign) => ({ ...campaign }))
      .sort((a, b) => {
        if (b.impressions !== a.impressions) return b.impressions - a.impressions;
        return b.clicks - a.clicks;
      });
  }, [campaigns]);

  const topCampaign = campaignPerformance[0] ?? null;
  const maxImpressions = Math.max(1, ...campaignPerformance.map((c) => c.impressions));
  const maxClicks = Math.max(1, ...campaignPerformance.map((c) => c.clicks));

  const refreshAnalytics = () => {
    loadCampaigns();
    loadDashboardStats();
    loadRewards();
    loadRewardRequests();
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleCampaignStatus = async (campaignId: number) => {
    const current = campaigns.find((c) => c.id === campaignId);
    if (!current) return;
    const nextActive = current.status !== 'ACTIVE';
    setCampaignActionLoadingId(campaignId);
    setCampaignError(null);
    try {
      const response = await sponsorApi.setPubliciteStatus(campaignId, nextActive);
      const updated = mapPublicitesToCampaigns([response.data as SponsorPubliciteDTO])[0];
      setCampaigns((prev) => prev.map((campaign) => (campaign.id === campaignId ? updated : campaign)));
      loadDashboardStats();
    } catch {
      setCampaignError('Impossible de changer le statut de cette publicité.');
    } finally {
      setCampaignActionLoadingId(null);
    }
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
      loadDashboardStats();
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
      loadDashboardStats();
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
      loadDashboardStats();
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
      loadDashboardStats();
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
    if (!contenu) {
      setCreateError('Le contenu est obligatoire.');
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
    if (createForm.jeuIds.length === 0) {
      setCreateError('Sélectionnez au moins un jeu cible pour cette publicité.');
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
        videoUrl: createForm.imageUrl.trim(),
        imageUrl: createForm.imageUrl.trim(),
        adDurationSeconds: adDuration,
        ctaLabel: createForm.ctaLabel.trim(),
        ctaUrl: createForm.ctaUrl.trim(),
        jeuIds: createForm.jeuIds,
      });
      setCreateForm({
        contenu: '',
        typePublicite: 'VIDEO',
        imageUrl: '',
        adDurationSeconds: '8',
        ctaLabel: 'Voir l offre',
        ctaUrl: '',
        jeuIds: [],
      });
      setIsCreateFormOpen(false);
      loadCampaigns();
      loadDashboardStats();
    } catch (error: unknown) {
      const responseMessage = (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
      )
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setCreateError(responseMessage || 'Création échouée. Vérifiez les données et réessayez.');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const sections = [
    { id: 'overview' as const, label: 'Vue d ensemble', icon: LayoutDashboard },
    { id: 'campaigns' as const, label: 'Publicités', icon: Megaphone },
    { id: 'rewards' as const, label: 'Récompenses', icon: Gift },
    { id: 'analytics' as const, label: 'Statistiques', icon: BarChart3 },
    { id: 'profile' as const, label: 'Mon profil', icon: UserCircle },
  ];

  const sectionTitle = sections.find((s) => s.id === activeSection)?.label ?? 'Tableau de bord';

  const kpiItems = [
    {
      label: 'Campagnes actives',
      value: String(stats.activeCampaigns),
      hint: `${stats.totalCampaigns} au total · ${stats.pausedCampaigns} en pause`,
      icon: Megaphone,
    },
    {
      label: 'Impressions',
      value: stats.totalImpressions.toLocaleString(),
      hint: 'Vues en session de jeu',
      icon: Eye,
    },
    {
      label: 'Clics',
      value: stats.totalClicks.toLocaleString(),
      hint: 'Clics sur Voir l’offre',
      icon: MousePointerClick,
    },
  ];

  return (
    <div className="sponsor-shell min-h-screen">
      <div className="min-h-screen flex">
        <aside className="sponsor-aside hidden lg:flex sticky top-0 h-screen overflow-y-auto w-[280px] flex-col text-white shrink-0">
          <div className="px-6 py-7 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/15">
                <img src="/logo-edugame.png" alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
              </div>
              <div>
                <p className="sponsor-display text-xl font-bold text-white">EduGame</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#bae6fd]">Portail Sponsor</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`sponsor-nav-btn w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold ${
                  activeSection === section.id
                    ? 'is-active'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                  activeSection === section.id ? 'bg-[#0ea5e9]/25 text-[#e0f2fe]' : 'bg-white/8 text-white/80'
                }`}>
                  <section.icon className="h-4 w-4" />
                </span>
                {section.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/15 px-3 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/25 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 border-b border-[rgba(12,46,43,0.08)] bg-[rgba(250,248,244,0.82)] backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]/80">
                  Espace professionnel
                </p>
                <h1 className="sponsor-display mt-1 text-3xl font-extrabold text-[#0f172a] truncate">
                  {sectionTitle}
                </h1>
                <p className="mt-1 text-sm text-[#64748b]">
                  Publicités vidéo, récompenses et performance en un seul endroit.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="lg:hidden inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
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
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                    activeSection === section.id
                      ? 'bg-[#0f172a] text-white'
                      : 'bg-white/70 text-[#0f172a] border border-[rgba(37,99,235,0.14)]'
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {(activeSection === 'overview' || activeSection === 'analytics') && (
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {kpiItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.28 }}
                    className="sponsor-kpi rounded-3xl p-4 pl-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-[#64748b] mb-1">{item.label}</p>
                        <p className="sponsor-display text-3xl font-extrabold text-[#0f172a]">{item.value}</p>
                        <p className="mt-1.5 text-[11px] text-[#94a3b8]">{item.hint}</p>
                      </div>
                      <span className="sponsor-kpi-icon inline-flex h-10 w-10 items-center justify-center rounded-2xl">
                        <item.icon className="h-4.5 w-4.5 h-4 w-4" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </section>
            )}

            {activeSection === 'overview' && (
              <motion.section
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-6"
              >
                <div className="sponsor-panel rounded-3xl p-6">
                  <h2 className="sponsor-display text-2xl font-bold text-[#0f172a] mb-4 inline-flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb]">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    Publicités en cours
                  </h2>
                  <div className="space-y-3">
                    {isCampaignsLoading ? (
                      <p className="text-sm text-[#64748b] inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des publicités...
                      </p>
                    ) : campaigns.length === 0 ? (
                      <p className="text-sm text-[#64748b]">Aucune publicité pour le moment.</p>
                    ) : (
                      campaigns.map((campaign) => (
                      <div key={campaign.id} className="sponsor-soft-item rounded-2xl p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[#0f172a]">{campaign.title}</p>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusBadge(campaign.status)}`}>
                            {statusLabel(campaign.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#64748b]">
                          {campaign.impressions.toLocaleString()} vues · {campaign.clicks.toLocaleString()} clics
                        </p>
                        <p className="mt-1 text-xs text-[#94a3b8]">Jeux: {campaign.gamesLabel}</p>
                      </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="sponsor-panel rounded-3xl p-6">
                  <h2 className="sponsor-display text-2xl font-bold text-[#0f172a] mb-4 inline-flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0ea5e9]">
                      <Gift className="h-4 w-4" />
                    </span>
                    Récompenses sponsorisées
                  </h2>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="sponsor-soft-item rounded-2xl px-3 py-2.5">
                      <p className="text-[11px] text-[#64748b]">Actives</p>
                      <p className="sponsor-display text-xl font-bold text-[#0f172a]">{stats.rewardStock}</p>
                    </div>
                    <div className="sponsor-soft-item rounded-2xl px-3 py-2.5">
                      <p className="text-[11px] text-[#64748b]">Demandes en attente</p>
                      <p className="sponsor-display text-xl font-bold text-[#0f172a]">{stats.pendingRewardRequests}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {isRewardsLoading ? (
                      <p className="text-sm text-[#64748b] inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des récompenses...
                      </p>
                    ) : rewards.length === 0 ? (
                      <p className="text-sm text-[#64748b]">Aucune récompense pour le moment.</p>
                    ) : (
                      rewards.map((reward) => (
                      <div key={reward.id} className="sponsor-soft-item rounded-2xl p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[#0f172a]">{reward.name}</p>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${reward.enabled ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' : 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]'}`}>
                            {reward.enabled ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#64748b]">{reward.pointsCost} pts • Type {rewardTypeLabels[reward.rewardType] ?? reward.rewardType}</p>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {activeSection === 'campaigns' && (
              <motion.section
                key="campaigns"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="sponsor-panel rounded-3xl p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <h2 className="sponsor-display text-2xl font-bold text-[#0f172a] inline-flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb]">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    Gestion des publicités
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateFormOpen((prev) => !prev)}
                    className="sponsor-primary-btn inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold"
                  >
                    {isCreateFormOpen ? 'Fermer le formulaire' : 'Ajouter une pub'}
                  </button>
                </div>

                {isCreateFormOpen && (
                  <form onSubmit={handleCreateCampaign} className="mb-5 sponsor-soft-item rounded-2xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label htmlFor="ad-contenu" className="block text-xs font-semibold text-[#64748b] mb-1">Contenu</label>
                        <input
                          id="ad-contenu"
                          type="text"
                          value={createForm.contenu}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, contenu: e.target.value }))}
                          placeholder="Ex: Promo rentrée -10%"
                          className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                        />
                      </div>
                      <div>
                        <label htmlFor="ad-type" className="block text-xs font-semibold text-[#64748b] mb-1">Type</label>
                        <input
                          id="ad-type"
                          value="VIDEO"
                          disabled
                          className="w-full rounded-xl border border-[rgba(37,99,235,0.14)] bg-[#f1f5f9] px-3 py-2.5 text-sm text-[#475569]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="ad-videoUrl" className="block text-xs font-semibold text-[#64748b] mb-1">URL video (mp4/webm/ogg)</label>
                        <input
                          id="ad-videoUrl"
                          type="url"
                          value={createForm.imageUrl}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://exemple.com/annonce.mp4"
                          className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                        />
                      </div>
                      <div>
                        <label htmlFor="ad-duration" className="block text-xs font-semibold text-[#64748b] mb-1">Duree pub (sec)</label>
                        <input
                          id="ad-duration"
                          type="number"
                          min={3}
                          max={60}
                          value={createForm.adDurationSeconds}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, adDurationSeconds: e.target.value }))}
                          className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                        />
                      </div>
                      <div>
                        <label htmlFor="ad-ctaLabel" className="block text-xs font-semibold text-[#64748b] mb-1">Label bouton</label>
                        <input
                          id="ad-ctaLabel"
                          type="text"
                          value={createForm.ctaLabel}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                          placeholder="Ex: Voir l offre"
                          className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="ad-ctaUrl" className="block text-xs font-semibold text-[#64748b] mb-1">URL de l offre (obligatoire pour clic)</label>
                        <input
                          id="ad-ctaUrl"
                          type="url"
                          value={createForm.ctaUrl}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                          placeholder="https://exemple.com/offre"
                          className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <label className="block text-xs font-semibold text-[#64748b]">
                            Jeux cibles (plusieurs possibles)
                          </label>
                          {createForm.jeuIds.length > 0 && (
                            <span className="text-[11px] font-semibold text-[#2563eb] bg-[#dbeafe] px-2 py-0.5 rounded-full">
                              {createForm.jeuIds.length} sélectionné{createForm.jeuIds.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {availableGames.length === 0 ? (
                          <p className="text-xs text-[#64748b]">
                            Aucun jeu publié disponible. Les pubs doivent cibler des jeux actifs.
                          </p>
                        ) : (
                          <>
                            <div className="relative mb-2">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                              <input
                                type="text"
                                value={gameFilter}
                                onChange={(e) => setGameFilter(e.target.value)}
                                placeholder="Filtrer par nom ou type de jeu..."
                                className="sponsor-input w-full rounded-xl pl-9 pr-3 py-2 text-sm text-[#0f172a]"
                              />
                            </div>
                            <div className="flex items-center gap-3 mb-2 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={() => setCreateForm((prev) => ({
                                  ...prev,
                                  jeuIds: Array.from(new Set([...prev.jeuIds, ...filteredAvailableGames.map((g) => g.id)])),
                                }))}
                                className="text-[#2563eb] hover:underline"
                              >
                                Tout sélectionner{gameFilter.trim() ? ' (filtrés)' : ''}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCreateForm((prev) => ({
                                  ...prev,
                                  jeuIds: prev.jeuIds.filter((id) => !filteredAvailableGames.some((g) => g.id === id)),
                                }))}
                                className="text-[#64748b] hover:underline"
                              >
                                Tout désélectionner
                              </button>
                            </div>
                            {filteredAvailableGames.length === 0 ? (
                              <p className="text-xs text-[#64748b] rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white p-3">
                                Aucun jeu ne correspond à « {gameFilter} ».
                              </p>
                            ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white p-3 max-h-48 overflow-y-auto">
                            {filteredAvailableGames.map((game) => {
                              const checked = createForm.jeuIds.includes(game.id);
                              return (
                                <label
                                  key={game.id}
                                  className={`inline-flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                                    checked ? 'bg-[#dbeafe] text-[#0f172a]' : 'text-[#64748b] hover:bg-[#f3efe6]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setCreateForm((prev) => ({
                                        ...prev,
                                        jeuIds: checked
                                          ? prev.jeuIds.filter((id) => id !== game.id)
                                          : [...prev.jeuIds, game.id],
                                      }));
                                    }}
                                    className="mt-0.5 accent-[#2563eb]"
                                  />
                                  <span>
                                    <span className="font-semibold">{game.titre}</span>
                                    <span className="block text-[11px] opacity-70">{game.typeJeu}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {createError && <p className="mt-2 text-xs font-semibold text-rose-600">{createError}</p>}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={creatingCampaign}
                        className="sponsor-primary-btn inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                      >
                        {creatingCampaign ? 'Création...' : 'Créer la pub'}
                      </button>
                    </div>
                  </form>
                )}
                {campaignError ? <p className="mb-3 text-xs font-semibold text-rose-600">{campaignError}</p> : null}
                <div className="space-y-3">
                  {isCampaignsLoading ? (
                    <div className="sponsor-soft-item rounded-2xl p-4 text-sm text-[#64748b] inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des publicités...
                    </div>
                  ) : campaigns.length === 0 ? (
                    <p className="text-sm text-[#64748b]">Aucune publicité côté serveur pour le moment.</p>
                  ) : (
                    campaigns.map((campaign) => {
                    return (
                      <motion.article
                        key={campaign.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sponsor-soft-item rounded-2xl p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="text-base font-bold text-[#0f172a]">{campaign.title}</p>
                            <p className="text-xs text-[#64748b] mt-0.5">Jeux: {campaign.gamesLabel}</p>
                            <span className={`inline-flex mt-2 text-xs px-2.5 py-0.5 rounded-full border ${statusBadge(campaign.status)}`}>
                              {statusLabel(campaign.status)}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={campaignActionLoadingId === campaign.id}
                            onClick={() => {
                              void toggleCampaignStatus(campaign.id);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(12,46,43,0.12)] bg-white px-3.5 py-2 text-sm font-semibold text-[#0f172a] hover:bg-[#f3efe6] transition-colors disabled:opacity-60"
                          >
                            {campaignActionLoadingId === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : campaign.status === 'ACTIVE' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            {campaign.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#64748b]">
                          <p className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-[#2563eb]" /> {campaign.impressions.toLocaleString()} impressions</p>
                          <p className="inline-flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5 text-[#2563eb]" /> {campaign.clicks.toLocaleString()} clics</p>
                        </div>
                      </motion.article>
                    );
                  })
                  )}
                </div>
              </motion.section>
            )}

            {activeSection === 'rewards' && (
              <motion.section
                key="rewards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="sponsor-panel rounded-3xl p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <h2 className="sponsor-display text-2xl font-bold text-[#0f172a] inline-flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0ea5e9]">
                      <Gift className="h-4 w-4" />
                    </span>
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
                      className="inline-flex items-center justify-center rounded-2xl border border-[rgba(12,46,43,0.12)] bg-white px-3.5 py-2 text-sm font-semibold text-[#0f172a] hover:bg-[#f3efe6] transition-colors"
                    >
                      Annuler l édition
                    </button>
                  ) : null}
                </div>

                <form onSubmit={handleCreateOrUpdateReward} className="mb-5 sponsor-soft-item rounded-2xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="xl:col-span-2">
                      <label htmlFor="reward-nom" className="block text-xs font-semibold text-[#64748b] mb-1">Nom de la récompense</label>
                      <input
                        id="reward-nom"
                        type="text"
                        value={rewardForm.nom}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, nom: e.target.value }))}
                        placeholder="Ex: Ticket match football"
                        className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                      />
                    </div>
                    <div>
                      <label htmlFor="reward-type" className="block text-xs font-semibold text-[#64748b] mb-1">Type</label>
                      <select
                        id="reward-type"
                        value={rewardForm.typeRecompense}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, typeRecompense: e.target.value }))}
                        className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                      >
                        {rewardTypeOptions.map((type) => (
                          <option key={type} value={type}>{rewardTypeLabels[type]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reward-scoreMin" className="block text-xs font-semibold text-[#64748b] mb-1">Score minimum</label>
                      <input
                        id="reward-scoreMin"
                        type="number"
                        min={0}
                        value={rewardForm.scoreMin}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, scoreMin: e.target.value }))}
                        className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="reward-description" className="block text-xs font-semibold text-[#64748b] mb-1">Description</label>
                      <textarea
                        id="reward-description"
                        value={rewardForm.description}
                        onChange={(e) => setRewardForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                      />
                    </div>
                  </div>
                  {rewardError ? <p className="mt-2 text-xs font-semibold text-rose-600">{rewardError}</p> : null}
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={creatingReward}
                      className="sponsor-primary-btn inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      {creatingReward ? 'Enregistrement...' : editingRewardId ? 'Mettre à jour la récompense' : 'Créer la récompense'}
                    </button>
                  </div>
                </form>

                {isRewardsLoading ? (
                  <div className="sponsor-soft-item rounded-2xl p-4 text-sm text-[#64748b] inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des récompenses...
                  </div>
                ) : rewards.length === 0 ? (
                  <p className="mb-3 text-sm text-[#64748b]">Aucune récompense côté serveur pour le moment.</p>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {rewards.map((reward) => (
                    <article key={reward.id} className="sponsor-soft-item rounded-2xl p-4">
                      <p className="text-sm font-bold text-[#0f172a]">{reward.name}</p>
                      <p className="text-xs text-[#2563eb] font-semibold mt-1">{rewardTypeLabels[reward.rewardType] ?? reward.rewardType}</p>
                      {reward.description ? <p className="text-xs text-[#64748b] mt-1">{reward.description}</p> : null}
                      <p className="text-xs text-[#64748b] mt-2">{reward.pointsCost} pts</p>
                      <span className={`inline-flex mt-2 text-[11px] px-2.5 py-0.5 rounded-full border ${reward.enabled ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' : 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]'}`}>
                        {reward.enabled ? 'Actif' : 'Inactif'}
                      </span>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleReward(reward.id)}
                          disabled={rewardActionLoadingId === reward.id}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                            reward.enabled
                              ? 'bg-[#2563eb] text-white hover:bg-[#155851]'
                              : 'bg-[#0f172a] text-white hover:bg-[#1d4ed8]'
                          } disabled:opacity-60`}
                        >
                          {rewardActionLoadingId === reward.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                          {reward.enabled ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewReward(reward.id)}
                          disabled={rewardActionLoadingId === reward.id}
                          className="inline-flex items-center justify-center rounded-xl border border-[#dbeafe] bg-[#dbeafe]/60 px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#dbeafe] transition-colors disabled:opacity-60"
                        >
                          Voir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditReward(reward)}
                          disabled={rewardActionLoadingId === reward.id}
                          className="inline-flex items-center justify-center rounded-xl border border-[rgba(12,46,43,0.12)] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#f3efe6] transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReward(reward.id)}
                          disabled={rewardActionLoadingId === reward.id}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
                        >
                          Supprimer
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 sponsor-soft-item rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#0f172a]">Demandes joueurs</h3>
                    <button
                      type="button"
                      onClick={loadRewardRequests}
                      className="rounded-xl border border-[rgba(12,46,43,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f172a] hover:bg-[#f3efe6]"
                    >
                      Actualiser
                    </button>
                  </div>

                  {rewardRequests.length === 0 ? (
                    <p className="text-xs text-[#64748b]">Aucune demande pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      {rewardRequests.map((request) => {
                        const normalizedStatus = (request.status ?? 'PENDING').toUpperCase();
                        const isPending = normalizedStatus === 'PENDING';
                        return (
                          <article key={request.id} className="rounded-2xl border border-[rgba(12,46,43,0.08)] bg-white p-3.5">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-[#0f172a]">{request.rewardName ?? 'Récompense'}</p>
                                <p className="text-xs text-[#64748b]">
                                  Joueur: {request.playerName ?? 'Inconnu'} {request.playerEmail ? `(${request.playerEmail})` : ''}
                                </p>
                                <p className="text-xs text-[#64748b]">
                                  Score joueur: {request.playerScoreTotal ?? 0} • Seuil: {request.rewardScoreMin ?? 0}
                                </p>
                              </div>
                              <span className={`inline-flex w-fit text-[11px] px-2.5 py-0.5 rounded-full border ${rewardRequestStatusBadge(request.status)}`}>
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
                                    className="rounded-xl bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white hover:bg-[#155851] disabled:opacity-60"
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
                                    className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
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
              </motion.section>
            )}

            {activeSection === 'analytics' && (
              <motion.section
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="sponsor-panel rounded-3xl p-6">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="sponsor-display text-2xl font-bold text-[#0f172a] inline-flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb]">
                        <BarChart3 className="h-4 w-4" />
                      </span>
                      Statistiques publicitaires
                    </h2>
                    <button
                      type="button"
                      onClick={refreshAnalytics}
                      className="inline-flex items-center justify-center rounded-2xl border border-[rgba(12,46,43,0.12)] bg-white px-3.5 py-2 text-sm font-semibold text-[#0f172a] hover:bg-[#f3efe6]"
                    >
                      Actualiser
                    </button>
                  </div>

                  <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Impressions (vues)', value: stats.totalImpressions.toLocaleString() },
                      { label: 'Clics sur l’offre', value: stats.totalClicks.toLocaleString() },
                      { label: 'Campagnes actives', value: String(stats.activeCampaigns) },
                    ].map((card) => (
                      <div key={card.label} className="sponsor-soft-item rounded-2xl p-3.5">
                        <p className="text-xs text-[#64748b]">{card.label}</p>
                        <p className="sponsor-display mt-1 text-xl font-bold text-[#0f172a]">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {topCampaign ? (
                    <div className="mb-5 rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#dbeafe]/80 to-[#e0f2fe]/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
                        Meilleure campagne (vues)
                      </p>
                      <p className="mt-1 text-base font-bold text-[#0f172a]">{topCampaign.title}</p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        {topCampaign.impressions.toLocaleString()} vues · {topCampaign.clicks.toLocaleString()} clics
                      </p>
                      <p className="mt-1 text-xs text-[#94a3b8]">Jeux: {topCampaign.gamesLabel}</p>
                    </div>
                  ) : null}

                  {isCampaignsLoading ? (
                    <p className="text-sm text-[#64748b] inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des statistiques...
                    </p>
                  ) : campaignPerformance.length === 0 ? (
                    <p className="text-sm text-[#64748b]">Aucune publicité à analyser pour le moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {campaignPerformance.map((campaign, index) => (
                        <article
                          key={campaign.id}
                          className="sponsor-soft-item rounded-2xl p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#0f172a]">
                                #{index + 1} · {campaign.title}
                              </p>
                              <p className="mt-0.5 text-xs text-[#64748b]">Jeux: {campaign.gamesLabel}</p>
                              <span className={`inline-flex mt-2 text-[11px] px-2.5 py-0.5 rounded-full border ${statusBadge(campaign.status)}`}>
                                {statusLabel(campaign.status)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-right">
                              <div>
                                <p className="text-[11px] text-[#64748b]">Vues</p>
                                <p className="text-sm font-bold text-[#0f172a]">{campaign.impressions.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-[#64748b]">Clics</p>
                                <p className="text-sm font-bold text-[#0f172a]">{campaign.clicks.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div>
                              <div className="mb-1 flex items-center justify-between text-[11px] text-[#64748b]">
                                <span>Impressions</span>
                                <span>{Math.round((campaign.impressions / maxImpressions) * 100)}%</span>
                              </div>
                              <div className="sponsor-progress h-2 rounded-full overflow-hidden">
                                <span
                                  className="block h-full rounded-full"
                                  style={{ width: `${Math.max(4, Math.round((campaign.impressions / maxImpressions) * 100))}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 flex items-center justify-between text-[11px] text-[#64748b]">
                                <span>Clics</span>
                                <span>{Math.round((campaign.clicks / maxClicks) * 100)}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-[rgba(12,46,43,0.08)] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#2563eb]"
                                  style={{ width: `${Math.max(campaign.clicks > 0 ? 4 : 0, Math.round((campaign.clicks / maxClicks) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border border-[rgba(12,46,43,0.08)] bg-[#f3efe6]/70 p-4">
                    <p className="text-sm text-[#0f172a] inline-flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#2563eb]" />
                      Performance globale: {stats.totalClicks.toLocaleString()} clics sur {stats.totalImpressions.toLocaleString()} impressions
                      {' '}· {stats.distributedRewards} récompenses distribuées.
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {activeSection === 'profile' && (
              <motion.section
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {profileLoading ? (
                  <div className="sponsor-panel rounded-3xl p-8 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
                  </div>
                ) : !profile ? (
                  <div className="sponsor-panel rounded-3xl p-8 text-[#64748b]">Profil introuvable.</div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <form onSubmit={handleSaveProfile} className="xl:col-span-2 sponsor-panel rounded-3xl p-6 space-y-5">
                      <h2 className="sponsor-display text-2xl font-bold text-[#0f172a] inline-flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb]">
                          <UserCircle className="h-4 w-4" />
                        </span>
                        Mes informations
                      </h2>

                      {profileError && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{profileError}</div>}
                      {profileSuccess && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm">{profileSuccess}</div>}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="sponsor-profile-prenom" className="block text-xs font-semibold text-[#64748b] mb-1 inline-flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> Prénom
                          </label>
                          <input
                            id="sponsor-profile-prenom"
                            type="text"
                            value={profileForm.prenom}
                            onChange={(e) => {
                              setProfileForm((prev) => ({ ...prev, prenom: e.target.value }));
                              setProfileFormErrors((prev) => ({ ...prev, prenom: '' }));
                            }}
                            className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                          />
                          {profileFormErrors.prenom && <p className="mt-1 text-xs text-red-600">{profileFormErrors.prenom}</p>}
                        </div>
                        <div>
                          <label htmlFor="sponsor-profile-nom" className="block text-xs font-semibold text-[#64748b] mb-1 inline-flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> Nom
                          </label>
                          <input
                            id="sponsor-profile-nom"
                            type="text"
                            value={profileForm.nom}
                            onChange={(e) => {
                              setProfileForm((prev) => ({ ...prev, nom: e.target.value }));
                              setProfileFormErrors((prev) => ({ ...prev, nom: '' }));
                            }}
                            className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                          />
                          {profileFormErrors.nom && <p className="mt-1 text-xs text-red-600">{profileFormErrors.nom}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="sponsor-profile-email" className="block text-xs font-semibold text-[#64748b] mb-1 inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> E-mail
                        </label>
                        <input
                          id="sponsor-profile-email"
                          type="email"
                          value={profile.email ?? ''}
                          readOnly
                          className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#94a3b8] bg-[#f1f5f9]/60 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label htmlFor="sponsor-profile-telephone" className="block text-xs font-semibold text-[#64748b] mb-1 inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> Téléphone
                        </label>
                        <input
                          id="sponsor-profile-telephone"
                          type="text"
                          value={profileForm.telephone}
                          onChange={(e) => {
                            setProfileForm((prev) => ({ ...prev, telephone: e.target.value }));
                            setProfileFormErrors((prev) => ({ ...prev, telephone: '' }));
                          }}
                          className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                        />
                        {profileFormErrors.telephone && <p className="mt-1 text-xs text-red-600">{profileFormErrors.telephone}</p>}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="sponsor-primary-btn inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                        >
                          {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Enregistrer
                        </button>
                      </div>
                    </form>

                    <form onSubmit={handleChangeSponsorPassword} className="sponsor-panel rounded-3xl p-6 space-y-3 h-fit">
                      <p className="text-sm font-bold text-[#0f172a] inline-flex items-center gap-2">
                        <Lock className="h-4 w-4 text-[#2563eb]" />
                        Changer mot de passe
                      </p>
                      <input
                        type="password"
                        aria-label="Mot de passe actuel"
                        placeholder="Mot de passe actuel"
                        value={passwordForm.currentPassword}
                        onChange={(e) => {
                          setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }));
                          setProfileFormErrors((prev) => ({ ...prev, currentPassword: '' }));
                        }}
                        className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                      />
                      {profileFormErrors.currentPassword && <p className="text-xs text-red-600 -mt-1.5">{profileFormErrors.currentPassword}</p>}
                      <input
                        type="password"
                        aria-label="Nouveau mot de passe"
                        placeholder="Nouveau mot de passe"
                        value={passwordForm.newPassword}
                        onChange={(e) => {
                          setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                          setProfileFormErrors((prev) => ({ ...prev, newPassword: '' }));
                        }}
                        className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                      />
                      {profileFormErrors.newPassword && <p className="text-xs text-red-600 -mt-1.5">{profileFormErrors.newPassword}</p>}
                      <input
                        type="password"
                        aria-label="Confirmer le mot de passe"
                        placeholder="Confirmer le mot de passe"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => {
                          setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }));
                          setProfileFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }}
                        className="sponsor-input w-full rounded-xl px-3 py-2.5 text-sm text-[#0f172a]"
                      />
                      {profileFormErrors.confirmPassword && <p className="text-xs text-red-600 -mt-1.5">{profileFormErrors.confirmPassword}</p>}
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e293b] disabled:opacity-60 transition-colors"
                      >
                        {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        Mettre à jour le mot de passe
                      </button>
                    </form>
                  </div>
                )}
              </motion.section>
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
            <div className="relative border-b border-[rgba(12,46,43,0.08)] bg-gradient-to-r from-[#dbeafe] via-[#faf8f4] to-[#e0f2fe] px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]">Détail récompense</p>
                  <h3 className="sponsor-display mt-1 text-2xl font-extrabold text-[#0f172a]">{selectedReward.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(37,99,235,0.14)] bg-white/80 text-[#64748b] hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#dbeafe] bg-[#dbeafe] px-2.5 py-1 text-xs font-semibold text-[#0f172a]">
                  {rewardTypeLabels[selectedReward.rewardType] ?? selectedReward.rewardType}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  selectedReward.enabled
                    ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                    : 'border-[#cbd5e1] bg-[#f1f5f9] text-[#475569]'
                }`}>
                  {selectedReward.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sponsor-soft-item rounded-2xl px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Score minimum</p>
                  <p className="mt-1 text-sm font-bold text-[#0f172a]">{selectedReward.pointsCost} pts</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[rgba(12,46,43,0.08)] bg-white p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Description</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#3f4d49]">
                  {selectedReward.description || 'Aucune description fournie pour cette récompense.'}
                </p>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="sponsor-primary-btn inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold"
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
