import { useEffect, useRef, useState } from 'react';
import { Bell, Award, Gift, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { GameDTO } from '@/api/types/api.types';
import { usePlayerNotifications } from '@/hooks/usePlayerNotifications';

type PlayerNotificationsBellProps = {
  games: GameDTO[];
  className?: string;
};

function kindIcon(kind: 'badge' | 'reward' | 'new_game') {
  if (kind === 'badge') return <Award className="h-4 w-4 text-amber-400" />;
  if (kind === 'reward') return <Gift className="h-4 w-4 text-emerald-400" />;
  return <Sparkles className="h-4 w-4 text-cyan-400" />;
}

export default function PlayerNotificationsBell({ games, className = '' }: PlayerNotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, handleNotificationClick, markAllGamesSeen, refresh } =
    usePlayerNotifications(games);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refresh();
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition-colors hover:border-cyan-400/35 hover:bg-white/10 hover:text-white"
        title="Notifications"
        aria-label={unreadCount > 0 ? `${unreadCount} notifications` : 'Notifications'}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#060918]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/98 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {notifications.some((n) => n.kind === 'new_game') && (
              <button
                type="button"
                onClick={() => markAllGamesSeen()}
                className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
              >
                Marquer jeux lus
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Aucune notification pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-white/10">
                {notifications.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        handleNotificationClick(item);
                        setOpen(false);
                      }}
                      className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/10"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        {kindIcon(item.kind)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {item.title}
                        </span>
                        <span className="block truncate text-sm font-medium text-white">{item.message}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
