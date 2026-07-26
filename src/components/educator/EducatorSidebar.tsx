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
    name: 'Dashboard',
    path: '/educator/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    section: 'overview',
  },
  {
    name: 'Manage Games',
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
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'Mémoire',
    path: '/educator/games/type/memory',
    icon: <Brain className="w-5 h-5" />,
    section: 'games',
    badge: '🧠',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'Réflexe',
    path: '/educator/games/type/reflex',
    icon: <Zap className="w-5 h-5" />,
    section: 'games',
    badge: '⚡',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
  {
    name: 'Logique',
    path: '/educator/games/type/logic',
    icon: <Puzzle className="w-5 h-5" />,
    section: 'games',
    badge: '🎯',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Learning Statistics',
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
    (email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Educator');

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

  return (
    <div className="sticky top-0 w-64 h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50/40 border-r border-gray-200 flex flex-col shrink-0">
      {/* Brand */}
      <div className="p-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900">Educator Panel</h2>
            <p className="text-xs text-gray-500">Create questions & manage games</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 overflow-y-auto py-2">
        {/* Overview */}
        <p className="px-3 mb-1 text-[11px] font-semibold tracking-wide text-emerald-700/80 uppercase">Overview</p>
        {navItems
          .filter((item) => item.section === 'overview')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}

        {/* Content management */}
        <p className="px-3 mt-1 mb-1 text-[11px] font-semibold tracking-wide text-emerald-700/80 uppercase">
          Gestion
        </p>
        {navItems
          .filter((item) => item.section === 'content')
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}

        {/* Atelier oral */}
        <p className="px-3 mt-3 mb-1 text-[11px] font-semibold tracking-wide text-emerald-700/80 uppercase">
          Atelier oral
        </p>
        {navItems
          .filter((item) => item.section === 'oral')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'text-gray-700 hover:bg-emerald-50'
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

        {/* Game types */}
        <p className="px-3 mt-3 mb-1 text-[11px] font-semibold tracking-wide text-emerald-700/80 uppercase">
          Types de jeux
        </p>
        {navItems
          .filter((item) => item.section === 'games')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'text-gray-700 hover:bg-emerald-50'
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


        {/* Insights */}
        <p className="px-3 mt-1 mb-1 text-[11px] font-semibold tracking-wide text-emerald-700/80 uppercase">Insights</p>
        {navItems
          .filter((item) => item.section === 'insights')
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
      </nav>

      {/* Educator profile / logout */}
      <div className="shrink-0 p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{displayName}</p>
            <p className="text-xs text-gray-500">Educator</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
