import { useState, useEffect, useRef } from 'react';
import { Globe, Bell, LogOut, User, RefreshCw, PowerOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import storage from '@/utils/storage';
import educatorApi from '@/api/educator/educator.api';
import { userService } from '@/services/user.service';
import type { GameDTO, UserDTO, ReclamationDTO, MotifReclamation } from '@/api/types';

const MOTIF_LABELS: Record<MotifReclamation, string> = {
  CONTENU_INADAPTE_AGE: 'Contenu inadapté à l’âge',
  ERREUR_REPONSE: 'Erreur / réponse incorrecte',
  IMAGE_TEXTE_CHOQUANT: 'Image ou texte choquant',
  TROP_DIFFICILE: 'Trop difficile / incompréhensible',
  BUG_TECHNIQUE: 'Bug technique',
  AUTRE: 'Autre',
};

export default function EducatorHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [decisionNotifications, setDecisionNotifications] = useState<GameDTO[]>([]);
  const [reportNotifications, setReportNotifications] = useState<ReclamationDTO[]>([]);
  const [reactivationDecisions, setReactivationDecisions] = useState<GameDTO[]>([]);
  const [deactivationNotifications, setDeactivationNotifications] = useState<GameDTO[]>([]);
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

  // Décision admin sur une demande de réactivation (jeu corrigé après désactivation) : réactivé,
  // ou toujours désactivé si refusée (avec le motif). Le token de "vu" inclut le motif/l'état pour
  // qu'un nouveau cycle désactivation → réactivation redevienne notifiable.
  const reactivationToken = (g: GameDTO): string | null => {
    if (g.etat !== 'ACCEPTE') return null;
    if (g.actif && g.latestDeactivationReason) return `${g.id}:reactivated:${g.latestDeactivationReason}`;
    if (!g.actif && !g.reactivationPending && g.latestReactivationRejectionReason) {
      return `${g.id}:reactivation-rejected:${g.latestReactivationRejectionReason}`;
    }
    return null;
  };

  useEffect(() => {
    if (!user?.email) return;
    const seenKey = `educator_seen_reactivation_${user.email.toLowerCase()}`;
    const loadReactivationDecisions = () => {
      educatorApi.getGames()
        .then((res) => {
          const games = Array.isArray(res.data) ? (res.data as GameDTO[]) : [];
          const seenTokensRaw = storage.get(seenKey);
          const seenTokens = new Set<string>(
            seenTokensRaw ? seenTokensRaw.split(',').map((v) => v.trim()).filter(Boolean) : []
          );
          const decisions = games.filter((g) => {
            const token = reactivationToken(g);
            return token != null && !seenTokens.has(token);
          });
          setReactivationDecisions(decisions);
        })
        .catch(() => {
          setReactivationDecisions([]);
        });
    };

    loadReactivationDecisions();
    const interval = setInterval(loadReactivationDecisions, 15000);
    const onFocus = () => loadReactivationDecisions();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.email]);

  // Jeu désactivé par l'admin (directement, ou suite à un signalement) : notification générique
  // basée sur l'état du jeu, qui couvre aussi les désactivations sans signalement associé.
  const deactivationToken = (g: GameDTO): string | null => {
    if (g.etat !== 'ACCEPTE' || g.actif || !g.latestDeactivationReason) return null;
    return `${g.id}:deactivated:${g.latestDeactivationReason}`;
  };

  useEffect(() => {
    if (!user?.email) return;
    const seenKey = `educator_seen_deactivations_${user.email.toLowerCase()}`;
    const loadDeactivationNotifications = () => {
      educatorApi.getGames()
        .then((res) => {
          const games = Array.isArray(res.data) ? (res.data as GameDTO[]) : [];
          const seenTokensRaw = storage.get(seenKey);
          const seenTokens = new Set<string>(
            seenTokensRaw ? seenTokensRaw.split(',').map((v) => v.trim()).filter(Boolean) : []
          );
          const notifications = games.filter((g) => {
            const token = deactivationToken(g);
            return token != null && !seenTokens.has(token);
          });
          setDeactivationNotifications(notifications);
        })
        .catch(() => {
          setDeactivationNotifications([]);
        });
    };

    loadDeactivationNotifications();
    const interval = setInterval(loadDeactivationNotifications, 15000);
    const onFocus = () => loadDeactivationNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.email]);

  // Signalements joueurs validés (statut TRAITE) contre les jeux de l'éducateur : il doit être
  // notifié dès qu'un admin accepte un signalement — avec les détails, et le motif de
  // désactivation si le jeu a été désactivé suite à ce signalement.
  useEffect(() => {
    if (!user?.email) return;
    const seenKey = `educator_seen_reports_${user.email.toLowerCase()}`;
    const loadReportNotifications = () => {
      educatorApi.getReclamations()
        .then((res) => {
          const reports = Array.isArray(res.data) ? res.data : [];
          const seenTokensRaw = storage.get(seenKey);
          const seenTokens = new Set<string>(
            seenTokensRaw ? seenTokensRaw.split(',').map((v) => v.trim()).filter(Boolean) : []
          );
          setReportNotifications(reports.filter((r) => !seenTokens.has(String(r.id))));
        })
        .catch(() => {
          setReportNotifications([]);
        });
    };

    loadReportNotifications();
    const interval = setInterval(loadReportNotifications, 15000);
    const onFocus = () => loadReportNotifications();
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
    : (user?.name || (email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Éducateur'));

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

  const markReportAsSeen = (report: ReclamationDTO) => {
    if (!user?.email) return;
    const seenKey = `educator_seen_reports_${user.email.toLowerCase()}`;
    const existing = storage.get(seenKey);
    const existingTokens = new Set<string>(
      existing ? existing.split(',').map((v) => v.trim()).filter(Boolean) : []
    );
    existingTokens.add(String(report.id));
    storage.set(seenKey, Array.from(existingTokens).join(','));
    setReportNotifications((prev) => prev.filter((r) => r.id !== report.id));
  };

  const markReactivationAsSeen = (game: GameDTO) => {
    if (!user?.email) return;
    const token = reactivationToken(game);
    if (!token) return;
    const seenKey = `educator_seen_reactivation_${user.email.toLowerCase()}`;
    const existing = storage.get(seenKey);
    const existingTokens = new Set<string>(
      existing ? existing.split(',').map((v) => v.trim()).filter(Boolean) : []
    );
    existingTokens.add(token);
    storage.set(seenKey, Array.from(existingTokens).join(','));
    setReactivationDecisions((prev) => prev.filter((g) => g.id !== game.id));
  };

  const markDeactivationAsSeen = (game: GameDTO) => {
    if (!user?.email) return;
    const token = deactivationToken(game);
    if (!token) return;
    const seenKey = `educator_seen_deactivations_${user.email.toLowerCase()}`;
    const existing = storage.get(seenKey);
    const existingTokens = new Set<string>(
      existing ? existing.split(',').map((v) => v.trim()).filter(Boolean) : []
    );
    existingTokens.add(token);
    storage.set(seenKey, Array.from(existingTokens).join(','));
    setDeactivationNotifications((prev) => prev.filter((g) => g.id !== game.id));
  };

  const totalNotifications = decisionNotifications.length + reportNotifications.length
    + reactivationDecisions.length + deactivationNotifications.length;

  return (
    <header className="fixed top-0 left-64 right-0 z-40 border-b border-sky-100/80 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 md:px-8 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Éducation</p>
            <h2 className="text-sm md:text-base font-bold text-slate-900 truncate">Bonjour, {displayName}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="p-2.5 rounded-xl text-slate-500 hover:bg-sky-50 hover:text-sky-700 transition-colors" title="Langue">
            <Globe className="w-5 h-5" />
          </button>
          <div className="relative shrink-0" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((o) => !o);
              }}
              className="relative p-2.5 rounded-xl text-slate-500 hover:bg-sky-50 hover:text-sky-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
              )}
            </button>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="font-semibold text-slate-900">Notifications</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {totalNotifications === 0 ? (
                    <div className="p-6 text-sm text-slate-500 text-center">Aucune nouvelle notification.</div>
                  ) : (
                    <>
                      {deactivationNotifications.length > 0 && (
                        <div className="divide-y divide-slate-100 border-b border-slate-100">
                          {deactivationNotifications.map((g) => (
                            <button
                              key={`deactivated-${g.id}`}
                              type="button"
                              onClick={() => {
                                markDeactivationAsSeen(g);
                                setNotificationsOpen(false);
                                navigate(`/educator/games/manage/${g.id}/view`);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-rose-50/60"
                            >
                              <div className="flex items-center gap-2">
                                <PowerOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span className="text-sm font-semibold text-slate-900 truncate">{g.titre}</span>
                                <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                                  Désactivé
                                </span>
                              </div>
                              <p className="text-xs mt-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 px-2 py-1">
                                {g.latestDeactivationReason}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      {reportNotifications.length > 0 && (
                        <div className="divide-y divide-slate-100 border-b border-slate-100">
                          {reportNotifications.map((r) => (
                            <button
                              key={`report-${r.id}`}
                              type="button"
                              onClick={() => {
                                markReportAsSeen(r);
                                setNotificationsOpen(false);
                                navigate(`/educator/games/manage/${r.gameId}/view`);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-rose-50/60"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900 truncate">{r.gameTitle}</span>
                                <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                                  Signalement
                                </span>
                              </div>
                              <p className="text-xs mt-1 text-slate-600">
                                {MOTIF_LABELS[r.motif] || r.motif}
                                {r.commentaire ? ` — « ${r.commentaire} »` : ''}
                              </p>
                              {!r.gameActif && r.gameDeactivationReason && (
                                <p className="text-xs mt-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 px-2 py-1">
                                  Jeu désactivé : {r.gameDeactivationReason}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {reactivationDecisions.length > 0 && (
                        <div className="divide-y divide-slate-100 border-b border-slate-100">
                          {reactivationDecisions.map((g) => {
                            const reactivated = g.actif;
                            return (
                              <button
                                key={`reactivation-${g.id}`}
                                type="button"
                                onClick={() => {
                                  markReactivationAsSeen(g);
                                  setNotificationsOpen(false);
                                  navigate(`/educator/games/manage/${g.id}/view`);
                                }}
                                className={`w-full text-left px-4 py-3 ${reactivated ? 'hover:bg-emerald-50/60' : 'hover:bg-rose-50/60'}`}
                              >
                                <div className="flex items-center gap-2">
                                  {reactivated ? (
                                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <PowerOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  )}
                                  <span className="text-sm font-semibold text-slate-900 truncate">{g.titre}</span>
                                </div>
                                <p className="text-xs mt-1 text-slate-600">
                                  {reactivated
                                    ? 'Votre demande de réactivation a été acceptée : le jeu est de nouveau actif.'
                                    : 'Votre demande de réactivation a été refusée. Consultez le motif.'}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {decisionNotifications.length > 0 && (
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
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          <div className="relative shrink-0" ref={avatarRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm focus:outline-none ring-2 ring-sky-100"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {initials}
            </button>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-4 border-b border-slate-100 bg-slate-50">
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
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    Gérer profil
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
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
