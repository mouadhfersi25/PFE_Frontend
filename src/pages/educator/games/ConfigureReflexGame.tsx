import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2, Zap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO } from '@/api/types/api.types';

const STIMULI_OPTIONS = [
  { value: 'TARGET_ICON', label: "Cible icône (classique)" },
  { value: 'COLOR_FLASH', label: 'Flash couleur' },

];

const MODEL_OPTIONS = [
  { value: 'CLASSIC', label: 'Classique' },
  { value: 'GO_NO_GO', label: 'Go / No-Go' },
  { value: 'CHOICE_REACTION', label: 'Choice Reaction' },
  { value: 'STROOP_INVERSE', label: 'Stroop inverse' },
];

type ReflexModel = 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION' | 'STROOP_INVERSE';

/** Le joueur utilise la grande cible icône / flash : uniquement Classique et Go-No-Go. */
function usesStimulusTypeField(model: ReflexModel | ''): boolean {
  return model === 'CLASSIC' || model === 'GO_NO_GO';
}

const EMPTY_FORM = {
  nombreRounds: '' as number | '',
  tempsReactionMaxMs: '' as number | '',
  typeStimuli: '',
  modeleReflexe: '' as ReflexModel | '',
  noGoRatio: '' as number | '',
  choiceTargetCount: '' as number | '',
  difficulte: '' as number | '',
};

function parseNumberInput(raw: string): number | '' {
  if (raw.trim() === '') return '';
  const n = Number(raw);
  return Number.isFinite(n) ? n : '';
}

