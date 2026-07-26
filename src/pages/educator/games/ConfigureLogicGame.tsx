import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, LogicPuzzleDTO } from '@/api/types';
import {
  LOGIC_SUBTYPE_CATALOG,
  getLogicSubtypeMeta,
  normalizeLogicSubtype,
  parseColorWordPairs,
  serializeColorMatchLinks,
  validateColorWordPairs,
  type ColorWordPair,
  type LogicPuzzleDataExtended,
  type LogicSubtype,
} from '@/constants/logicPuzzleTypes';
import { ColorMatchEducatorEditor } from '@/components/logic/ColorMatchEducatorEditor';

type PuzzleForm = {
  id?: number;
  subtype: LogicSubtype;
  enonce: string;
  sequence: string;
  options: string;
  colorPairs: ColorWordPair[];
  bonneReponse: string;
  indice: string;
  difficulte: number;
};

function parseData(raw: string | null): LogicPuzzleDataExtended {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LogicPuzzleDataExtended;
  } catch {
    return {};
  }
}

function rowFromDto(p: LogicPuzzleDTO): PuzzleForm {
  const data = parseData(p.donnees);
  const subtype = normalizeLogicSubtype(p.sousType || data.type);
  const colorPairs = subtype === 'COLOR_MATCH' ? parseColorWordPairs(data, p.bonneReponse) : [];

  return {
    id: p.id,
    subtype,
    enonce: p.enonce || '',
    sequence: Array.isArray(data.sequence) ? data.sequence.join(', ') : '',
    options: subtype === 'COLOR_MATCH' ? '' : (Array.isArray(data.options) ? data.options.join('\n') : ''),
    colorPairs,
    bonneReponse: subtype === 'COLOR_MATCH' ? '' : (p.bonneReponse || ''),
    indice: p.indice || '',
    difficulte: p.difficulte ?? 5,
  };
}

