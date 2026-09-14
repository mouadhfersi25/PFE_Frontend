import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Award,
  History,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context';
import storage from '@/utils/storage';
import { userService } from '@/services/user.service';

/** Fichier dans `public/logo-edugame.png` — modifiez le nom ici si besoin. */
const LOGO_SRC = '/logo-edugame.png';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Tableau de bord', path: '/parent/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Progression', path: '/parent/child-progress', icon: <TrendingUp className="w-5 h-5" /> },
  { name: 'Analyses', path: '/parent/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { name: 'Badges', path: '/parent/badges', icon: <Award className="w-5 h-5" /> },
  { name: 'Historique', path: '/parent/history', icon: <History className="w-5 h-5" /> },
];

export default function ParentSidebar() {
  const [profileName, setProfileName] = useState<{ prenom: string; nom: string }>({ prenom: '', nom: '' });
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    : (user?.name ?? (email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Parent'));

  const initials = (prenom.trim() && nom.trim())
    ? (prenom.trim().charAt(0) + nom.trim().charAt(0)).toUpperCase()
    : email
      ? (email.charAt(0).toUpperCase() + (email.includes('.') ? email.split('.')[1]?.charAt(0)?.toUpperCase() ?? '' : email.charAt(1)?.toUpperCase() ?? '') || email.charAt(0).toUpperCase())
      : 'P';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sticky top-0 w-64 h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 border-r border-blue-900/60 flex flex-col shrink-0 shadow-2xl shadow-slate-900/20">
      <div className="shrink-0 px-3 pb-0 pt-0 leading-none">
        <Link
          to="/parent/dashboard"
          className="mx-auto flex w-full flex-col items-center justify-start rounded-xl px-0 py-0 leading-none outline-none transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/80"
          aria-label="Espace parent — retour au tableau de bord"
        >
          <img
            src={LOGO_SRC}
            alt="EduGame"
            className="m-0 block h-auto max-h-[118px] w-auto max-w-[248px] object-contain object-top drop-shadow-[0_4px_28px_rgba(0,0,0,0.45)]"
          />
        </Link>
      </div>

      <nav className="-mt-5 flex-1 min-h-0 px-4 overflow-y-auto pb-4 pt-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1.5 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-900/40'
                    : 'text-blue-100/90 hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm flex-1">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-4 pb-4 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{displayName}</p>
            <p className="text-xs text-blue-200">Parent</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg text-blue-200 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