export default function ConfigureReflexGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const id = gameId != null ? Number(gameId) : NaN;

  const [game, setGame] = useState<GameDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombreRounds, setNombreRounds] = useState<number | ''>(EMPTY_FORM.nombreRounds);
  const [tempsReactionMaxMs, setTempsReactionMaxMs] = useState<number | ''>(EMPTY_FORM.tempsReactionMaxMs);
  const [typeStimuli, setTypeStimuli] = useState(EMPTY_FORM.typeStimuli);
  const [modeleReflexe, setModeleReflexe] = useState<ReflexModel | ''>(EMPTY_FORM.modeleReflexe);
  const [noGoRatio, setNoGoRatio] = useState<number | ''>(EMPTY_FORM.noGoRatio);
  const [choiceTargetCount, setChoiceTargetCount] = useState<number | ''>(EMPTY_FORM.choiceTargetCount);
  const [difficulte, setDifficulte] = useState<number | ''>(EMPTY_FORM.difficulte);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      setError('Identifiant jeu invalide');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      educatorApi.getGameById(id),
      educatorApi.getReflexSettings(id).catch(() => null),
    ])
      .then(([gameRes, settingsRes]) => {
        if (cancelled) return;
        const g = gameRes.data;
        if (!g || g.typeJeu !== 'REFLEXE') {
          setError("Jeu introuvable ou ce n'est pas un jeu de type réflexe");
          setGame(null);
          return;
        }
        setGame(g);
        const s = settingsRes?.data;
        if (s) {
          const loadedModel = (s.modeleReflexe as ReflexModel) ?? '';
          setNombreRounds(s.nombreRounds ?? '');
          setTempsReactionMaxMs(s.tempsReactionMaxMs ?? '');
          setModeleReflexe(loadedModel);
          setTypeStimuli(
            usesStimulusTypeField(loadedModel) ? (s.typeStimuli ?? '') : '',
          );
          setNoGoRatio(s.noGoRatio ?? '');
          setChoiceTargetCount(s.choiceTargetCount ?? '');
          setDifficulte(s.difficulte ?? '');
        } else {
          setNombreRounds(EMPTY_FORM.nombreRounds);
          setTempsReactionMaxMs(EMPTY_FORM.tempsReactionMaxMs);
          setTypeStimuli(EMPTY_FORM.typeStimuli);
          setModeleReflexe(EMPTY_FORM.modeleReflexe);
          setNoGoRatio(EMPTY_FORM.noGoRatio);
          setChoiceTargetCount(EMPTY_FORM.choiceTargetCount);
          setDifficulte(EMPTY_FORM.difficulte);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message ?? err?.message ?? 'Erreur chargement');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const canEdit = game?.etat === 'BROUILLON' || game?.etat === 'REFUSE';

  const stimulusOptions = useMemo(() => {
    if (!usesStimulusTypeField(modeleReflexe)) return [];
    return STIMULI_OPTIONS;
  }, [modeleReflexe]);

  const typeStimuliForApi = useMemo(() => {
    if (!modeleReflexe) return 'TARGET_ICON';
    return usesStimulusTypeField(modeleReflexe) ? (typeStimuli || 'TARGET_ICON') : 'TARGET_ICON';
  }, [modeleReflexe, typeStimuli]);

  const saveSettings = async () => {
    if (!game || !canEdit) return;

    if (
      nombreRounds === '' ||
      tempsReactionMaxMs === '' ||
      !modeleReflexe ||
      difficulte === ''
    ) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (usesStimulusTypeField(modeleReflexe) && !typeStimuli) {
      toast.error('Veuillez choisir un type de stimuli pour ce modèle');
      return;
    }

    if (nombreRounds < 1 || nombreRounds > 30) {
      toast.error('Le nombre de rounds doit être entre 1 et 30');
      return;
    }
    if (tempsReactionMaxMs < 500 || tempsReactionMaxMs > 5000) {
      toast.error('Le temps de réaction max doit être entre 500ms et 5000ms');
      return;
    }
    if (modeleReflexe === 'GO_NO_GO' && (noGoRatio === '' || noGoRatio < 10 || noGoRatio > 90)) {
      toast.error('Le ratio No-Go doit être entre 10% et 90%');
      return;
    }
    if (modeleReflexe === 'CHOICE_REACTION' && (choiceTargetCount === '' || choiceTargetCount < 2 || choiceTargetCount > 6)) {
      toast.error('Le nombre de choix doit être entre 2 et 6');
      return;
    }

    setSaving(true);
    try {
      await educatorApi.upsertReflexSettings({
        jeuId: game.id,
        nombreRounds,
        tempsReactionMaxMs,
        typeStimuli: typeStimuliForApi,
        modeleReflexe,
        ...(modeleReflexe === 'GO_NO_GO' ? { noGoRatio: noGoRatio as number } : { noGoRatio: null }),
        ...(modeleReflexe === 'CHOICE_REACTION'
          ? { choiceTargetCount: choiceTargetCount as number }
          : { choiceTargetCount: null }),
        difficulte,
      });
      toast.success('Paramètres réflexe enregistrés. Vous pouvez finaliser le jeu.');
      navigate('/educator/games/type/reflex');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">{error ?? 'Jeu introuvable'}</p>
          <button type="button" onClick={() => navigate('/educator/games/manage')} className="ml-4 text-emerald-600 hover:underline">
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
        <div className="p-6 md:p-8 max-w-3xl">
          <button
            type="button"
            onClick={() => navigate('/educator/games/manage')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 mb-5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux jeux
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-semibold mb-3">
              <Zap className="w-4 h-4" />
              Configuration Réflexe
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{game.titre}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Paramètre ton jeu réflexe pour offrir différentes façons de jouer.
            </p>
          </div>

          {!canEdit && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              Jeu finalisé: configuration verrouillée.
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Modèle Réflexe</label>
              <select
                disabled={!canEdit}
                value={modeleReflexe}
                onChange={(e) => {
                  const next = e.target.value as ReflexModel | '';
                  setModeleReflexe(next);
                  if (!usesStimulusTypeField(next)) {
                    setTypeStimuli('');
                  }
                  if (next !== 'GO_NO_GO') {
                    setNoGoRatio('');
                  }
                  if (next !== 'CHOICE_REACTION') {
                    setChoiceTargetCount('');
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60 text-gray-900"
              >
                <option value="" disabled>
                  Choisir un modèle
                </option>
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {usesStimulusTypeField(modeleReflexe) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de stimuli</label>
                <p className="text-xs text-gray-500 mb-2">
                  S’applique à la cible unique (Classique et Go / No-Go). Les trois options sont valables pour ces modèles.
                </p>
                <select
                  disabled={!canEdit}
                  value={typeStimuli}
                  onChange={(e) => setTypeStimuli(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60 text-gray-900"
                >
                  <option value="" disabled>
                    Choisir un type de stimuli
                  </option>
                  {stimulusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {modeleReflexe === 'GO_NO_GO' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ratio No-Go (%)</label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  disabled={!canEdit}
                  value={noGoRatio}
                  placeholder="Ex. 30"
                  onChange={(e) => setNoGoRatio(parseNumberInput(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60 placeholder:text-gray-400"
                />
              </div>
            )}

            {modeleReflexe === 'CHOICE_REACTION' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de choix visibles</label>
                <input
                  type="number"
                  min={2}
                  max={6}
                  disabled={!canEdit}
                  value={choiceTargetCount}
                  placeholder="Ex. 3"
                  onChange={(e) => setChoiceTargetCount(parseNumberInput(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60 placeholder:text-gray-400"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de rounds</label>
              <input
                type="number"
                min={1}
                max={30}
                disabled={!canEdit}
                value={nombreRounds}
                placeholder="Ex. 10"
                onChange={(e) => setNombreRounds(parseNumberInput(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Temps réaction max (ms)</label>
              <input
                type="number"
                min={500}
                max={5000}
                step={100}
                disabled={!canEdit}
                value={tempsReactionMaxMs}
                placeholder="Ex. 2000"
                onChange={(e) => setTempsReactionMaxMs(parseNumberInput(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulté gameplay (0-10)</label>
              <input
                type="number"
                min={0}
                max={10}
                disabled={!canEdit}
                value={difficulte}
                placeholder="Ex. 5"
                onChange={(e) => {
                  const parsed = parseNumberInput(e.target.value);
                  if (parsed === '') {
                    setDifficulte('');
                  } else {
                    setDifficulte(Math.max(0, Math.min(10, parsed)));
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60 placeholder:text-gray-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving || !canEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer la configuration
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
