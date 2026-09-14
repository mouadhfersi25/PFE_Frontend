import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, HelpCircle, Gamepad2, BarChart3, LogOut, Brain, Zap, Puzzle, Mic } from 'lucide-react';
import { useAuth } from '@/context';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  section: 'overview' | 'content' | 'oral' | 'games' | 'insights';
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Tableau de bord',
    path: '/educator/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    section: 'overview',
  },
  {
    name: 'Gérer les jeux',
    path: '/educator/games/manage',
    icon: <Gamepad2 className="w-5 h-5" />,
    section: 'content',
  },
  {
    name: 'Atelier oral',
    path: '/educator/voice/series',
    icon: <Mic className="w-5 h-5" />,
    section: 'oral',
    badge: '🎙️',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
  {
    name: 'Quiz',
    path: '/educator/games/type/quiz',
    icon: <HelpCircle className="w-5 h-5" />,
    section: 'games',
    badge: '🧮',
    badgeColor: 'bg-slate-100 text-slate-700',
  },
  {
    name: 'Mémoire',
    path: '/educator/games/type/memory',
    icon: <Brain className="w-5 h-5" />,
    section: 'games',
    badge: '🧠',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    name: 'Réflexe',
    path: '/educator/games/type/reflex',
    icon: <Zap className="w-5 h-5" />,
    section: 'games',
    badge: '⚡',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'Logique',
    path: '/educator/games/type/logic',
    icon: <Puzzle className="w-5 h-5" />,
    section: 'games',
    badge: '🎯',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Statistiques d’apprentissage',
    path: '/educator/statistics',
    icon: <BarChart3 className="w-5 h-5" />,
    section: 'insights',
  },
];

export default function EducatorSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const email = user?.email ?? '';
  const displayName =
    user?.name ||
    (email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Éducateur');

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || (email ? email.charAt(0).toUpperCase() : 'E');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sectionLabel = 'px-3 mb-1 text-[11px] font-semibold tracking-wide text-sky-700/70 uppercase';
  const navActive = 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm';
  const navIdle = 'text-slate-600 hover:bg-sky-50 hover:text-slate-900';

  return (
    <div className="sticky top-0 w-64 h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50/40 border-r border-sky-100 flex flex-col shrink-0">
      <div className="p-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900">Espace éducateur</h2>
            <p className="text-xs text-slate-500">Créer des questions et gérer les jeux</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 px-3 overflow-y-auto py-2">
        <p className={sectionLabel}>Vue d’ensemble</p>
        {navItems
          .filter((item) => item.section === 'overview')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1.5 transition-colors ${
                    isActive ? navActive : navIdle
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}

        <p className={`px-3 mt-2 ${sectionLabel}`}>Gestion</p>
        {navItems
          .filter((item) => item.section === 'content')
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors ${
                    isActive ? navActive : navIdle
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}

        <p className={`px-3 mt-3 ${sectionLabel}`}>Atelier oral</p>
        {navItems
          .filter((item) => item.section === 'oral')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors ${
                    isActive ? navActive : navIdle
                  }`}
                >
                  {item.icon}
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.badge && !isActive && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}

        <p className={`px-3 mt-3 ${sectionLabel}`}>Types de jeux</p>
        {navItems
          .filter((item) => item.section === 'games')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors ${
                    isActive ? navActive : navIdle
                  }`}
                >
                  {item.icon}
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.badge && !isActive && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}

        <p className={`px-3 mt-2 ${sectionLabel}`}>Analyses</p>
        {navItems
          .filter((item) => item.section === 'insights')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors ${
                    isActive ? navActive : navIdle
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
      </nav>

      <div className="shrink-0 p-3 border-t border-sky-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sky-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{displayName}</p>
            <p className="text-xs text-slate-500">Éducateur</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
