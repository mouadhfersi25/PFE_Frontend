import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, MemoryCardDTO } from '@/api/types/api.types';
import {
  MEMORY_PAIR_MODES,
  COLOR_PRESETS,
  buildMemoryPairCardPayloads,
  cardDisplayValue,
  getMemoryPairModeMeta,
  inferMemoryPairMode,
  pairValuesFromCards,
  validateMemoryPair,
  type MemoryPairMode,
} from '@/constants/memoryPairTypes';

const EMOJI_PICKER = [
  '🍎', '🍐', '🍊', '🍋', '🍌', '🥝', '🍑', '🍒', '🍓', '🥥', '🍇', '🍈', '🍉', '🫐', '🥑', '🍆',
  '🦁', '🐘', '🐼', '🦊', '🐸', '🐙', '🦋', '🐢', '🐶', '🐱', '🐰', '🐻', '🐨', '🐯', '🐮', '🐷',
  '🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎹', '⭐', '🔥', '💎', '🌈', '🌍', '🎃', '🎄', '❤️',
];

type PairRow = {
  pairKey: string;
  mode: MemoryPairMode;
  card1Value: string;
  card2Value: string;
  card1: { id?: number; cardType?: string };
  card2: { id?: number; cardType?: string };
};

function slotForCard(list: MemoryCardDTO[], mode: MemoryPairMode): { card1: MemoryCardDTO; card2: MemoryCardDTO } {
  if (mode === 'IMAGE_WORD') {
    const imageCard = list.find((c) => (c.cardType || '').toUpperCase() === 'IMAGE') ?? list[0];
    const textCard = list.find((c) => (c.cardType || '').toUpperCase() === 'TEXT') ?? list[1] ?? list[0];
    return { card1: imageCard, card2: textCard };
  }
  if (mode === 'COLOR_WORD') {
    const colorCard = list.find((c) => (c.cardType || '').toUpperCase() === 'COLOR') ?? list[0];
    const textCard = list.find((c) => (c.cardType || '').toUpperCase() === 'TEXT') ?? list[1] ?? list[0];
    return { card1: colorCard, card2: textCard };
  }
  return { card1: list[0], card2: list[1] ?? list[0] };
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
    if (list.length >= 2) {
      const mode = inferMemoryPairMode(list);
      const { card1Value, card2Value } = pairValuesFromCards(list, mode);
      const slots = slotForCard(list, mode);
      pairs.push({
        pairKey: key,
        mode,
        card1Value,
        card2Value,
        card1: { id: slots.card1.id, cardType: (slots.card1.cardType || 'EMOJI').toUpperCase() },
        card2: { id: slots.card2.id, cardType: (slots.card2.cardType || 'EMOJI').toUpperCase() },
      });
    } else if (list.length === 1) {
      const mode = inferMemoryPairMode(list);
      pairs.push({
        pairKey: key,
        mode,
        card1Value: cardDisplayValue(list[0]),
        card2Value: '',
        card1: { id: list[0].id, cardType: (list[0].cardType || 'EMOJI').toUpperCase() },
        card2: {},
      });
    }
  });
  return pairs;
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier doit être une image.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Image trop lourde (max 2 Mo).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
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
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-white';

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      setError('Identifiant de jeu invalide.');
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
          setError('Jeu introuvable ou pas un jeu mémoire.');
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
    return () => {
      cancelled = true;
    };
  }, [id]);

  const canEdit = game?.etat === 'BROUILLON' || game?.etat === 'REFUSE';

  const updatePair = (index: number, patch: Partial<PairRow>) => {
    if (!canEdit) return;
    setPairs((prev) => {
      const n = [...prev];
      n[index] = { ...n[index], ...patch };
      return n;
    });
  };

  const addPair = () => {
    if (!canEdit) return;
    setPairs((prev) => [
      ...prev,
      {
        pairKey: `pair-${Date.now()}`,
        mode: 'IDENTICAL',
        card1Value: '',
        card2Value: '',
        card1: {},
        card2: {},
      },
    ]);
  };

  const removePair = async (index: number) => {
    if (!canEdit) return;
    const row = pairs[index];
    if (row.card1.id != null) {
      try {
        await educatorApi.deleteMemoryCard(row.card1.id);
      } catch {
        /* ignore */
      }
    }
    if (row.card2.id != null) {
      try {
        await educatorApi.deleteMemoryCard(row.card2.id);
      } catch {
        /* ignore */
      }
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
    const validationError = validateMemoryPair(row.mode, row.card1Value, row.card2Value);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const key = (row.pairKey ?? '').trim() || `pair-${Date.now()}-${index}`;
      const payloads = buildMemoryPairCardPayloads(row.mode, key, row.card1Value, row.card2Value);

      if (row.card1.id != null && row.card2.id != null) {
        await educatorApi.updateMemoryCard(row.card1.id, payloads[0]);
        await educatorApi.updateMemoryCard(row.card2.id, payloads[1]);
        toast.success('Paire mise à jour.');
      } else {
        await educatorApi.createMemoryCard({ jeuId: game.id, ...payloads[0] });
        await educatorApi.createMemoryCard({ jeuId: game.id, ...payloads[1] });
        toast.success('Paire enregistrée.');
      }
      await refreshPairs();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Erreur.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleImageFile = async (index: number, file: File | undefined) => {
    if (!file || !canEdit) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      updatePair(index, { card1Value: dataUrl });
      toast.success('Image chargée.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de charger l’image.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-16">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-600 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-16 px-6">
          <p className="text-gray-600 text-center">{error ?? 'Jeu introuvable.'}</p>
          <button
            type="button"
            onClick={() => navigate('/educator/games/manage')}
            className="text-emerald-600 font-semibold hover:underline"
          >
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
        <div className="p-8 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/educator/games/manage')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all mb-6"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Retour à la liste des jeux
          </button>

          <div className="h-24 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center px-6 mb-6 shadow-lg">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">{game.titre}</h1>
              <p className="text-white/90 text-sm mt-1">Configurer les paires de cartes mémoire</p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 mb-8 text-sm text-emerald-900">
            <p className="font-semibold mb-2">Types de paires disponibles</p>
            <ul className="space-y-1.5">
              {MEMORY_PAIR_MODES.map((m) => (
                <li key={m.value}>
                  <strong>{m.label}</strong> — {m.description}{' '}
                  <span className="text-emerald-700 italic">(ex. {m.example})</span>
                </li>
              ))}
            </ul>
          </div>

          {!canEdit && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              Ce jeu n’est plus en brouillon : modification des paires désactivée.
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{pairs.length}</span> paire{pairs.length > 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={addPair}
              disabled={saving || !canEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une paire
            </button>
          </div>

          <div className="space-y-6">
            {pairs.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
                Aucune paire. Cliquez sur « Ajouter une paire » pour commencer.
              </div>
            )}

            {pairs.map((row, index) => {
              const meta = getMemoryPairModeMeta(row.mode);
              return (
                <motion.div
                  key={row.pairKey + index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-gray-200 bg-white p-6 md:p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900">Paire {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removePair(index)}
                      disabled={saving || !canEdit}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50 transition-colors"
                      title="Supprimer la paire"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type de paire</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MEMORY_PAIR_MODES.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          disabled={!canEdit}
                          onClick={() =>
                            updatePair(index, {
                              mode: m.value,
                              card1Value: m.value === 'IDENTICAL' ? row.card1Value : row.card1Value,
                              card2Value: m.value === 'IDENTICAL' ? '' : row.card2Value,
                            })
                          }
                          className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all ${
                            row.mode === m.value
                              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                              : 'border-gray-200 bg-gray-50 hover:border-emerald-300'
                          } disabled:opacity-50`}
                        >
                          <span className="font-bold text-gray-900">{m.label}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{m.example}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {row.mode === 'IDENTICAL' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Les <strong>deux cartes</strong> afficheront le même emoji dans le jeu.
                      </p>
                      <div className="flex flex-wrap items-start gap-4">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setOpenPickerIndex(openPickerIndex === index ? null : index)}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-5xl bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {row.card1Value || '?'}
                        </button>
                        <div className="flex-1 min-w-[12rem]">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{meta.card1Label}</label>
                          <input
                            type="text"
                            value={row.card1Value}
                            disabled={!canEdit}
                            onChange={(e) => updatePair(index, { card1Value: e.target.value.slice(0, 100) })}
                            maxLength={100}
                            className={inputClass}
                            placeholder="Ex. 🦁"
                          />
                        </div>
                      </div>
                      {openPickerIndex === index && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-52 overflow-y-auto">
                          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                            {EMOJI_PICKER.map((ic) => (
                              <button
                                key={ic}
                                type="button"
                                onClick={() => {
                                  updatePair(index, { card1Value: ic });
                                  setOpenPickerIndex(null);
                                }}
                                className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-emerald-100 transition-colors"
                              >
                                {ic}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {row.mode === 'BILINGUAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{meta.card1Label}</label>
                        <input
                          type="text"
                          value={row.card1Value}
                          disabled={!canEdit}
                          onChange={(e) => updatePair(index, { card1Value: e.target.value })}
                          className={inputClass}
                          placeholder="Ex. chat"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{meta.card2Label}</label>
                        <input
                          type="text"
                          value={row.card2Value}
                          disabled={!canEdit}
                          onChange={(e) => updatePair(index, { card2Value: e.target.value })}
                          className={inputClass}
                          placeholder="Ex. cat"
                        />
                      </div>
                    </div>
                  )}

                  {row.mode === 'IMAGE_WORD' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{meta.card1Label}</label>
                        <input
                          type="url"
                          value={row.card1Value.startsWith('data:') ? '' : row.card1Value}
                          disabled={!canEdit}
                          onChange={(e) => updatePair(index, { card1Value: e.target.value })}
                          className={`${inputClass} mb-2`}
                          placeholder="https://… ou chargez un fichier"
                        />
                        <input
                          ref={(el) => {
                            fileInputRefs.current[index] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={!canEdit}
                          onChange={(e) => void handleImageFile(index, e.target.files?.[0])}
                        />
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => fileInputRefs.current[index]?.click()}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Charger une image
                        </button>
                        {row.card1Value && (
                          <div className="mt-3 w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                            <img src={row.card1Value} alt="Aperçu" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{meta.card2Label}</label>
                        <input
                          type="text"
                          value={row.card2Value}
                          disabled={!canEdit}
                          onChange={(e) => updatePair(index, { card2Value: e.target.value })}
                          className={inputClass}
                          placeholder="Ex. apple"
                        />
                      </div>
                    </div>
                  )}

                  {row.mode === 'COLOR_WORD' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{meta.card1Label}</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {COLOR_PRESETS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              disabled={!canEdit}
                              title={c.label}
                              onClick={() => updatePair(index, { card1Value: c.hex })}
                              className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                                row.card1Value.toLowerCase() === c.hex.toLowerCase()
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                  : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={row.card1Value.startsWith('#') ? row.card1Value : '#ef4444'}
                            disabled={!canEdit}
                            onChange={(e) => updatePair(index, { card1Value: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer border border-gray-200"
                          />
                          <input
                            type="text"
                            value={row.card1Value}
                            disabled={!canEdit}
                            onChange={(e) => updatePair(index, { card1Value: e.target.value })}
                            className={inputClass}
                            placeholder="#ef4444"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{meta.card2Label}</label>
                        <input
                          type="text"
                          value={row.card2Value}
                          disabled={!canEdit}
                          onChange={(e) => updatePair(index, { card2Value: e.target.value })}
                          className={inputClass}
                          placeholder="Ex. red"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => savePair(index)}
                      disabled={saving || !canEdit}
                      className="px-6 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
                    >
                      {saving ? 'Enregistrement…' : 'Enregistrer la paire'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
