import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import userApi from '@/api/user/user.api';
import type { LinkedChildProfileDTO, PlayerHistorySessionDTO } from '@/api/types';

export default function ParentHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [children, setChildren] = useState<LinkedChildProfileDTO[]>([]);
  const [sessions, setSessions] = useState<PlayerHistorySessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const childIdFromState = (location.state as { childId?: number } | null)?.childId ?? null;

  useEffect(() => {
    let cancelled = false;
    userApi
      .getLinkedChildren()
      .then((res) => {
        if (cancelled) return;
        setChildren(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setChildren([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedChild = useMemo(() => {
    if (children.length === 0) return null;
    if (childIdFromState != null) {
      const match = children.find((c) => c.id === childIdFromState);
      if (match) return match;
    }
    return children[0];
  }, [children, childIdFromState]);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    setLoading(true);
    userApi
      .getLinkedChildHistory(selectedChild.id)
      .then((res) => {
        if (cancelled) return;
        setSessions(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChild?.id]);

  const formatDuration = (seconds?: number | null) => {
    const safe = Math.max(0, seconds ?? 0);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/90 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/parent/dashboard')}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Historique enfant</h1>
            <p className="text-sm text-slate-500">
              {selectedChild ? `${selectedChild.prenom} ${selectedChild.nom}` : 'Aucun enfant sélectionné'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Aucune session trouvée pour cet enfant.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Jeu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Durée</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{session.gameTitle}</p>
                      <p className="text-xs text-slate-500">{session.gameType}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {session.dateDebut ? format(new Date(session.dateDebut), 'dd/MM/yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4 text-slate-500" />
                        {formatDuration(session.durationSeconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{session.scoreFinal ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

