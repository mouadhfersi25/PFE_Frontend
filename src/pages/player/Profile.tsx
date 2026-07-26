import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Mail, Calendar, Star, Trophy, Save, Eye, EyeOff, MapPin, Globe, Map, Info } from 'lucide-react';
import { useAuth } from '@/context';
import geoApi from '@/api/geo/countriesNow.api';
import userApi from '@/api/user/user.api';
import type { PlayerBadgesOverviewDTO, PlayerProgressOverviewDTO } from '@/api/types/api.types';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import { getErrorMessage } from '@/utils/errorHandler';
import GuidedTour, { TourStep } from '@/components/features/player/GuidedTour';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, playerProfile, refreshUser, updatePlayerProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  
  // Geo State
  const [paysList, setPaysList] = useState<{ name: string }[]>([]);
  const [regionsList, setRegionsList] = useState<string[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [progressOverview, setProgressOverview] = useState<PlayerProgressOverviewDTO | null>(null);
  const [badgesOverview, setBadgesOverview] = useState<PlayerBadgesOverviewDTO | null>(null);

  const [formData, setFormData] = useState({
    name: playerProfile?.name || '',
    age: playerProfile?.age || 12,
    email: user?.email || '',
    paysNom: playerProfile?.paysNom || '',
    regionNom: playerProfile?.regionNom || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const avatarOptions = ['👦', '👧', '🧒', '👨', '👩', '🧑', '👱', '🧔'];
  const [selectedAvatar, setSelectedAvatar] = useState(playerProfile?.avatar || '');
  const hasFetchedProfileRef = useRef(false);
  const avatarValue = (selectedAvatar || '').trim();
  const isImageAvatar =
    avatarValue.startsWith('http://') ||
    avatarValue.startsWith('https://') ||
    avatarValue.startsWith('data:image/');
  const isShortAvatarText = avatarValue.length > 0 && avatarValue.length <= 2;

  useEffect(() => {
    // Check if we should start the tour
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') === 'true') {
      setIsEditing(true);
      setIsTourActive(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (hasFetchedProfileRef.current) return;
    hasFetchedProfileRef.current = true;
    refreshUser?.();
  }, [refreshUser]);

  useEffect(() => {
    if (!playerProfile) {
      setStatsLoading(false);
      setProgressOverview(null);
      setBadgesOverview(null);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    Promise.all([
      userApi.getProgressOverview(),
      userApi.getBadgesOverview(),
    ])
      .then(([progressRes, badgesRes]) => {
        if (cancelled) return;
        setProgressOverview(progressRes.data);
        setBadgesOverview(badgesRes.data);
      })
      .catch(() => {
        if (!cancelled) {
          setProgressOverview(null);
          setBadgesOverview(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, [playerProfile?.id]);

  useEffect(() => {
    setLoadingGeo(true);
    geoApi.getCountries()
      .then(setPaysList)
      .catch(() => setPaysList([]))
      .finally(() => setLoadingGeo(false));
  }, []);

  useEffect(() => {
    if (!playerProfile) return;
    setFormData((prev) => ({
      ...prev,
      name: playerProfile.name || prev.name,
      age: playerProfile.age || prev.age,
      paysNom: playerProfile.paysNom || '',
      regionNom: playerProfile.regionNom || '',
      email: user?.email || prev.email,
    }));
    setSelectedAvatar(playerProfile.avatar || '');
  }, [playerProfile, user?.email]);

  useEffect(() => {
    if (!formData.paysNom) {
      setRegionsList([]);
      setLoadingRegions(false);
      return;
    }
    setLoadingRegions(true);
    geoApi.getStates(formData.paysNom)
      .then((list) => {
        if (list.length === 0) list = [formData.paysNom];
        setRegionsList(list);
      })
      .catch(() => setRegionsList([formData.paysNom]))
      .finally(() => setLoadingRegions(false));
  }, [formData.paysNom]);

  const paysOptions = useMemo(() => {
    const current = (formData.paysNom || '').trim();
    const base = paysList.map((p) => p.name);
    if (current && !base.includes(current)) {
      return [current, ...base];
    }
    return base;
  }, [paysList, formData.paysNom]);

  const regionOptions = useMemo(() => {
    const current = (formData.regionNom || '').trim();
    const base = [...regionsList];
    if (current && !base.includes(current)) {
      return [current, ...base];
    }
    return base;
  }, [regionsList, formData.regionNom]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const paysNom = formData.paysNom.trim();
      const regionNom = formData.regionNom.trim();
      const hasLocation = Boolean(paysNom && regionNom);
      const avatarToSave = selectedAvatar.trim() || undefined;

      // Enregistrer la localisation dès qu'elle est renseignée
      // (premier onboarding ou mise à jour ultérieure du profil).
      if (hasLocation) {
        await userApi.completeOnboarding({
          paysNom,
          regionNom,
          ...(avatarToSave ? { avatarUrl: avatarToSave } : {}),
        });
        if (avatarToSave) {
          await userApi.updateProfile({ avatarUrl: avatarToSave });
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('player_pays_nom', paysNom);
          localStorage.setItem('player_region_nom', regionNom);
          if (avatarToSave) {
            localStorage.setItem('player_avatar', avatarToSave);
          }
        }
        updatePlayerProfile({
          paysNom,
          regionNom,
          ...(avatarToSave ? { avatar: avatarToSave } : {}),
          onboardingCompleted: true,
        });
      } else if (avatarToSave) {
        await userApi.updateProfile({ avatarUrl: avatarToSave });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('player_avatar', avatarToSave);
        }
        updatePlayerProfile({ avatar: avatarToSave });
      }

      toast.success('Profil mis à jour avec succès !');
      await refreshUser?.();
      try {
        const [progressRes, badgesRes] = await Promise.all([
          userApi.getProgressOverview(),
          userApi.getBadgesOverview(),
        ]);
        setProgressOverview(progressRes.data);
        setBadgesOverview(badgesRes.data);
      } catch {
        // Les stats restent affichées avec les dernières valeurs connues.
      }
      setIsEditing(false);
      setIsTourActive(false);

      const isOnboardingFlow =
        new URLSearchParams(location.search).get('onboarding') === 'true' ||
        !playerProfile?.onboardingCompleted;
      if (isOnboardingFlow && hasLocation) {
        navigate('/player/dashboard', { replace: true });
        return;
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erreur lors de la mise à jour'));
    } finally {
      setLoading(false);
    }
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'location-section',
      title: 'Localisation',
      content: 'Bienvenue ! Pour commencer, veuillez saisir votre localisation. Cette étape est nécessaire pour personnaliser vos jeux.',
      position: 'bottom',
      disableNext: !formData.paysNom || !formData.regionNom
    },
    {
      targetId: 'avatar-list',
      title: 'Personnalisation',
      content: 'Vous pouvez choisir un avatar emoji si vous le souhaitez. Cette étape est entièrement optionnelle.',
      position: 'bottom',
      disableNext: false
    },
    {
      targetId: 'profile-header',
      title: 'Terminer',
      content: 'Félicitations ! Votre profil est prêt. Cliquez sur Enregistrer en haut à droite pour valider vos informations et commencer l\'aventure !',
      position: 'bottom',
      disableNext: !formData.paysNom || !formData.regionNom
    }
  ];

  if (!playerProfile) return null;

  const totalSessions = progressOverview?.totalSessions ?? playerProfile.totalSessions ?? 0;
  const totalScore = playerProfile.scoreTotal ?? playerProfile.totalScore ?? 0;
  const averageSuccessRate =
    progressOverview?.avgSuccessRate ?? playerProfile.averageSuccessRate ?? 0;
  const badgesEarned = badgesOverview?.earned ?? playerProfile.badgesEarned ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-16 -right-20 w-72 h-72 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="fixed top-4 right-4 z-50">
        <PlayerHeaderActions showProfileButton={false} />
      </div>
      <GuidedTour 
        steps={tourSteps} 
        isActive={isTourActive} 
        isMandatory={true}
        onComplete={() => {
          setIsTourActive(false);
          toast.success('Félicitations ! Votre profil est prêt.');
        }}
        onCancel={() => setIsTourActive(false)}
      />

      {/* Header */}
      <header id="profile-header" className="bg-slate-950/75 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
              <p className="text-sm text-slate-300">Gérez les paramètres de votre compte</p>
            </div>
          </div>
          <div id="profile-actions" className="flex flex-col items-end gap-2">
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 shadow-md transition-all"
              >
                Modifier le profil
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl border border-white/15 backdrop-blur-xl overflow-hidden mb-8"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-8 text-white">
            <div className="flex items-center gap-6">
              <div 
                id="current-avatar"
                className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl border-4 border-white/30 overflow-hidden"
              >
                {isImageAvatar ? (
                  <img
                    src={avatarValue}
                    alt="Avatar joueur"
                    className="w-full h-full object-cover"
                  />
                ) : isShortAvatarText ? (
                  avatarValue
                ) : (
                  <UserIcon className="w-12 h-12 text-white/80" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{playerProfile.name}</h2>
                <div className="flex items-center gap-2 text-white/90 text-lg mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{formData.regionNom || 'Inconnue'}, {formData.paysNom || 'Inconnu'}</span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <Star className="w-5 h-5" />
                    <span className="font-semibold">Niveau {playerProfile.level}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <Trophy className="w-5 h-5" />
                    <span className="font-semibold">{playerProfile.totalScore} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white">Configuration Globale</h3>
            </div>

            <div className="space-y-8">
              {/* Avatar Selection */}
              {isEditing && (
                <div id="avatar-section" className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2.5rem] border border-indigo-100/50 shadow-inner overflow-hidden relative">
                  <div className="flex items-center justify-between mb-6">
                    <label className="block text-lg font-black text-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      Apparence du Profil
                    </label>
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-100 px-3 py-1 rounded-full">Optionnel</span>
                  </div>

                  <div id="avatar-list" className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-2">
                    {avatarOptions.map((avatar) => (
                      <motion.button
                        key={avatar}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedAvatar(selectedAvatar === avatar ? '' : avatar)}
                        className={`group relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl transition-all duration-300 ${
                          selectedAvatar === avatar
                            ? 'bg-white border-[3px] border-indigo-600 shadow-[0_10px_30px_rgba(79,70,229,0.3)] ring-4 ring-indigo-50 scale-110 z-10'
                            : 'bg-white/60 border-2 border-transparent hover:border-indigo-200 hover:bg-white hover:shadow-xl'
                        }`}
                      >
                        <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                          {avatar}
                        </span>
                        {selectedAvatar === avatar && (
                          <motion.div 
                            layoutId="activeAvatar"
                            className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white rounded-[1.2rem] -z-0"
                          />
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-all ${
                          selectedAvatar === avatar ? 'bg-green-500 scale-100 opacity-100' : 'scale-0 opacity-0'
                        }`}>
                          <div className="w-2 h-1 border-l-2 border-b-2 border-white -rotate-45 mb-0.5" />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Recommendation under avatar */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-4 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100"
                  >
                    <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      <strong>Optionnel :</strong> Choisissez un emoji pour personnaliser votre profil, ou passez cette étape. Cliquez à nouveau sur un emoji sélectionné pour le retirer.
                    </p>
                  </motion.div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-white/5 disabled:text-slate-400 transition-all"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Âge
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-white/5 disabled:text-slate-400 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-white/5 disabled:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Location Section */}
              <div id="location-section" className={`p-6 bg-blue-50 rounded-2xl border border-blue-100 transition-all ${isEditing ? 'opacity-100' : 'opacity-70'}`}>
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Localisation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Pays
                    </label>
                    <select
                      value={formData.paysNom}
                      onChange={(e) => setFormData({ ...formData, paysNom: e.target.value, regionNom: '' })}
                      disabled={!isEditing || loadingGeo}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all"
                    >
                      <option className="bg-white text-slate-900" value="">{loadingGeo ? 'Chargement...' : '-- Choisir un pays --'}</option>
                      {paysOptions.map((p) => (
                        <option className="bg-white text-slate-900" key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Map className="w-3 h-3" />
                      Région / État
                    </label>
                    <select
                      value={formData.regionNom}
                      onChange={(e) => setFormData({ ...formData, regionNom: e.target.value })}
                      disabled={!isEditing || !formData.paysNom || loadingRegions}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all"
                    >
                      <option className="bg-white text-slate-900" value="">{loadingRegions ? 'Chargement...' : '-- Choisir une région --'}</option>
                      {regionOptions.map((r) => (
                        <option className="bg-white text-slate-900" key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              {isEditing && (
                <div className="pt-8 border-t border-gray-100">
                  <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                    <Save className="w-5 h-5 text-slate-300" />
                    Changer le mot de passe
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Mot de passe actuel
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, currentPassword: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Confirmer
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setIsTourActive(false);
                  }}
                  className="px-6 py-3 bg-white/10 text-slate-100 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Annuler
                </motion.button>
                <motion.button
                  id="save-profile"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-8 border border-white/15 backdrop-blur-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Statistiques du compte
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center flex flex-col items-center">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Sessions Totales</p>
              <p className="text-3xl font-black text-purple-600">{statsLoading ? '—' : totalSessions.toLocaleString('fr-FR')}</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center flex flex-col items-center">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Score Total</p>
              <p className="text-3xl font-black text-blue-600">{statsLoading ? '—' : totalScore.toLocaleString('fr-FR')}</p>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 text-center flex flex-col items-center">
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Taux de Réussite</p>
              <p className="text-3xl font-black text-green-600">{statsLoading ? '—' : `${averageSuccessRate}%`}</p>
            </div>
            <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100 text-center flex flex-col items-center">
              <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2">Badges</p>
              <p className="text-3xl font-black text-yellow-600">
                {statsLoading
                  ? '—'
                  : badgesOverview
                    ? `${badgesEarned} / ${badgesOverview.total}`
                    : badgesEarned.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
