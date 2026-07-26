import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Globe, Bell, Settings, LogOut, Check, X, Gamepad2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context';
import storage from '@/utils/storage';
import { userService } from '@/services/user.service';
import adminApi from '@/api/admin';
import type { GameDTO, EtatJeu } from '@/api/types';
import { toast } from 'sonner';
import RejectGameModal from './RejectGameModal';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileName, setProfileName] = useState<{ prenom: string; nom: string }>({ prenom: '', nom: '' });
  const [pendingGames, setPendingGames] = useState<GameDTO[]>([]);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [rejectingGame, setRejectingGame] = useState<GameDTO | null>(null);

  const avatarRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const email = user?.email ?? '';
  const prenom = profileName.prenom || storage.get('auth_prenom') || '';
  const nom = profileName.nom || storage.get('auth_nom') || '';

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    userService.getProfile().then((data: { prenom?: string; nom?: string; email?: string }) => {
      if (cancelled) return;
      const fetchedPrenom = (data.prenom ?? '').trim();
      const fetchedNom = (data.nom ?? '').trim();
      const fetchedEmail = (data.email ?? '').trim().toLowerCase();
      const currentEmail = (user.email ?? '').trim().toLowerCase();
      if (fetchedEmail && currentEmail && fetchedEmail !== currentEmail) return;
      setProfileName({ prenom: fetchedPrenom, nom: fetchedNom });
      if (fetchedPrenom) storage.set('auth_prenom', fetchedPrenom);
      else storage.remove('auth_prenom');
      if (fetchedNom) storage.set('auth_nom', fetchedNom);
      else storage.remove('auth_nom');
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [user?.email]);

  const displayName = (prenom || nom)
    ? [prenom, nom].filter(Boolean).join(' ').trim()
    : (user?.name ?? (email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Admin'));

  const initials = (prenom.trim() && nom.trim())
    ? (prenom.trim().charAt(0) + nom.trim().charAt(0)).toUpperCase()
    : email
      ? (email.charAt(0).toUpperCase() + (email.includes('.') ? email.split('.')[1]?.charAt(0)?.toUpperCase() ?? '' : email.charAt(1)?.toUpperCase() ?? '') || email.charAt(0).toUpperCase())
      : 'A';

  const fetchPendingGames = async () => {
    try {
      const res = await adminApi.getGames();
      if (Array.isArray(res.data)) {
        const pending = (res.data as GameDTO[]).filter(g => g.etat === 'EN_ATTENTE');
        setPendingGames(pending);
      }
    } catch (err) {
      console.error("Failed to fetch pending games", err);
    }
  };

  useEffect(() => {
    fetchPendingGames();

    // Rafraichissement plus frequent pour voir rapidement les nouveaux jeux soumis.
    const interval = setInterval(fetchPendingGames, 10000);

    const refreshOnFocus = () => fetchPendingGames();
    const refreshOnVisibility = () => {
      if (document.visibilityState === 'visible') fetchPendingGames();
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisibility);
    };
  }, []);

  const handleStatusUpdate = async (gameId: number, status: EtatJeu) => {
    if (status === 'REFUSE') {
      const selected = pendingGames.find((g) => g.id === gameId) ?? null;
      setRejectingGame(selected);
      return;
    }
    setUpdatingStatusId(gameId);
    try {
      await adminApi.updateGameStatus(gameId, status);
      toast.success(status === 'ACCEPTE' ? 'Jeu accepté' : 'Jeu refusé');
      setPendingGames(prev => prev.filter(g => g.id !== gameId));
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const submitReject = async (reason: string) => {
    if (!rejectingGame) return;
    setUpdatingStatusId(rejectingGame.id);
    try {
      await adminApi.updateGameStatus(rejectingGame.id, 'REFUSE', reason);
      toast.success('Jeu refusé');
      setPendingGames(prev => prev.filter(g => g.id !== rejectingGame.id));
      setRejectingGame(null);
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleNavigateToGame = (gameId: number) => {
    setNotificationsOpen(false);
    navigate(`/admin/games/${gameId}`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setAvatarOpen(false);
    setNotificationsOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-64 right-0 z-50 border-b border-violet-100/70 bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Administration</p>
          <h2 className="text-sm md:text-base font-bold text-slate-900 truncate">Bonjour, {displayName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200" title="Langue">
          <Globe className="w-5 h-5" />
          </button>
          <div className="relative shrink-0" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(o => !o);
                if (!notificationsOpen) fetchPendingGames(); // Refresh when opening
              }}
              className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {pendingGames.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
              )}
            </button>

            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
                  <span className="font-semibold text-slate-900">Notifications</span>
                  {pendingGames.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-xs font-bold">
                      {pendingGames.length}
                    </span>
                  )}
                </div>

                <div className="overflow-y-auto custom-scrollbar">
                  {pendingGames.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      Aucune nouvelle notification.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {pendingGames.map(game => (
                        <div key={game.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                              {game.icone || <Gamepad2 className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleNavigateToGame(game.id)}
                                className="text-left w-full"
                              >
                                <p className="text-sm font-medium text-slate-900 truncate">{game.titre}</p>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">Nouvelle demande de jeu éducatif. En attente de validation.</p>
                              </button>

                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(game.id, 'REFUSE'); }}
                                  disabled={updatingStatusId === game.id}
                                  className="flex-1 px-2 py-1.5 text-xs font-semibold bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {updatingStatusId === game.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                  Refuser
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(game.id, 'ACCEPTE'); }}
                                  disabled={updatingStatusId === game.id}
                                  className="flex-1 px-2 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {updatingStatusId === game.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  Accepter
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          <div className="relative shrink-0" ref={avatarRef}>
            <button
              type="button"
              onClick={() => setAvatarOpen((o) => !o)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 focus:outline-none ring-2 ring-violet-100"
              aria-expanded={avatarOpen}
              aria-haspopup="true"
            >
              {initials}
            </button>
            {avatarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.12)] z-50 overflow-hidden"
              >
                <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <p className="font-semibold text-slate-900">{displayName}</p>
                  <p className="text-sm text-slate-500 truncate">{email}</p>
                </div>
                <div className="p-2">
                  <Link
                    to="/admin/me/edit"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    Settings
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-slate-500" />
                    Log out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <RejectGameModal
        open={!!rejectingGame}
        gameTitle={rejectingGame?.titre}
        submitting={rejectingGame != null && updatingStatusId === rejectingGame.id}
        onClose={() => setRejectingGame(null)}
        onConfirm={submitReject}
      />
    </header>
  );
}
