import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2, Sparkles, Upload } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import educatorApi from '@/api/educator/educator.api';
import type { TypeJeu, ModeJeu, QuizPlayMode, QuizVariant } from '@/api/types';
import QuizVariantPicker from '@/components/educator/QuizVariantPicker';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import { InputField, SelectField, TextareaField } from '@/components/forms/FormFields';
import {
  validateRequired,
  validateInteger,
  validateMaxLength,
  runValidations,
  type ValidationResult,
} from '@/utils/formValidation';
import { dataUrlToImageFile } from '@/utils/dataUrlToImageFile';

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

const FORM_TYPE_TO_TYPE_JEU_LITERAL = {
  quiz: 'QUIZ',
  memory: 'MEMOIRE',
  logic: 'LOGIQUE',
  reflex: 'REFLEXE',
} as const;

const normalizeFormType = (value: string): string => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'memoire' || normalized === 'memory') return 'memory';
  if (normalized === 'quiz') return 'quiz';
  if (normalized === 'logique' || normalized === 'logic') return 'logic';
  if (normalized === 'reflexe' || normalized === 'reflex') return 'reflex';
  return '';
};

const getPostCreateConfigurationPath = (typeJeu: TypeJeu, gameId: number): string => {
  if (typeJeu === 'QUIZ') return `/educator/games/quiz/${gameId}/questions`;
  if (typeJeu === 'MEMOIRE') return `/educator/games/memory/${gameId}/configure`;
  if (typeJeu === 'LOGIQUE') return `/educator/games/logic/${gameId}/configure`;
  return `/educator/games/reflex/${gameId}/configure`;
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
    coverImageUrl: string;
    generateAiCover: boolean;
    actif: boolean;
    quizPlayMode: QuizPlayMode;
    quizVariant: QuizVariant;
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
    coverImageUrl: '',
    generateAiCover: true,
    actif: false,
    quizPlayMode: 'CLASSIC',
    quizVariant: 'DEFAULT',
  });

  const activePlaceholders = {
    title: '',
    description: '',
  };

  const [submitting, setSubmitting] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [previewCoverSrc, setPreviewCoverSrc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationResult>({});

  useEffect(() => {
    const url = formData.coverImageUrl?.trim();
    if (!url) {
      setPreviewCoverSrc('');
      return;
    }
    if (url.startsWith('data:image/')) {
      setPreviewCoverSrc(url);
      return;
    }
    if (url.startsWith('https://image.pollinations.ai/')) {
      // For Add page, no game id exists yet: fallback direct rendering.
      setPreviewCoverSrc(url);
      return;
    }
    setPreviewCoverSrc(url);
  }, [formData.coverImageUrl]);

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
      const coverTrim = formData.coverImageUrl.trim();
      const isDataUrlCover = coverTrim.startsWith('data:image/');

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
        // Ne pas envoyer une data URL en JSON (très lourd) : création légère puis upload multipart.
        coverImageUrl: isDataUrlCover ? undefined : coverTrim || undefined,
        actif: formData.actif,
        quizPlayMode: formData.type === 'quiz' ? formData.quizPlayMode : 'CLASSIC',
        quizVariant: formData.type === 'quiz' ? formData.quizVariant : 'DEFAULT',
      });

      const gameId = created?.data?.id;

      if (gameId && isDataUrlCover && coverTrim) {
        try {
          const file = await dataUrlToImageFile(coverTrim);
          if (file) {
            await educatorApi.uploadGameCover(gameId, file);
          } else {
            toast.warning('Jeu créé ; la cover n’a pas pu être envoyée. Réessayez depuis la fiche du jeu.');
          }
        } catch {
          toast.warning('Jeu créé ; échec de l’envoi de la cover. Réessayez depuis la fiche du jeu.');
        }
      }

      // Génération post-création seulement s’il n’y a aucune cover (sinon doublon IA + attente inutile).
      if (formData.generateAiCover && gameId && !coverTrim) {
        try {
          await educatorApi.generateGameCover(gameId);
        } catch {
          toast.warning("Jeu créé, mais la génération automatique de cover a échoué.");
        }
      }

      const createdId = created?.data?.id;
      const createdType = FORM_TYPE_TO_TYPE_JEU[formData.type];
      toast.success('Jeu créé avec succès ! Passez à la configuration du contenu.');
      if (createdId && createdType) {
        const nextPath = getPostCreateConfigurationPath(createdType, createdId);
        navigate(nextPath);
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

  const handleGenerateCoverPreview = async () => {
    const mappedType = FORM_TYPE_TO_TYPE_JEU_LITERAL[formData.type as keyof typeof FORM_TYPE_TO_TYPE_JEU_LITERAL];
    if (!mappedType) {
      toast.error('Choisissez un type de jeu avant génération');
      return;
    }
    setGeneratingCover(true);
    try {
      const res = await educatorApi.generateGameCoverPreview({
        titre: formData.title,
        description: formData.description,
        typeJeu: mappedType,
        ageMin: typeof formData.ageMin === 'number' ? formData.ageMin : undefined,
        ageMax: typeof formData.ageMax === 'number' ? formData.ageMax : undefined,
        difficulte: DIFFICULTY_TO_NUMBER[formData.difficulty] ?? 5,
      });
      setFormData((prev) => ({ ...prev, coverImageUrl: res.data?.coverImageUrl ?? '' }));
      toast.success('Preview cover généré');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || 'Erreur génération cover';
      toast.error(message);
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleLocalUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const out = typeof reader.result === 'string' ? reader.result : '';
      setFormData((prev) => ({ ...prev, coverImageUrl: out }));
    };
    reader.readAsDataURL(file);
  };

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
                  <InputField
                    label="Titre du jeu"
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors((p) => ({ ...p, title: '' })); }}
                    inputClassName={inputClass}
                    placeholder={activePlaceholders.title}
                    error={errors.title}
                  />
                  <TextareaField
                    label="Description du jeu"
                    required
                    value={formData.description}
                    onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((p) => ({ ...p, description: '' })); }}
                    className="min-h-[120px] resize-y"
                    inputClassName={inputClass}
                    placeholder={activePlaceholders.description}
                    rows={4}
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
                    onChange={(e) => { setFormData({ ...formData, type: e.target.value }); setErrors((p) => ({ ...p, type: '' })); }}
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
                  {formData.type === 'quiz' && (
                    <SelectField
                      label="Mode de partie"
                      value={formData.quizPlayMode}
                      onChange={(e) => setFormData({ ...formData, quizPlayMode: e.target.value as QuizPlayMode })}
                      inputClassName={inputClass}
                    >
                      <option value="CLASSIC">Classique</option>
                      <option value="BLITZ_60S">Blitz 60 secondes</option>
                    </SelectField>
                  )}
                  <SelectField
                    label="Difficulté"
                    required
                    value={formData.difficulty}
                    onChange={(e) => { setFormData({ ...formData, difficulty: e.target.value }); setErrors((p) => ({ ...p, difficulty: '' })); }}
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

                {formData.type === 'quiz' && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <QuizVariantPicker
                      value={formData.quizVariant}
                      onChange={(quizVariant) => setFormData((prev) => ({ ...prev, quizVariant }))}
                      disabled={submitting}
                    />
                  </div>
                )}

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
                  Cover image
                </h2>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateCoverPreview}
                      disabled={generatingCover}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-60"
                    >
                      {generatingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Générer IA
                    </button>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold cursor-pointer hover:bg-emerald-100">
                      <Upload className="w-4 h-4" />
                      Upload manuel
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLocalUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                    className={inputClass}
                    placeholder="URL ou data URL après génération / upload"
                  />
                  {formData.coverImageUrl && (
                    <img
                      src={previewCoverSrc || formData.coverImageUrl}
                      alt="Aperçu cover"
                      className="w-full max-w-md h-44 object-cover rounded-xl border border-gray-200"
                      onError={() => setPreviewCoverSrc(formData.coverImageUrl)}
                    />
                  )}
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-violet-100 bg-violet-50/40">
                    <input
                      type="checkbox"
                      checked={formData.generateAiCover}
                      onChange={(e) => setFormData({ ...formData, generateAiCover: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-violet-900">
                      Générer automatiquement une cover IA après création
                    </span>
                  </label>
                </div>
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