export default function ConfigureLogicGame() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const id = gameId != null ? Number(gameId) : NaN;

  const [game, setGame] = useState<GameDTO | null>(null);
  const [rows, setRows] = useState<PuzzleForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = game?.etat === 'BROUILLON' || game?.etat === 'REFUSE';

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      setError('Identifiant de jeu invalide.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([educatorApi.getGameById(id), educatorApi.getLogicPuzzles(id)])
      .then(([gRes, pRes]) => {
        if (cancelled) return;
        const g = gRes.data;
        if (!g || g.typeJeu !== 'LOGIQUE') {
          setError("Jeu introuvable ou ce n'est pas un jeu logique.");
          setGame(null);
          setRows([]);
          return;
        }
        setGame(g);
        const list = Array.isArray(pRes.data) ? pRes.data : [];
        setRows(list.map(rowFromDto));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message ?? err?.message ?? 'Erreur de chargement.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const emptyRow = useMemo<PuzzleForm>(
    () => ({
      subtype: 'DEDUCTION',
      enonce: '',
      sequence: '',
      options: '',
      colorPairs: [],
      bonneReponse: '',
      indice: '',
      difficulte: 5,
    }),
    [],
  );

  const addRow = () => {
    setRows((prev) => [{ ...emptyRow }, ...prev]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateRow = (index: number, patch: Partial<PuzzleForm>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const toPayload = (r: PuzzleForm) => {
    const sequence = r.sequence.split(',').map((v) => v.trim()).filter(Boolean);
    const data: LogicPuzzleDataExtended = { type: r.subtype };

    if (r.subtype === 'SUITE_LOGIQUE') {
      data.sequence = sequence;
    } else if (r.subtype === 'COLOR_MATCH') {
      data.colorPairs = r.colorPairs.map((p) => ({
        color: p.color.trim(),
        word: p.word.trim(),
      }));
      data.options = r.colorPairs.map((p) => p.color.trim());
    } else {
      data.options = r.options.split('\n').map((v) => v.trim()).filter(Boolean);
    }

    return {
      enonce: r.enonce.trim(),
      sousType: r.subtype,
      bonneReponse:
        r.subtype === 'COLOR_MATCH'
          ? serializeColorMatchLinks(r.colorPairs)
          : r.bonneReponse.trim(),
      indice: r.indice.trim() || null,
      difficulte: Math.max(0, Math.min(10, r.difficulte || 0)),
      donnees: JSON.stringify(data),
    };
  };

  const validateRow = (row: PuzzleForm): string | null => {
    if (!row.enonce.trim()) return 'L’énoncé est requis.';

    if (row.subtype === 'SUITE_LOGIQUE') {
      if (!row.bonneReponse.trim()) return 'La bonne réponse est requise.';
      const seq = row.sequence.split(',').map((v) => v.trim()).filter(Boolean);
      if (seq.length < 3) return 'La suite doit contenir au moins 3 éléments.';
      return null;
    }

    if (row.subtype === 'COLOR_MATCH') {
      return validateColorWordPairs(row.colorPairs);
    }

    if (!row.bonneReponse.trim()) return 'La bonne réponse est requise.';
    const opts = row.options.split('\n').map((v) => v.trim()).filter(Boolean);
    if (opts.length < 2) return 'Ajoutez au moins 2 options.';
    const match = opts.some((o) => o.toLowerCase() === row.bonneReponse.trim().toLowerCase());
    if (!match) return 'La bonne réponse doit correspondre exactement à l’une des options.';
    return null;
  };

  const saveRow = async (index: number) => {
    if (!game || !canEdit) return;
    const row = rows[index];
    const validationError = validateRow(row);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(row);
      if (row.id) {
        await educatorApi.updateLogicPuzzle(row.id, payload);
        toast.success('Puzzle modifié.');
      } else {
        const created = await educatorApi.createLogicPuzzle({ jeuId: game.id, ...payload });
        updateRow(index, { id: created.data.id });
        toast.success('Puzzle ajouté.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de la sauvegarde.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (index: number) => {
    if (!canEdit) return;
    const row = rows[index];
    if (!row.id) {
      setRows((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    if (!window.confirm('Supprimer ce puzzle ?')) return;
    setSaving(true);
    try {
      await educatorApi.deleteLogicPuzzle(row.id);
      setRows((prev) => prev.filter((_, i) => i !== index));
      toast.success('Puzzle supprimé.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de la suppression.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-16">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
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
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-16">
          <p className="text-gray-600">{error ?? 'Jeu introuvable.'}</p>
          <button type="button" onClick={() => navigate('/educator/games/manage')} className="text-blue-600 hover:underline font-semibold">
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
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/educator/games/manage')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 mb-5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux jeux
          </button>

          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 mb-6 shadow-lg text-white">
            <h1 className="text-2xl font-bold">{game.titre}</h1>
            <p className="text-white/90 text-sm mt-1">Configuration des puzzles logiques</p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 mb-6 text-sm text-blue-950">
            <p className="font-semibold mb-2">Les 4 types de puzzles</p>
            <ul className="space-y-1.5">
              {LOGIC_SUBTYPE_CATALOG.map((s) => (
                <li key={s.value}>
                  <strong>{s.label}</strong> — {s.description}{' '}
                  <span className="text-blue-700 italic">(ex. {s.example})</span>
                </li>
              ))}
            </ul>
          </div>

          {!canEdit && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              Jeu finalisé : la configuration est verrouillée.
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{rows.length}</span> puzzle{rows.length > 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={addRow}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Ajouter un puzzle
            </button>
          </div>

          {rows.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center text-gray-500 text-sm mb-4">
              Aucun puzzle. Cliquez sur « Ajouter un puzzle » pour commencer.
            </div>
          )}

          <div className="space-y-5">
            {rows.map((row, idx) => {
              const meta = getLogicSubtypeMeta(row.subtype);
              return (
                <motion.div
                  key={`${row.id ?? 'new'}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Puzzle {rows.length - idx}</h3>
                    <button
                      type="button"
                      onClick={() => deleteRow(idx)}
                      disabled={!canEdit || saving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type de puzzle</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {LOGIC_SUBTYPE_CATALOG.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          disabled={!canEdit}
                          onClick={() =>
                            updateRow(idx, {
                              subtype: s.value,
                              colorPairs: s.value === 'COLOR_MATCH' ? row.colorPairs : [],
                              bonneReponse: s.value === row.subtype ? row.bonneReponse : '',
                            })
                          }
                          className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all ${
                            row.subtype === s.value
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                              : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                          } disabled:opacity-50`}
                        >
                          <span className="font-bold text-gray-900">{s.label}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{s.example}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {meta.educatorHint}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Énoncé</label>
                      <textarea
                        rows={2}
                        disabled={!canEdit}
                        value={row.enonce}
                        onChange={(e) => updateRow(idx, { enonce: e.target.value })}
                        placeholder="Ex. Relie chaque couleur à son nom en français."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Difficulté (0–10)</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        disabled={!canEdit}
                        value={row.difficulte}
                        onChange={(e) => updateRow(idx, { difficulte: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300"
                      />
                    </div>
                  </div>

                  {row.subtype === 'SUITE_LOGIQUE' && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Suite (éléments séparés par des virgules)</label>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={row.sequence}
                        onChange={(e) => updateRow(idx, { sequence: e.target.value })}
                        placeholder="2, 4, 8, 16"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300"
                      />
                    </div>
                  )}

                  {(row.subtype === 'INTRUS' || row.subtype === 'DEDUCTION') && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Options (une par ligne)</label>
                      <textarea
                        rows={4}
                        disabled={!canEdit}
                        value={row.options}
                        onChange={(e) => updateRow(idx, { options: e.target.value })}
                        placeholder={'Chat\nChien\nVoiture\nLapin'}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-sm"
                      />
                    </div>
                  )}

                  {row.subtype === 'COLOR_MATCH' && (
                    <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                      <ColorMatchEducatorEditor
                        pairs={row.colorPairs}
                        disabled={!canEdit}
                        onChange={(colorPairs) => updateRow(idx, { colorPairs })}
                      />
                    </div>
                  )}

                  {row.subtype !== 'COLOR_MATCH' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Bonne réponse</label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={row.bonneReponse}
                          onChange={(e) => updateRow(idx, { bonneReponse: e.target.value })}
                          placeholder={row.subtype === 'SUITE_LOGIQUE' ? 'Ex. 32' : 'Doit correspondre à une option'}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Indice (optionnel)</label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={row.indice}
                          onChange={(e) => updateRow(idx, { indice: e.target.value })}
                          placeholder="Aide pour le joueur"
                          className="w-full px-3 py-2 rounded-xl border border-gray-300"
                        />
                      </div>
                    </div>
                  )}

                  {row.subtype === 'COLOR_MATCH' && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Indice (optionnel)</label>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={row.indice}
                        onChange={(e) => updateRow(idx, { indice: e.target.value })}
                        placeholder="Ex. Pense à la couleur du ciel"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveRow(idx)}
                      disabled={!canEdit || saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60 font-semibold text-sm"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Enregistrement…' : 'Enregistrer le puzzle'}
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
