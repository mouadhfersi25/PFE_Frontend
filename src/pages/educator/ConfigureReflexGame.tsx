import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2, Zap, WandSparkles } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO } from '@/api/types/api.types';

const STIMULI_OPTIONS = [
  { value: 'TARGET_ICON', label: "Cible icône (classique)" },
  { value: 'COLOR_FLASH', label: 'Flash couleur' },
  { value: 'MIXED', label: 'Mixte' },
];

const MODEL_OPTIONS = [
  { value: 'CLASSIC', label: 'Classique' },
  { value: 'GO_NO_GO', label: 'Go / No-Go' },
  { value: 'CHOICE_REACTION', label: 'Choice Reaction' },
];

export default function ConfigureReflexGame() {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const id = gameId != null ? Number(gameId) : NaN;

  const [game, setGame] = useState<GameDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombreRounds, setNombreRounds] = useState(10);
  const [tempsReactionMaxMs, setTempsReactionMaxMs] = useState(2000);
  const [typeStimuli, setTypeStimuli] = useState('TARGET_ICON');
  const [modeleReflexe, setModeleReflexe] = useState<'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION'>('CLASSIC');
  const [noGoRatio, setNoGoRatio] = useState(30);
  const [choiceTargetCount, setChoiceTargetCount] = useState(3);
  const [difficulte, setDifficulte] = useState(5);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

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
          setHasExistingSettings(true);
          setNombreRounds(s.nombreRounds ?? 10);
          setTempsReactionMaxMs(s.tempsReactionMaxMs ?? 2000);
          setTypeStimuli(s.typeStimuli ?? 'TARGET_ICON');
          setModeleReflexe((s.modeleReflexe as 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION') ?? 'CLASSIC');
          setNoGoRatio(s.noGoRatio ?? 30);
          setChoiceTargetCount(s.choiceTargetCount ?? 3);
          setDifficulte(s.difficulte ?? (g.difficulte ?? 5));
        } else {
          setHasExistingSettings(false);
          setDifficulte(g.difficulte ?? 5);
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

  const saveSettings = async () => {
    if (!game || !canEdit) return;
    if (nombreRounds < 1 || nombreRounds > 30) {
      toast.error('Le nombre de rounds doit être entre 1 et 30');
      return;
    }
    if (tempsReactionMaxMs < 500 || tempsReactionMaxMs > 5000) {
      toast.error('Le temps de réaction max doit être entre 500ms et 5000ms');
      return;
    }
    if (modeleReflexe === 'GO_NO_GO' && (noGoRatio < 10 || noGoRatio > 90)) {
      toast.error('Le ratio No-Go doit être entre 10% et 90%');
      return;
    }
    if (modeleReflexe === 'CHOICE_REACTION' && (choiceTargetCount < 2 || choiceTargetCount > 6)) {
      toast.error('Le nombre de choix doit être entre 2 et 6');
      return;
    }
    setSaving(true);
    try {
      await educatorApi.upsertReflexSettings({
        jeuId: game.id,
        nombreRounds,
        tempsReactionMaxMs,
        typeStimuli,
        modeleReflexe,
        noGoRatio: modeleReflexe === 'GO_NO_GO' ? noGoRatio : 30,
        choiceTargetCount: modeleReflexe === 'CHOICE_REACTION' ? choiceTargetCount : 3,
        difficulte,
      });
      toast.success('Paramètres réflexe enregistrés');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const generateWithAi = async () => {
    if (!game || !canEdit) return;
    setAiLoading(true);
    try {
      const res = await educatorApi.generateReflexSettingsPreview({ gameId: game.id });
      const s = res.data;
      setModeleReflexe((s.modeleReflexe as 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION') ?? 'CLASSIC');
      setNombreRounds(s.nombreRounds ?? 10);
      setTempsReactionMaxMs(s.tempsReactionMaxMs ?? 2000);
      setTypeStimuli(s.typeStimuli ?? 'TARGET_ICON');
      setNoGoRatio(s.noGoRatio ?? 30);
      setChoiceTargetCount(s.choiceTargetCount ?? 3);
      setDifficulte(s.difficulte ?? 5);
      toast.success('Configuration IA générée. Vérifiez puis enregistrez.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Échec génération IA');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!game || !canEdit) return;
    if (hasExistingSettings) return;
    const shouldAutoGenerate = Boolean((location.state as { autoGenerateAi?: boolean } | null)?.autoGenerateAi);
    if (!shouldAutoGenerate) return;

    let cancelled = false;
    setAiLoading(true);
    educatorApi.generateReflexSettingsPreview({ gameId: game.id })
      .then((res) => {
        if (cancelled) return;
        const s = res.data;
        setModeleReflexe((s.modeleReflexe as 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION') ?? 'CLASSIC');
        setNombreRounds(s.nombreRounds ?? 10);
        setTempsReactionMaxMs(s.tempsReactionMaxMs ?? 2000);
        setTypeStimuli(s.typeStimuli ?? 'TARGET_ICON');
        setNoGoRatio(s.noGoRatio ?? 30);
        setChoiceTargetCount(s.choiceTargetCount ?? 3);
        setDifficulte(s.difficulte ?? 5);
        return educatorApi.upsertReflexSettings({
          jeuId: game.id,
          modeleReflexe: (s.modeleReflexe as 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION') ?? 'CLASSIC',
          nombreRounds: s.nombreRounds ?? 10,
          tempsReactionMaxMs: s.tempsReactionMaxMs ?? 2000,
          typeStimuli: s.typeStimuli ?? 'TARGET_ICON',
          noGoRatio: s.noGoRatio ?? 30,
          choiceTargetCount: s.choiceTargetCount ?? 3,
          difficulte: s.difficulte ?? 5,
        });
      })
      .then(() => {
        if (!cancelled) {
          setHasExistingSettings(true);
          toast.success('Configuration Réflexe générée par IA.');
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          toast.error(err?.response?.data?.message ?? 'Échec génération IA');
        }
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => { cancelled = true; };
  }, [game, canEdit, hasExistingSettings, location.state]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
          <p className="text-gray-600">{error ?? 'Jeu introuvable'}</p>
          <button onClick={() => navigate('/educator/games/manage')} className="ml-4 text-emerald-600 hover:underline">
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
            <div className="mt-3">
              <button
                type="button"
                onClick={generateWithAi}
                disabled={aiLoading || !canEdit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />}
                Générer automatiquement avec IA
              </button>
            </div>
          </div>

          {!canEdit && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              Jeu finalisé: configuration verrouillée.
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de rounds</label>
              <input
                type="number"
                min={1}
                max={30}
                disabled={!canEdit}
                value={nombreRounds}
                onChange={(e) => setNombreRounds(Number(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
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
                onChange={(e) => setTempsReactionMaxMs(Number(e.target.value) || 500)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Modèle Réflexe</label>
              <select
                disabled={!canEdit}
                value={modeleReflexe}
                onChange={(e) => setModeleReflexe(e.target.value as 'CLASSIC' | 'GO_NO_GO' | 'CHOICE_REACTION')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type de stimuli</label>
              <select
                disabled={!canEdit}
                value={typeStimuli}
                onChange={(e) => setTypeStimuli(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
              >
                {STIMULI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulté gameplay (0-10)</label>
              <input
                type="number"
                min={0}
                max={10}
                disabled={!canEdit}
                value={difficulte}
                onChange={(e) => setDifficulte(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
              />
            </div>

            {modeleReflexe === 'GO_NO_GO' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ratio No-Go (%)</label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  disabled={!canEdit}
                  value={noGoRatio}
                  onChange={(e) => setNoGoRatio(Number(e.target.value) || 10)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
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
                  onChange={(e) => setChoiceTargetCount(Number(e.target.value) || 2)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                />
              </div>
            )}

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
