import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import educatorApi from '@/api/educator/educator.api';
import type { TypeJeu, ModeJeu } from '@/api/types';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import {
  validateRequired,
  validateInteger,
  validateMaxLength,
  runValidations,
  type ValidationResult,
} from '@/utils/formValidation';

const ICONS = ['🎮', '🧮', '🧠', '🎯', '⚡', '🔬', '🦁', '🌟', '🚀', '🎨'];

const FORM_TYPE_TO_TYPE_JEU: Record<string, TypeJeu> = {
  quiz: 'QUIZ',
  memory: 'MEMOIRE',
  logic: 'LOGIQUE',
  reflex: 'REFLEXE',
};

const TYPE_FIELD_PLACEHOLDERS: Record<string, { title: string; description: string }> = {
  quiz: {
    title: 'ex. Histoire de la Révolution Française',
    description: 'Posez des questions à choix multiples sur le programme d’histoire.',
  },
  memory: {
    title: 'ex. Mémoriser des éléments de la nature',
    description: 'Associez des paires en fonction d’images/icônes similaires.',
  },
  logic: {
    title: 'ex. Résoudre des énigmes logiques pas à pas',
    description: 'Proposez des défis de logique et de raisonnement.',
  },
  reflex: {
    title: 'ex. Réagir rapidement aux couleurs',
    description: 'Définissez un jeu où les joueurs doivent répondre vite.',
  },
};

const DIFFICULTY_TO_NUMBER: Record<string, number> = {
  Easy: 2,
  Medium: 5,
  Hard: 8,
};

const normalizeFormType = (value: string): string => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'memoire' || normalized === 'memory') return 'memory';
  if (normalized === 'quiz') return 'quiz';
  if (normalized === 'logique' || normalized === 'logic') return 'logic';
  if (normalized === 'reflexe' || normalized === 'reflex') return 'reflex';
  return '';
};

