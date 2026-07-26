import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorVoiceApi from '@/api/educator/educatorVoice.api';
import type { VoicePromptDTO } from '@/api/types/voice.types';
import {
  VOICE_SUBTYPE_OPTIONS,
  VOICE_TOLERANCE_OPTIONS,
  type VoicePromptSubtype,
  type VoiceTolerance,
} from '@/constants/voiceExerciseTypes';

type PromptDraft = {
  id?: number;
  texteReference: string;
  sousType: VoicePromptSubtype;
  tolerance: VoiceTolerance;
  indice: string;
  dureeMaxSecondes: number;
};

const emptyPrompt = (): PromptDraft => ({
  texteReference: '',
  sousType: 'READ_ALOUD',
  tolerance: 'NORMAL',
  indice: '',
  dureeMaxSecondes: 30,
});

export default function VoiceSeriesEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [seriesId, setSeriesId] = useState<number | null>(id ? Number(id) : null);
  const [etat, setEtat] = useState('BROUILLON');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [langue, setLangue] = useState('fr');
  const [difficulte, setDifficulte] = useState(3);
  const [prompts, setPrompts] = useState<PromptDraft[]>([emptyPrompt()]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    educatorVoiceApi.getSeriesById(Number(id))
      .then((res) => {
        const data = res.data;
        setSeriesId(data.id);
        setEtat(data.etat);
        setTitre(data.titre);
        setDescription(data.description || '');
        setLangue(data.langue || 'fr');
        setDifficulte(data.difficulte ?? 3);
        const rows = (data.prompts ?? []).map((p: VoicePromptDTO) => ({
          id: p.id,
          texteReference: p.texteReference,
          sousType: p.sousType,
          tolerance: p.tolerance,
          indice: p.indice || '',
          dureeMaxSecondes: p.dureeMaxSecondes ?? 30,
        }));
        setPrompts(rows.length > 0 ? rows : [emptyPrompt()]);
      })
      .catch(() => toast.error('Série introuvable'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const canEdit = etat === 'BROUILLON';

  const updatePrompt = (index: number, patch: Partial<PromptDraft>) => {
    setPrompts((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const saveSeries = async () => {
    if (!titre.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    setSaving(true);
    try {
      let currentId = seriesId;
      if (!currentId) {
        const created = await educatorVoiceApi.createSeries({
          titre: titre.trim(),
          description: description.trim() || undefined,
          langue,
          difficulte,
        });
        currentId = created.data.id;
        setSeriesId(currentId);
      } else {
        await educatorVoiceApi.updateSeries(currentId, {
          titre: titre.trim(),
          description: description.trim() || undefined,
          langue,
          difficulte,
        });
      }

      for (let index = 0; index < prompts.length; index += 1) {
        const row = prompts[index];
        if (!row.texteReference.trim()) continue;
        if (row.id) {
          await educatorVoiceApi.updatePrompt(row.id, {
            texteReference: row.texteReference.trim(),
            ordre: index,
            sousType: row.sousType,
            tolerance: row.tolerance,
            indice: row.indice.trim() || undefined,
            dureeMaxSecondes: row.dureeMaxSecondes,
          });
        } else {
          const createdPrompt = await educatorVoiceApi.createPrompt({
            seriesId: currentId,
            texteReference: row.texteReference.trim(),
            ordre: index,
            sousType: row.sousType,
            tolerance: row.tolerance,
            indice: row.indice.trim() || undefined,
            dureeMaxSecondes: row.dureeMaxSecondes,
          });
          updatePrompt(index, { id: createdPrompt.data.id });
        }
      }

      toast.success('Série enregistrée');
      if (!isEdit && currentId) {
        navigate(`/educator/voice/series/${currentId}/edit`, { replace: true });
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const removePrompt = async (index: number) => {
    const row = prompts[index];
    if (row.id) {
      try {
        await educatorVoiceApi.deletePrompt(row.id);
      } catch {
        toast.error('Suppression impossible');
        return;
      }
    }
    setPrompts((rows) => rows.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <EducatorHeader title={isEdit ? 'Éditer la série orale' : 'Nouvelle série orale'} />
        <main className="flex-1 p-6 max-w-4xl">
          <button
            type="button"
            onClick={() => navigate('/educator/voice/series')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux séries
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Informations</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                value={titre}
                disabled={!canEdit}
                onChange={(e) => setTitre(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                disabled={!canEdit}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                <select
                  value={langue}
                  disabled={!canEdit}
                  onChange={(e) => setLangue(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulté (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={difficulte}
                  disabled={!canEdit}
                  onChange={(e) => setDifficulte(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Consignes orales</h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setPrompts((rows) => [...rows, emptyPrompt()])}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              )}
            </div>

            {prompts.map((row, index) => (
              <div key={row.id ?? `draft-${index}`} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">Consigne {index + 1}</p>
                  {canEdit && (
                    <button type="button" onClick={() => void removePrompt(index)} className="text-rose-600 hover:text-rose-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={row.texteReference}
                  disabled={!canEdit}
                  onChange={(e) => updatePrompt(index, { texteReference: e.target.value })}
                  rows={3}
                  placeholder="Texte que le joueur devra lire à voix haute…"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={row.sousType}
                    disabled={!canEdit}
                    onChange={(e) => updatePrompt(index, { sousType: e.target.value as VoicePromptSubtype })}
                    className="rounded-xl border border-gray-300 px-3 py-2"
                  >
                    {VOICE_SUBTYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select
                    value={row.tolerance}
                    disabled={!canEdit}
                    onChange={(e) => updatePrompt(index, { tolerance: e.target.value as VoiceTolerance })}
                    className="rounded-xl border border-gray-300 px-3 py-2"
                  >
                    {VOICE_TOLERANCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={row.dureeMaxSecondes}
                    disabled={!canEdit}
                    onChange={(e) => updatePrompt(index, { dureeMaxSecondes: Number(e.target.value) })}
                    className="rounded-xl border border-gray-300 px-3 py-2"
                    placeholder="Durée max (s)"
                  />
                </div>
                <input
                  value={row.indice}
                  disabled={!canEdit}
                  onChange={(e) => updatePrompt(index, { indice: e.target.value })}
                  placeholder="Indice optionnel"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5"
                />
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="mt-6">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveSeries()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer la série
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
