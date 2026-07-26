import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminData } from '@/context';
import type { Game } from '@/data/types';
import type { CreateGameRequest, TypeJeu, ModeJeu } from '@/api/types';
import adminApi from '@/api/admin';
import { InputField, SelectField, TextareaField } from '@/components/forms/FormFields';
import {
  validateRequired,
  validateInteger,
  validateMaxLength,
  runValidations,
  type ValidationResult,
} from '@/utils/formValidation';

const icons = ['🎮', '🧮', '🧠', '🎯', '⚡', '🔬', '🦁', '🌟', '🚀', '🎨'];

const FORM_TYPE_TO_TYPE_JEU: Record<Game['type'], TypeJeu> = {
  quiz: 'QUIZ',
  memory: 'MEMOIRE',
  logic: 'LOGIQUE',
  reflex: 'REFLEXE',
};

const DIFFICULTY_TO_NUMBER: Record<Game['difficulty'], number> = {
  Easy: 2,
  Medium: 5,
  Hard: 8,
};

export default function AddGame() {
  const navigate = useNavigate();
  useAdminData(); // keep context in use for future list sync if needed

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: Game['type'] | '';
    mode: ModeJeu | '';
    ageMin: number | '';
    ageMax: number | '';
    difficulty: Game['difficulty'] | '';
    estimatedTime: string;
    icon: string;
    actif: boolean;
  }>({
    title: '',
    description: '',
    type: '',
    mode: '',
    ageMin: 7,
    ageMax: 18,
    difficulty: '',
    estimatedTime: '',
    icon: '',
    actif: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationResult>({});

  const buildRequest = (): CreateGameRequest => ({
    titre: formData.title.trim(),
    description: formData.description.trim() || undefined,
    difficulte: DIFFICULTY_TO_NUMBER[formData.difficulty as Game['difficulty']],
    ageMin: Number(formData.ageMin),
    ageMax: Number(formData.ageMax),
    typeJeu: FORM_TYPE_TO_TYPE_JEU[formData.type as Game['type']],
    modeJeu: formData.mode as ModeJeu,
    dureeMinutes: parseInt(formData.estimatedTime, 10) || 15,
    icone: formData.icon || undefined,
    actif: formData.actif,
  });

  const validate = (): boolean => {
    const ageMin = formData.ageMin === '' ? NaN : Number(formData.ageMin);
    const ageMax = formData.ageMax === '' ? NaN : Number(formData.ageMax);
    const dureeStr = formData.estimatedTime?.trim() ?? '';
    const duree = parseInt(formData.estimatedTime ?? '', 10);
    const ageMinErr = formData.ageMin === '' ? 'L\'âge min est requis' : validateInteger(ageMin, 7, 18, 'Âge min entre 7 et 18');
    const ageMaxErr = formData.ageMax === '' ? 'L\'âge max est requis' : (validateInteger(ageMax, 7, 18, 'Âge max entre 7 et 18')
      ?? (ageMin > ageMax ? 'L\'âge max doit être ≥ âge min' : null));
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
      await adminApi.createGame(buildRequest());
      toast.success('Jeu créé avec succès.');
      navigate('/admin/games');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message
        || (err as Error)?.message
        || 'Erreur lors de la création du jeu.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/games')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-all"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Retour à la liste des jeux
        </button>
      </div>

      <div className="h-28 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 flex items-center p-6 mb-8 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">Ajouter un jeu</h1>
          <p className="text-white/90 text-sm mt-1">Définissez le jeu. L’éducateur pourra y associer les questions.</p>
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
              <InputField
                label="Titre du jeu"
                required
                type="text"
                value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors((p) => ({ ...p, title: '' })); }}
                onBlur={() => {
                  const msg = validateRequired(formData.title, 'Titre du jeu requis');
                  setErrors((p) => (msg ? { ...p, title: msg } : { ...p, title: '' }));
                }}
                inputClassName={inputClass}
                error={errors.title}
              />
              <TextareaField
                label="Description du jeu"
                required
                rows={4}
                className="min-h-[120px] resize-y"
                value={formData.description}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((p) => ({ ...p, description: '' })); }}
                onBlur={() => {
                  const msg = validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 2000, 'Maximum 2000 caractères');
                  setErrors((p) => (msg ? { ...p, description: msg } : { ...p, description: '' }));
                }}
                placeholder="Décrivez le jeu pour les joueurs..."
                inputClassName={inputClass}
                error={errors.description}
              />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Type & paramètres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <SelectField
                label="Type de jeu"
                required
                value={formData.type}
                onChange={(e) => { setFormData({ ...formData, type: e.target.value as Game['type'] | '' }); setErrors((p) => ({ ...p, type: '' })); }}
                inputClassName={inputClass}
                error={errors.type}
              >
                  <option value="">— Choisir —</option>
                  <option value="quiz">Quiz</option>
                  <option value="memory">Memory</option>
                  <option value="logic">Logic</option>
                  <option value="reflex">Reflex</option>
              </SelectField>
              <SelectField
                label="Mode de jeu"
                required
                value={formData.mode}
                onChange={(e) => { setFormData({ ...formData, mode: e.target.value as ModeJeu | '' }); setErrors((p) => ({ ...p, mode: '' })); }}
                inputClassName={inputClass}
                error={errors.mode}
              >
                  <option value="">— Choisir —</option>
                  <option value="INDIVIDUEL">Individuel</option>
                  <option value="EN_LIGNE">En ligne · chacun pour soi</option>
              </SelectField>
              <SelectField
                label="Difficulté"
                required
                value={formData.difficulty}
                onChange={(e) => { setFormData({ ...formData, difficulty: e.target.value as Game['difficulty'] | '' }); setErrors((p) => ({ ...p, difficulty: '' })); }}
                inputClassName={inputClass}
                error={errors.difficulty}
              >
                  <option value="">— Choisir —</option>
                  <option value="Easy">Facile</option>
                  <option value="Medium">Moyen</option>
                  <option value="Hard">Difficile</option>
              </SelectField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Âge min * (7–18)</label>
                <input
                  type="number"
                  value={formData.ageMin === '' ? '' : formData.ageMin}
                  onChange={(e) => {
                    const v = e.target.value;
                    const num = v === '' ? '' : (parseInt(v, 10) || 7);
                    setFormData({ ...formData, ageMin: num }); setErrors((p) => ({ ...p, ageMin: '', ageMax: '' }));
                  }}
                  onBlur={() => {
                    const msg = formData.ageMin === '' ? 'L\'âge min est requis' : validateInteger(Number(formData.ageMin), 7, 18, 'Âge min entre 7 et 18');
                    setErrors((p) => (msg ? { ...p, ageMin: msg } : { ...p, ageMin: '' }));
                    if (formData.ageMin !== '' && formData.ageMax !== '' && formData.ageMin > formData.ageMax) setErrors((p) => ({ ...p, ageMax: 'L\'âge max doit être ≥ âge min' }));
                  }}
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
                  onChange={(e) => {
                    const v = e.target.value;
                    const num = v === '' ? '' : (parseInt(v, 10) || 18);
                    setFormData({ ...formData, ageMax: num }); setErrors((p) => ({ ...p, ageMax: '' }));
                  }}
                  onBlur={() => {
                    const msg = formData.ageMax === '' ? 'L\'âge max est requis' : (validateInteger(Number(formData.ageMax), 7, 18, 'Âge max entre 7 et 18')
                      ?? (formData.ageMin !== '' && formData.ageMax !== '' && formData.ageMin > formData.ageMax ? 'L\'âge max doit être ≥ âge min' : null));
                    setErrors((p) => (msg ? { ...p, ageMax: msg } : { ...p, ageMax: '' }));
                  }}
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
                  onBlur={() => {
                    const empty = !formData.estimatedTime?.trim();
                    const msg = empty ? 'La durée est requise' : validateInteger(parseInt(formData.estimatedTime ?? '', 10), 1, 999, 'Durée entre 1 et 999 minutes');
                    setErrors((p) => (msg ? { ...p, estimatedTime: msg } : { ...p, estimatedTime: '' }));
                  }}
                  className={`${inputClass} ${errors.estimatedTime ? 'border-red-500' : ''}`}
                  placeholder="ex. 15"
                />
                {errors.estimatedTime && <p className="mt-1 text-sm text-red-600">{errors.estimatedTime}</p>}
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Icône *
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => { setFormData({ ...formData, icon }); setErrors((p) => ({ ...p, icon: '' })); }}
                  className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all ${
                    formData.icon === icon ? 'border-orange-500 bg-orange-50 scale-105' : 'border-gray-200 hover:border-gray-300'
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
            <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-orange-100 focus-within:border-orange-200 focus-within:ring-2 focus-within:ring-orange-500/20 cursor-pointer transition-all bg-gray-50/30">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="w-5 h-5 rounded-md border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-2"
              />
              <div>
                <span className="font-semibold text-gray-900">Jeu actif</span>
                <p className="text-sm text-gray-500 mt-0.5">Visible pour les joueurs dans la liste des jeux</p>
              </div>
            </label>
          </section>

          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {submitting ? 'Création...' : 'Créer le jeu'}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate('/admin/games')}
              disabled={submitting}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-70"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
