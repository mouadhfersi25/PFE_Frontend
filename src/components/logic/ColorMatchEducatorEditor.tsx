import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import {
  LOGIC_COLOR_PRESETS,
  isValidHexColor,
  normalizeHexColor,
  type ColorWordPair,
} from '@/constants/logicPuzzleTypes';

interface ColorMatchEducatorEditorProps {
  pairs: ColorWordPair[];
  disabled?: boolean;
  onChange: (pairs: ColorWordPair[]) => void;
}

export function ColorMatchEducatorEditor({ pairs, disabled, onChange }: ColorMatchEducatorEditorProps) {
  const updatePair = (index: number, patch: Partial<ColorWordPair>) => {
    onChange(pairs.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const addPair = (hex?: string, word?: string) => {
    onChange([
      ...pairs,
      {
        color: hex ? normalizeHexColor(hex) : '#ef4444',
        word: word ?? '',
      },
    ]);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Reliez chaque <strong>couleur</strong> au <strong>mot</strong> correspondant. Le joueur fera la même chose avec des flèches.
      </p>

      <div className="flex flex-wrap gap-2">
        {LOGIC_COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            type="button"
            disabled={disabled}
            title={`Ajouter ${c.label}`}
            onClick={() => addPair(c.hex, c.label.toLowerCase())}
            className="w-9 h-9 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform disabled:opacity-50"
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {pairs.map((pair, index) => (
          <div
            key={`pair-${index}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-white px-3 py-3 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-[8rem]">
              <input
                type="color"
                disabled={disabled}
                value={isValidHexColor(pair.color) ? pair.color : '#ef4444'}
                onChange={(e) => updatePair(index, { color: normalizeHexColor(e.target.value) })}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200 disabled:opacity-50"
              />
              <span
                className="w-10 h-10 rounded-lg border border-gray-300 shadow-inner shrink-0"
                style={{ backgroundColor: pair.color || '#ef4444' }}
              />
            </div>

            <ArrowRight className="w-6 h-6 text-violet-500 shrink-0" aria-hidden />

            <input
              type="text"
              disabled={disabled}
              value={pair.word}
              onChange={(e) => updatePair(index, { word: e.target.value })}
              placeholder="Ex. rouge"
              className="flex-1 min-w-[8rem] px-3 py-2 rounded-xl border border-gray-300"
            />

            {!disabled && (
              <button
                type="button"
                onClick={() => removePair(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Supprimer la liaison"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={() => addPair()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-violet-300 text-violet-700 hover:bg-violet-50 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Ajouter une liaison couleur → mot
        </button>
      )}

      {pairs.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Ajoutez au moins 2 liaisons (ex. rouge → rouge, violet → violet).
        </p>
      )}
    </div>
  );
}
