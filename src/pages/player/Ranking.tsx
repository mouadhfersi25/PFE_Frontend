import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Award, Globe, MapPin, Flag } from 'lucide-react';
import { useAuth } from '@/context';
import PlayerHeaderActions from '@/components/player/PlayerHeaderActions';
import userApi from '@/api/user/user.api';
import type {
  LeaderboardScope,
  PlayerLeaderboardRanksDTO,
  SoloLeaderboardResponseDTO,
} from '@/api/types/api.types';

function formatRankLine(rank: number | null | undefined, total: number, unavailable?: boolean) {
  if (unavailable) return '—';
  if (rank == null || total <= 0) return 'Non classé';
  return `#${rank} / ${total}`;
}

export default function Ranking() {
  const navigate = useNavigate();
  const { playerProfile } = useAuth();
  const currentUserId = playerProfile?.id != null ? Number(playerProfile.id) : null;
  const [scope, setScope] = useState<LeaderboardScope>('GLOBAL');
  const [board, setBoard] = useState<SoloLeaderboardResponseDTO | null>(null);
  const [myRanks, setMyRanks] = useState<PlayerLeaderboardRanksDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback((nextScope: LeaderboardScope) => {
    setError(null);
    return userApi.getSoloLeaderboardScoped(nextScope)
      .then((response) => setBoard(response.data ?? null))
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setBoard(null);
        setError(err?.response?.data?.message ?? 'Impossible de charger ce classement.');
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    userApi.getMyLeaderboardRanks().then((response) => {
      if (!cancelled) setMyRanks(response.data ?? null);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadBoard(scope).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [scope, loadBoard]);

  const players = useMemo(
    () => (board?.entries ?? []).map((player, index) => ({ ...player, rank: index + 1 })),
    [board]
  );

  const rankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-slate-300">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 bg-slate-950/75 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/player/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Classement des joueurs</h1>
                <p className="text-sm text-slate-300">Tous les scores personnels, solo et en ligne</p>
              </div>
            </div>
          </div>
          <PlayerHeaderActions />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {myRanks && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Mondial', icon: Globe, value: formatRankLine(myRanks.globalRank, myRanks.globalTotal) },
              {
                label: myRanks.paysNom || 'Mon pays',
                icon: Flag,
                value: formatRankLine(myRanks.countryRank, myRanks.countryTotal, !myRanks.countryRankingAvailable),
              },
              {
                label: myRanks.regionNom || 'Ma région',
                icon: MapPin,
                value: formatRankLine(myRanks.regionRank, myRanks.regionTotal, !myRanks.regionRankingAvailable),
              },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-cyan-300 mb-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold truncate">{label}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {([
            { id: 'GLOBAL' as const, label: 'Mondial', icon: Globe, disabled: false },
            { id: 'COUNTRY' as const, label: myRanks?.paysNom ? `Pays · ${myRanks.paysNom}` : 'Mon pays', icon: Flag, disabled: !myRanks?.countryRankingAvailable },
            { id: 'REGION' as const, label: myRanks?.regionNom ? `Région · ${myRanks.regionNom}` : 'Ma région', icon: MapPin, disabled: !myRanks?.regionRankingAvailable },
          ]).map(({ id, label, icon: Icon, disabled }) => (
            <button
              key={id}
              disabled={disabled}
              onClick={() => setScope(id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                scope === id
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'border-white/20 hover:bg-white/10 disabled:opacity-40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/15 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Medal className="w-5 h-5" />
              Top joueurs · {board?.scopeLabel ?? 'Mondial'}
            </h2>
            <p className="text-white/90 text-sm">Classement par score personnel total</p>
          </div>

          {loading ? (
            <div className="px-6 py-6 text-slate-300">Chargement du classement...</div>
          ) : error ? (
            <div className="px-6 py-6 text-amber-200">{error}</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {players.map((player, index) => {
                const isCurrent = currentUserId != null && Number(player.userId) === currentUserId;
                return (
                  <motion.li
                    key={player.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-4 px-6 py-4 ${isCurrent ? 'bg-emerald-500/20 border-l-4 border-emerald-400' : ''}`}
                  >
                    <div className="w-12 flex justify-center">{rankIcon(player.rank)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {player.displayName?.trim() || `Joueur ${player.userId}`}
                        {isCurrent && <span className="ml-2 text-xs text-emerald-100">Toi</span>}
                      </p>
                      <p className="text-sm text-slate-300">Niveau {player.level ?? 1}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="font-bold">{(player.totalScore ?? 0).toLocaleString()} pts</span>
                    </div>
                  </motion.li>
                );
              })}
              {players.length === 0 && (
                <li className="px-6 py-6 text-slate-300">Aucun joueur classé pour le moment.</li>
              )}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
