import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/context';
import storage from '@/utils/storage';

type PlayerHeaderActionsProps = {
  showProfileButton?: boolean;
};

export default function PlayerHeaderActions({ showProfileButton = true }: PlayerHeaderActionsProps) {
  const navigate = useNavigate();
  const { logout, playerProfile, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const handleGoProfile = () => {
    setIsOpen(false);
    navigate('/player/profile');
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const prenom = (playerProfile?.prenom || storage.get('auth_prenom') || '').trim();
  const nom = (playerProfile?.nom || storage.get('auth_nom') || '').trim();
  const fullName =
    [prenom, nom].filter(Boolean).join(' ').trim() ||
    (playerProfile?.name || '').trim() ||
    (user?.name || '').trim();

  const avatarValue = (playerProfile?.avatar || playerProfile?.avatarUrl || '').trim();
  const isImageAvatar =
    avatarValue.startsWith('http://') ||
    avatarValue.startsWith('https://') ||
    avatarValue.startsWith('data:image/');
  const avatarText = isImageAvatar ? '' : avatarValue || prenom.charAt(0) || user?.name?.charAt(0) || '👤';

  return (
    <div ref={rootRef} className="relative flex items-center gap-3 shrink-0">
      {fullName ? (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-[10rem] md:max-w-[14rem] text-right leading-tight"
        >
          <p className="text-sm font-semibold text-white truncate">{prenom || fullName}</p>
          {nom ? <p className="text-xs font-medium text-slate-300/90 truncate">{nom}</p> : null}
        </motion.div>
      ) : null}

      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative inline-flex items-center justify-center rounded-full border border-indigo-200/35 bg-gradient-to-br from-white/18 to-white/6 p-1.5 text-white shadow-[0_8px_24px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all hover:border-cyan-200/55"
        aria-label={fullName ? `Menu joueur : ${fullName}` : 'Menu joueur'}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/15" />
        <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/35 bg-gradient-to-br from-indigo-400/30 via-blue-400/15 to-cyan-400/20 text-sm font-black shadow-inner">
          {isImageAvatar ? (
            <img src={avatarValue} alt="Avatar joueur" className="h-full w-full object-cover" />
          ) : (
            <span>{avatarText}</span>
          )}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-slate-900 bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
      </motion.button>

      {isOpen ? (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/15 bg-[#0c1233]/95 p-2 shadow-2xl backdrop-blur-xl z-50">
          {showProfileButton ? (
            <button
              type="button"
              onClick={handleGoProfile}
              className="w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 transition-colors"
            >
              <User className="h-4 w-4" />
              Gérer profil
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  );
}
