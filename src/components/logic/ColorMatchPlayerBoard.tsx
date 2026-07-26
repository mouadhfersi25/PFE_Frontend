import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeHexColor, type ColorWordPair } from '@/constants/logicPuzzleTypes';

interface ColorMatchPlayerBoardProps {
  pairs: ColorWordPair[];
  disabled?: boolean;
  links: Record<string, string>;
  onChangeLinks: (links: Record<string, string>) => void;
}

type Point = { x: number; y: number };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ColorMatchPlayerBoard({
  pairs,
  disabled,
  links,
  onChangeLinks,
}: ColorMatchPlayerBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const colorRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const wordRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const [linePoints, setLinePoints] = useState<Array<{ color: string; word: string; from: Point; to: Point }>>([]);

  const colors = useMemo(
    () => shuffle(pairs.map((p) => normalizeHexColor(p.color))),
    [pairs],
  );
  const words = useMemo(
    () => shuffle(pairs.map((p) => p.word.trim())),
    [pairs],
  );

  const recomputeLines = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    const next: Array<{ color: string; word: string; from: Point; to: Point }> = [];

    for (const [color, word] of Object.entries(links)) {
      if (!word) continue;
      const fromEl = colorRefs.current[color];
      const toEl = wordRefs.current[word];
      if (!fromEl || !toEl) continue;
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      next.push({
        color,
        word,
        from: {
          x: fromRect.right - boardRect.left,
          y: fromRect.top + fromRect.height / 2 - boardRect.top,
        },
        to: {
          x: toRect.left - boardRect.left,
          y: toRect.top + toRect.height / 2 - boardRect.top,
        },
      });
    }
    setLinePoints(next);
  }, [links]);

  useEffect(() => {
    recomputeLines();
    const onResize = () => recomputeLines();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recomputeLines, colors, words]);

  const handleColorClick = (color: string) => {
    if (disabled) return;
    setPendingColor((prev) => (prev === color ? null : color));
  };

  const handleWordClick = (word: string) => {
    if (disabled || !pendingColor) return;
    const next = { ...links };
    for (const [c, w] of Object.entries(next)) {
      if (w === word) delete next[c];
    }
    next[normalizeHexColor(pendingColor)] = word;
    onChangeLinks(next);
    setPendingColor(null);
    requestAnimationFrame(recomputeLines);
  };

  const removeLinkForColor = (color: string) => {
    if (disabled) return;
    const next = { ...links };
    delete next[color];
    onChangeLinks(next);
    setPendingColor(null);
  };

  return (
    <div className="mb-6">
      <p className="text-sm text-slate-300 mb-4 text-center">
        1. Clique sur une <strong>couleur</strong> · 2. Clique sur le <strong>mot</strong> correspondant pour tracer une flèche
      </p>

      <div ref={boardRef} className="relative grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-start min-h-[220px]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <defs>
            <marker id="color-match-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#c084fc" />
            </marker>
          </defs>
          {linePoints.map((line) => (
            <line
              key={`${line.color}-${line.word}`}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
              stroke="#c084fc"
              strokeWidth={3}
              markerEnd="url(#color-match-arrow)"
            />
          ))}
        </svg>

        <div className="space-y-3 z-20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide text-center">Couleurs</p>
          {colors.map((color) => {
            const linkedWord = links[color];
            const isPending = pendingColor === color;
            return (
              <button
                key={color}
                type="button"
                ref={(el) => {
                  colorRefs.current[color] = el;
                }}
                disabled={disabled}
                onClick={() => handleColorClick(color)}
                onDoubleClick={() => removeLinkForColor(color)}
                className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2 transition-all ${
                  isPending
                    ? 'border-fuchsia-400 bg-fuchsia-500/25 ring-2 ring-fuchsia-400/40'
                    : linkedWord
                      ? 'border-emerald-400/60 bg-emerald-500/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
              >
                <span
                  className="w-12 h-12 rounded-xl border border-white/30 shadow-inner shrink-0"
                  style={{ backgroundColor: color }}
                />
                {linkedWord && <span className="text-xs text-emerald-300 truncate">→ {linkedWord}</span>}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex flex-col items-center justify-center pt-10 text-violet-400/80">
          <span className="text-2xl">→</span>
        </div>

        <div className="space-y-3 z-20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide text-center">Mots</p>
          {words.map((word) => {
            const isLinked = Object.values(links).includes(word);
            return (
              <button
                key={word}
                type="button"
                ref={(el) => {
                  wordRefs.current[word] = el;
                }}
                disabled={disabled || !pendingColor}
                onClick={() => handleWordClick(word)}
                className={`w-full rounded-xl border-2 px-4 py-3 text-center font-semibold transition-all ${
                  isLinked
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
                    : pendingColor
                      ? 'border-white/20 bg-white/5 text-white hover:border-fuchsia-400/60 hover:bg-fuchsia-500/15'
                      : 'border-white/15 bg-white/5 text-slate-300'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-2">
        Double-clic sur une couleur pour supprimer sa flèche.
      </p>
    </div>
  );
}