export default function EducatorAddGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryType = normalizeFormType(searchParams.get('type') || '');

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: string;
    mode: ModeJeu | '';
    ageMin: number | '';
    ageMax: number | '';
    difficulty: string;
    estimatedTime: string;
    icon: string;
    actif: boolean;
  }>({
    title: '',
    description: '',
    type: queryType || '',
    mode: '',
    ageMin: 7,
    ageMax: 18,
    difficulty: '',
    estimatedTime: '',
    icon: '',
    actif: false,
  });

  const activePlaceholders = {
    title: '',
    description: '',
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationResult>({});

  const validate = (): boolean => {
    const ageMin = formData.ageMin === '' ? NaN : Number(formData.ageMin);
    const ageMax = formData.ageMax === '' ? NaN : Number(formData.ageMax);
    const dureeStr = formData.estimatedTime?.trim() ?? '';
    const duree = parseInt(formData.estimatedTime ?? '', 10);
    const ageMinErr = formData.ageMin === '' ? "L'âge min est requis" : validateInteger(ageMin, 7, 18, 'Âge min entre 7 et 18');
    const ageMaxErr = formData.ageMax === '' ? "L'âge max est requis" : (validateInteger(ageMax, 7, 18, 'Âge max entre 7 et 18')
      ?? (ageMin > ageMax ? "L'âge max doit être ≥ âge min" : null));
    const estimatedTimeErr = validateRequired(dureeStr, 'La durée est requise')
      ?? validateInteger(duree, 1, 999, 'Durée entre 1 et 999 minutes');
    const rules = [
      { field: 'title', message: validateRequired(formData.title, 'Titre du jeu requis') },
      { field: 'description', message: validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 2000, 'Maximum 2000 caractères') },
      { field: 'type', message: validateRequired(formData.type, 'Le type de jeu est requis') },
      { field: 'mode', message: validateRequired(formData.mode, 'Le mode de jeu est requis') },
      { field: 'difficulty', message: validateRequired(formData.difficulty, 'La difficulté est requise') },
      { field: 'ageMin', message: ageMinErr },
      { field: 'ageMax', message: ageMaxErr },
      { field: 'estimatedTime', message: estimatedTimeErr },
      { field: 'icon', message: validateRequired(formData.icon, 'Choisissez une icône') },
    ];
    const next = runValidations(rules);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const created = await educatorApi.createGame({
        titre: formData.title.trim(),
        description: formData.description.trim() || undefined,
        difficulte: DIFFICULTY_TO_NUMBER[formData.difficulty],
        ageMin: Number(formData.ageMin),
        ageMax: Number(formData.ageMax),
        typeJeu: FORM_TYPE_TO_TYPE_JEU[formData.type],
        modeJeu: formData.mode,
        dureeMinutes: parseInt(formData.estimatedTime, 10) || 15,
        icone: formData.icon || undefined,
        actif: formData.actif,
      });

      toast.success('Jeu créé avec succès ! Il sera visible après validation par l\'administrateur.');
      if (FORM_TYPE_TO_TYPE_JEU[formData.type] === 'REFLEXE' && created?.data?.id) {
        navigate(`/educator/games/reflex/${created.data.id}/configure`, { state: { autoGenerateAi: true } });
      } else {
        navigate('/educator/games/manage');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || 'Erreur lors de la création du jeu.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />
      <div className="flex-1 overflow-auto pt-16">
        <div className="p-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate('/educator/games/manage')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Retour à la liste des jeux
            </button>
          </div>

          <div className="h-28 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center p-6 mb-8 shadow-lg">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">Ajouter un jeu</h1>
              <p className="text-white/90 text-sm mt-1">Le jeu sera soumis à validation par l'administrateur avant d'être publié.</p>
            </div>
          </div>

          {/* Info box */}
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
            <span className="text-lg">⏳</span>
            <div>
              <p className="font-semibold">Processus de validation</p>
              <p>Après création, votre jeu aura le statut <strong>En attente</strong>. L'administrateur devra l'accepter avant sa publication.</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-0" noValidate>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
                  {error}
                </div>
              )}

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Infos générales
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Titre du jeu *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors((p) => ({ ...p, title: '' })); }}
                      className={`${inputClass} ${errors.title ? 'border-red-500' : ''}`}
                      placeholder={activePlaceholders.title}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Description du jeu *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((p) => ({ ...p, description: '' })); }}
                      className={`${inputClass} min-h-[120px] resize-y ${errors.description ? 'border-red-500' : ''}`}
                      placeholder={activePlaceholders.description}
                      rows={4}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Type & paramètres
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className={labelClass}>Type de jeu *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => { setFormData({ ...formData, type: e.target.value }); setErrors((p) => ({ ...p, type: '' })); }}
                      className={`${inputClass} ${errors.type ? 'border-red-500' : ''}`}
                    >
                      <option value="">— Choisir —</option>
                      <option value="quiz">Quiz</option>
                      <option value="memory">Memory</option>
                      <option value="logic">Logic</option>
                      <option value="reflex">Reflex</option>
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Mode de jeu *</label>
                    <select
                      value={formData.mode}
                      onChange={(e) => { setFormData({ ...formData, mode: e.target.value as ModeJeu | '' }); setErrors((p) => ({ ...p, mode: '' })); }}
                      className={`${inputClass} ${errors.mode ? 'border-red-500' : ''}`}
                    >
                      <option value="">— Choisir —</option>
                      <option value="INDIVIDUEL">Individuel</option>
                      <option value="COLLECTIF">Collectif</option>
                    </select>
                    {errors.mode && <p className="mt-1 text-sm text-red-600">{errors.mode}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Difficulté *</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => { setFormData({ ...formData, difficulty: e.target.value }); setErrors((p) => ({ ...p, difficulty: '' })); }}
                      className={`${inputClass} ${errors.difficulty ? 'border-red-500' : ''}`}
                    >
                      <option value="">— Choisir —</option>
                      <option value="Easy">Facile</option>
                      <option value="Medium">Moyen</option>
                      <option value="Hard">Difficile</option>
                    </select>
                    {errors.difficulty && <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Âge min * (7–18)</label>
                    <input
                      type="number"
                      value={formData.ageMin === '' ? '' : formData.ageMin}
                      onChange={(e) => { const v = e.target.value; setFormData({ ...formData, ageMin: v === '' ? '' : (parseInt(v, 10) || 7) }); setErrors((p) => ({ ...p, ageMin: '', ageMax: '' })); }}
                      className={`${inputClass} ${errors.ageMin ? 'border-red-500' : ''}`}
                      placeholder="7"
                    />
                    {errors.ageMin && <p className="mt-1 text-sm text-red-600">{errors.ageMin}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Âge max * (7–18)</label>
                    <input
                      type="number"
                      value={formData.ageMax === '' ? '' : formData.ageMax}
                      onChange={(e) => { const v = e.target.value; setFormData({ ...formData, ageMax: v === '' ? '' : (parseInt(v, 10) || 18) }); setErrors((p) => ({ ...p, ageMax: '' })); }}
                      className={`${inputClass} ${errors.ageMax ? 'border-red-500' : ''}`}
                      placeholder="18"
                    />
                    {errors.ageMax && <p className="mt-1 text-sm text-red-600">{errors.ageMax}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Durée (minutes) *</label>
                    <input
                      type="number"
                      value={formData.estimatedTime}
                      onChange={(e) => { setFormData({ ...formData, estimatedTime: e.target.value }); setErrors((p) => ({ ...p, estimatedTime: '' })); }}
                      className={`${inputClass} ${errors.estimatedTime ? 'border-red-500' : ''}`}
                      placeholder="ex. 15"
                    />
                    {errors.estimatedTime && <p className="mt-1 text-sm text-red-600">{errors.estimatedTime}</p>}
                  </div>
                </div>

                {formData.type === 'reflex' && (
                  <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4 text-sm text-cyan-900">
                    La configuration Réflexe se fait dans une interface dédiée après création du jeu.
                    Les champs seront pré-remplis automatiquement par IA.
                  </div>
                )}
              </section>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Icône *
                </h2>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => { setFormData({ ...formData, icon }); setErrors((p) => ({ ...p, icon: '' })); }}
                      className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all ${
                        formData.icon === icon ? 'border-emerald-500 bg-emerald-50 scale-105' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                {errors.icon && <p className="mt-2 text-sm text-red-600">{errors.icon}</p>}
              </section>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Visibilité
                </h2>
                <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-100 cursor-pointer transition-all bg-gray-50/30">
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    className="w-5 h-5 rounded-md border-gray-300 text-emerald-500 focus:ring-emerald-500 focus:ring-2"
                  />
                  <div>
                    <span className="font-semibold text-gray-900">Jeu actif</span>
                    <p className="text-sm text-gray-500 mt-0.5">Visible pour les joueurs une fois accepté</p>
                  </div>
                </label>
              </section>

              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:pointer-events-none"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {submitting ? 'Création...' : 'Soumettre le jeu'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => navigate('/educator/games/manage')}
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-70"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
