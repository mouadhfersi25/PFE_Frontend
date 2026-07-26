import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, MemoryCardDTO } from '@/api/types/api.types';

/** Une ligne = une paire. Champs alignés sur CreateMemoryCardRequest / MemoryCardDTO (symbole, pairKey, categorie). */
type PairRow = {
  pairKey: string;
  categorie: string;
  card1: { id?: number; symbole: string };
  card2: { id?: number; symbole: string };
};

/** Icônes (emojis) uniquement : l’éducateur choisit des icônes, le joueur joue avec des icônes. */
const ICON_PICKER = [
  '🍎', '🍐', '🍊', '🍋', '🍌', '🥝', '🍑', '🍒', '🍓', '🥥', '🍇', '🍈', '🍉', '🫐', '🥑', '🍆',
  '🦁', '🐘', '🐼', '🦊', '🐸', '🐙', '🦋', '🐢', '🐶', '🐱', '🐰', '🐻', '🐨', '🐯', '🐮', '🐷',
  '🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎹', '⭐', '🔥', '💎', '🌈', '🌍', '🎃', '🎄', '❤️',
];

/** Catégories proposées dans la liste déroulante (alignées aux types d'icônes). */
const CATEGORIES_PREDEFINED = ['Fruits', 'Animaux', 'Objets', 'Symboles', 'Divers'] as const;

/** Afficher uniquement une icône (emoji). Si c’est du texte (ex. ancien import), on affiche ? pour inviter à choisir une icône. */
function displayIcon(symbole: string): string {
  if (!symbole) return '?';
  if (ICON_PICKER.includes(symbole)) return symbole;
  if (/^\p{Emoji}$/u.test(symbole)) return symbole;
  return '?';
}

