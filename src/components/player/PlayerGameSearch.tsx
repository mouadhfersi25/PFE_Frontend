import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Gamepad2 } from 'lucide-react';
import type { GameDTO } from '@/api/types/api.types';

type PlayerGameSearchProps = {
  games: GameDTO[];
  onSelectGame: (game: GameDTO) => void;
  className?: string;
};

function formatType(type: GameDTO['typeJeu']) {
  if (type === 'QUIZ') return 'Quiz';
  if (type === 'MEMOIRE') return 'Mémoire';
  if (type === 'LOGIQUE') return 'Logique';
  return 'Réflexe';
}

export default function PlayerGameSearch({ games, onSelectGame, className = '' }: PlayerGameSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => {
      const hay = `${g.titre} ${g.description ?? ''} ${formatType(g.typeJeu)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [games, query]);

  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un jeu…"
          className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-400 outline-none ring-0 focus:border-cyan-400/50 focus:bg-white/10"
          aria-label="Rechercher un jeu"
          aria-expanded={open}
          aria-controls="player-game-search-results"
        />
      </div>

      {open && (
        <div
          id="player-game-search-results"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-slate-400">Aucun jeu trouvé.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-white/10 overflow-y-auto">
              {filtered.map((game) => (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                      onSelectGame(game);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/25 text-lg">
                      {game.icone || <Gamepad2 className="h-4 w-4 text-cyan-300" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{game.titre}</span>
                      <span className="block text-xs text-slate-400">{formatType(game.typeJeu)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
