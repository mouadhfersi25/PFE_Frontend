import { useState, useEffect, useRef } from 'react';
import { Globe, Bell, Settings, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import storage from '@/utils/storage';
import educatorApi from '@/api/educator/educator.api';
import { userService } from '@/services/user.service';
import type { GameDTO, UserDTO } from '@/api/types';

export default function EducatorHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [decisionNotifications, setDecisionNotifications] = useState<GameDTO[]>([]);
  const avatarRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const email = user?.email ?? '';

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    userService.getProfile()
      .then((data) => {
        if (cancelled) return;
        const d = data as UserDTO;
        setProfile(d);
        if (d.prenom != null) storage.set('auth_prenom', d.prenom);
        if (d.nom != null) storage.set('auth_nom', d.nom);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => { cancelled = true; };
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    const seenKey = `educator_seen_decisions_${user.email.toLowerCase()}`;
    const loadNotifications = () => {
      educatorApi.getGames()
        .then((res) => {
          const games = Array.isArray(res.data) ? (res.data as GameDTO[]) : [];
          const decisions = games.filter((g) => g.etat === 'ACCEPTE' || g.etat === 'REFUSE');
          const seenTokensRaw = storage.get(seenKey);
          const seenTokens = new Set<string>(
            seenTokensRaw ? seenTokensRaw.split(',').map((v) => v.trim()).filter(Boolean) : []
          );
          setDecisionNotifications(decisions.filter((g) => !seenTokens.has(`${g.id}:${g.etat}`)));
        })
        .catch(() => {
          setDecisionNotifications([]);
        });
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    const onFocus = () => loadNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.email]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profilePrenom = profile?.prenom?.trim() ?? '';
  const profileNom = profile?.nom?.trim() ?? '';
  const displayName = (profilePrenom || profileNom)
    ? [profilePrenom, profileNom].filter(Boolean).join(' ').trim()
    : (user?.name || (email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Educator'));

  const initials = (profilePrenom && profileNom)
    ? (profilePrenom.charAt(0) + profileNom.charAt(0)).toUpperCase()
    : displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || (email ? email.charAt(0).toUpperCase() : 'E');

  const handleLogout = () => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    logout();
    navigate('/login');
  };

  const markNotificationAsSeen = (game: GameDTO) => {
    if (!user?.email) return;
    const seenKey = `educator_seen_decisions_${user.email.toLowerCase()}`;
    const existing = storage.get(seenKey);
    const existingTokens = new Set<string>(
      existing ? existing.split(',').map((v) => v.trim()).filter(Boolean) : []
    );
    existingTokens.add(`${game.id}:${game.etat}`);
    storage.set(seenKey, Array.from(existingTokens).join(','));
    setDecisionNotifications((prev) => prev.filter((g) => !(g.id === game.id && g.etat === game.etat)));
  };

  return (
    <header className="fixed top-0 left-64 right-0 z-40 border-b border-emerald-100/70 bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4 px-5 md:px-8 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Education</p>
            <h2 className="text-sm md:text-base font-bold text-slate-900 truncate">Bonjour, {displayName}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200" title="Langue">
            <Globe className="w-5 h-5" />
          </button>
          <div className="relative shrink-0" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((o) => !o);
              }}
              className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {decisionNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
              )}
            </button>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                  <span className="font-semibold text-slate-900">Notifications</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {decisionNotifications.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500 text-center">Aucune nouvelle décision admin.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {decisionNotifications.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            markNotificationAsSeen(g);
                            setNotificationsOpen(false);
                            navigate('/educator/games/manage');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50"
                        >
                          <p className="text-sm font-semibold text-slate-900 truncate">{g.titre}</p>
                          <p className="text-xs mt-1 text-slate-600">
                            {g.etat === 'ACCEPTE' ? 'Votre jeu a été accepté.' : 'Votre jeu a été refusé. Consultez le motif.'}
                          </p>
                        </button>
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
              onClick={() => setMenuOpen((o) => !o)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm focus:outline-none ring-2 ring-emerald-100"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {initials}
            </button>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.12)] z-50 overflow-hidden"
              >
                <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <p className="font-semibold text-slate-900">{displayName}</p>
                  <p className="text-sm text-slate-500 truncate">{email}</p>
                </div>
                <div className="p-2">
                  
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/educator/profile');
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-slate-700 hover:bg-emerald-50 transition-colors border-t border-slate-100"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    Gérer profil
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4 text-slate-500" />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