function groupCardsIntoPairs(cards: MemoryCardDTO[]): PairRow[] {
  const byKey = new Map<string, MemoryCardDTO[]>();
  for (const c of cards) {
    const k = c.pairKey ?? `orphan-${c.id}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(c);
  }
  const pairs: PairRow[] = [];
  byKey.forEach((list, key) => {
    const cat = list[0]?.categorie ?? '';
    if (list.length >= 2) {
      pairs.push({
        pairKey: key,
        categorie: cat,
        card1: { id: list[0].id, symbole: list[0].symbole },
        card2: { id: list[1].id, symbole: list[1].symbole },
      });
    } else if (list.length === 1) {
      pairs.push({
        pairKey: key,
        categorie: cat,
        card1: { id: list[0].id, symbole: list[0].symbole },
        card2: { symbole: '' },
      });
    }
  });
  return pairs;
}

export default function ConfigureMemoryGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const id = gameId != null ? Number(gameId) : NaN;
  const [game, setGame] = useState<GameDTO | null>(null);
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerFor, setPickerFor] = useState<{ index: number; side: 1 | 2 } | null>(null);

  /** Liste déroulante catégorie : prédéfinies + catégories déjà utilisées dans les paires. */
  const categoryOptions = useMemo(() => {
    const fromPairs = pairs.map((p) => p.categorie?.trim()).filter(Boolean) as string[];
    const combined = [...CATEGORIES_PREDEFINED, ...fromPairs];
    return [...new Set(combined)].sort((a, b) => a.localeCompare(b));
  }, [pairs]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      setError('Invalid game id');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([educatorApi.getGameById(id), educatorApi.getMemoryCards(id)])
      .then(([gameRes, cardsRes]) => {
        if (cancelled) return;
        const g = gameRes.data;
        if (!g || g.typeJeu !== 'MEMOIRE') {
          setError('Jeu introuvable ou pas un jeu Memory.');
          setGame(null);
          setPairs([]);
        } else {
          setGame(g);
          const list = Array.isArray(cardsRes.data) ? cardsRes.data : [];
          setPairs(groupCardsIntoPairs(list));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? err?.message ?? 'Erreur de chargement.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  const canEdit = game?.etat === 'BROUILLON' || game?.etat === 'REFUSE';

  const addPair = () => {
    if (!canEdit) return;
    setPairs((prev) => [
      ...prev,
      {
        pairKey: `pair-${Date.now()}`,
        categorie: '',
        card1: { symbole: '' },
        card2: { symbole: '' },
      },
    ]);
  };

  const updatePair = (index: number, side: 1 | 2, value: string) => {
    if (!canEdit) return;
    setPairs((prev) => {
      const next = [...prev];
      const p = { ...next[index] };
      if (side === 1) p.card1 = { ...p.card1, symbole: value };
      else p.card2 = { ...p.card2, symbole: value };
      next[index] = p;
      return next;
    });
  };

  const updatePairField = (index: number, field: 'pairKey' | 'categorie', value: string) => {
    if (!canEdit) return;
    setPairs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removePair = async (index: number) => {
    if (!canEdit) return;
    const row = pairs[index];
    if (row.card1.id != null) {
      try { await educatorApi.deleteMemoryCard(row.card1.id); } catch (_) {}
    }
    if (row.card2.id != null) {
      try { await educatorApi.deleteMemoryCard(row.card2.id); } catch (_) {}
    }
    await refreshPairs();
    toast.success('Paire supprimée.');
  };

  const refreshPairs = async () => {
    if (!game) return;
    const cardsRes = await educatorApi.getMemoryCards(game.id);
    const list = Array.isArray(cardsRes.data) ? cardsRes.data : [];
    setPairs(groupCardsIntoPairs(list));
  };

  const savePair = async (index: number) => {
    if (!game || !canEdit) return;
    const row = pairs[index];
    const s1 = (row.card1.symbole ?? '').trim();
    const s2 = (row.card2.symbole ?? '').trim();
    if (!s1 || !s2) {
      toast.error('Choisissez une icône pour chaque carte.');
      return;
    }
    setSaving(true);
    try {
      const key = (row.pairKey ?? '').trim() || `pair-${Date.now()}-${index}`;
      const categorie = (row.categorie ?? '').trim() || undefined;

      if (row.card1.id != null && row.card2.id != null) {
        await educatorApi.updateMemoryCard(row.card1.id, { symbole: s1, pairKey: key, categorie: categorie ?? null });
        await educatorApi.updateMemoryCard(row.card2.id, { symbole: s2, pairKey: key, categorie: categorie ?? null });
        toast.success('Paire modifiée.');
      } else {
        await educatorApi.createMemoryCard({ jeuId: game.id, symbole: s1, pairKey: key, categorie: categorie ?? null });
        await educatorApi.createMemoryCard({ jeuId: game.id, symbole: s2, pairKey: key, categorie: categorie ?? null });
        toast.success('Paire ajoutée au jeu.');
      }
      await refreshPairs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Erreur.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectIcon = (icon: string) => {
    if (!canEdit || pickerFor == null) return;
    updatePair(pickerFor.index, pickerFor.side, icon);
    setPickerFor(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Chargement…</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Jeu introuvable.'}</p>
          <button onClick={() => navigate('/educator/games/manage')} className="ml-4 text-green-600 hover:underline">
            Retour aux jeux
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />

      <div className="flex-1 overflow-auto pt-16">
        <div className="p-6 md:p-8 max-w-4xl">
          <button
            onClick={() => navigate('/educator/games/manage')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 mb-5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux jeux
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{game.titre} — Paires (icônes)</h1>
            <p className="text-sm text-gray-500">
              {canEdit
                ? 'Cliquez sur chaque case pour choisir une icône (emoji). Un « ? » signifie qu’il faut choisir une icône.'
                : 'Lecture seule : ce jeu est finalisé, vous ne pouvez plus modifier les paires.'}
            </p>
          </div>

          {!canEdit && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              Ce jeu a été finalisé. La modification des paires est désactivée.
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{pairs.length}</span> paire{pairs.length > 1 ? 's' : ''}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={addPair}
              disabled={saving || !canEdit}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter une paire
            </motion.button>
          </div>

          <div className="space-y-4">
            {pairs.map((row, index) => (
              <div
                key={row.pairKey + index}
                className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm"
              >
                {/* Symbole 1 (carte 1) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Symbole 1</label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setPickerFor(pickerFor?.index === index && pickerFor?.side === 1 ? null : { index, side: 1 })}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-3xl bg-gray-50 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    title="Choisir une icône"
                  >
                    {displayIcon(row.card1.symbole)}
                  </button>
                  {pickerFor?.index === index && pickerFor?.side === 1 && (
                    <div className="absolute left-0 top-full mt-1 z-10 p-3 bg-white rounded-xl shadow-lg border border-gray-200 min-w-[200px] max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-6 gap-2" style={{ width: 'max-content' }}>
                        {ICON_PICKER.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => selectIcon(icon)}
                            className="min-w-[36px] min-h-[36px] w-9 h-9 flex items-center justify-center text-2xl hover:bg-purple-100 rounded-lg flex-shrink-0"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </div>
                <span className="text-gray-400 text-xl self-end pb-3">↔</span>
                {/* Symbole 2 (carte 2) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Symbole 2</label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setPickerFor(pickerFor?.index === index && pickerFor?.side === 2 ? null : { index, side: 2 })}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-3xl bg-gray-50 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    title="Choisir une icône"
                  >
                    {displayIcon(row.card2.symbole)}
                  </button>
                  {pickerFor?.index === index && pickerFor?.side === 2 && (
                    <div className="absolute left-0 top-full mt-1 z-10 p-3 bg-white rounded-xl shadow-lg border border-gray-200 min-w-[200px] max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-6 gap-2" style={{ width: 'max-content' }}>
                        {ICON_PICKER.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => selectIcon(icon)}
                            className="min-w-[36px] min-h-[36px] w-9 h-9 flex items-center justify-center text-2xl hover:bg-purple-100 rounded-lg flex-shrink-0"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </div>
                {/* Catégorie (optionnel) — liste déroulante selon icônes / existantes */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Catégorie</label>
                  <select
                    value={row.categorie}
                    disabled={!canEdit}
                    onChange={(e) => updatePairField(index, 'categorie', e.target.value)}
                    className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:opacity-50"
                  >
                    <option value="">— Optionnel —</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => savePair(index)}
                  disabled={saving || !canEdit}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-sm"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => removePair(index)}
                  disabled={saving || !canEdit}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
