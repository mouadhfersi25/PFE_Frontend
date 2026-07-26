import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import type { CreateBadgeRequest, TypeConditionBadge } from '@/api/types/api.types';
import { BADGE_CONDITION_OPTIONS } from '@/api/types/api.types';
import {
  validateRequired,
  validateMaxLength,
  validateNonNegativeNumber,
  runValidations,
  type ValidationResult,
} from '@/utils/formValidation';

const badgeIcons = ['🏆', '🎮', '🎯', '🔥', '⚡', '📚', '🧠', '🧩', '💯', '⭐', '🌟', '🎖️'];
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-colors';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2';

export default function AddBadge() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationResult>({});
  const [formData, setFormData] = useState<{
    nom: string;
    description: string;
    typeCondition: TypeConditionBadge | '';
    scoreCondition: string | number;
    icone: string;
  }>({
    nom: '',
    description: '',
    typeCondition: '',
    scoreCondition: '',
    icone: '',
  });

  const selectedCondition = formData.typeCondition ? BADGE_CONDITION_OPTIONS.find((c) => c.value === formData.typeCondition) : null;
  const needsValue = selectedCondition ? selectedCondition.needsValue : false;

  const validate = (): boolean => {
    const rules = [
      { field: 'nom', message: validateRequired(formData.nom, 'Nom du badge requis') ?? validateMaxLength(formData.nom, 150, 'Maximum 150 caractères') },
      { field: 'description', message: validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 255, 'Maximum 255 caractères') },
      { field: 'typeCondition', message: validateRequired(formData.typeCondition, 'Choisissez une condition de déblocage') },
      { field: 'icone', message: validateRequired(formData.icone, 'Choisissez une icône') },
    ];
    if (needsValue) {
      const scoreEmpty = formData.scoreCondition === '' || formData.scoreCondition === undefined;
      const scoreErr = scoreEmpty ? 'La valeur est requise' : validateNonNegativeNumber(formData.scoreCondition, 'La valeur doit être ≥ 0');
      if (scoreErr) rules.push({ field: 'scoreCondition', message: scoreErr });
    }
    const next = runValidations(rules);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: CreateBadgeRequest = {
      nom: formData.nom.trim(),
      description: formData.description.trim() || undefined,
      typeCondition: formData.typeCondition as TypeConditionBadge,
      icone: formData.icone || undefined,
    };
    if (needsValue) {
      const score = formData.scoreCondition === '' ? undefined : Number(formData.scoreCondition);
      if (score != null && !Number.isNaN(score)) payload.scoreCondition = score;
    }

    setLoading(true);
    adminApi
      .createBadge(payload)
      .then(() => {
        toast.success('Badge créé');
        navigate('/admin/badges');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || 'Erreur lors de la création');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="sticky top-0 z-10 pt-4 pb-6 px-6 bg-slate-100/80">
        <div className="max-w-5xl mx-auto space-y-4">
          <button
            onClick={() => navigate('/admin/badges')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-medium text-sm shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux badges
          </button>
          <div
            className="w-full rounded-2xl shadow-md p-6 sm:p-8 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ajouter un badge
            </h1>
            <p className="text-white/90 text-base sm:text-lg mt-1 font-medium">
              Créez un nouveau badge de réussite.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5" noValidate>
              <div>
                <label className={labelClass}>Nom du badge <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); setErrors((prev) => ({ ...prev, nom: '' })); }}
                  onBlur={() => {
                    const msg = validateRequired(formData.nom, 'Nom du badge requis') ?? validateMaxLength(formData.nom, 150, 'Maximum 150 caractères');
                    setErrors((prev) => (msg ? { ...prev, nom: msg } : { ...prev, nom: '' }));
                  }}
                  className={`${inputClass} ${errors.nom ? 'border-red-500' : ''}`}
                  placeholder="ex. Premier succès"
                />
                {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
              </div>

              <div>
                <label className={labelClass}>Description <span className="text-rose-500">*</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((prev) => ({ ...prev, description: '' })); }}
                  onBlur={() => {
                    const msg = validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 255, 'Maximum 255 caractères');
                    setErrors((prev) => (msg ? { ...prev, description: msg } : { ...prev, description: '' }));
                  }}
                  className={`${inputClass} min-h-[100px] resize-y ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Décrivez le badge..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Save className="w-4 h-4 text-violet-500" />
                  Condition de déblocage
                </h3>
                <div>
                <label className={labelClass}>Condition de déblocage <span className="text-rose-500">*</span></label>
                <select
                  value={formData.typeCondition}
                  onChange={(e) => {
                    setFormData({ ...formData, typeCondition: e.target.value as TypeConditionBadge | '', scoreCondition: '' });
                    setErrors((prev) => ({ ...prev, typeCondition: '' }));
                  }}
                  className={`${inputClass} ${errors.typeCondition ? 'border-red-500' : ''}`}
                >
                  <option value="">— Choisir une condition —</option>
                  {BADGE_CONDITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.typeCondition && <p className="mt-1 text-sm text-red-600">{errors.typeCondition}</p>}
              </div>
              </div>

              {needsValue && (
                <div>
                  <label className={labelClass}>
                    Valeur {formData.typeCondition === 'SCORE_MIN' ? '(score min.)' : formData.typeCondition === 'GAMES_PLAYED' ? '(nombre de parties)' : '(nombre)'}
                  </label>
                  <input
                    type="number"
                    value={formData.scoreCondition}
                    onChange={(e) => {
                      setFormData({ ...formData, scoreCondition: e.target.value === '' ? '' : e.target.value });
                      setErrors((prev) => ({ ...prev, scoreCondition: '' }));
                    }}
                    onBlur={() => {
                      const empty = formData.scoreCondition === '' || formData.scoreCondition === undefined;
                      const msg = empty ? 'La valeur est requise' : validateNonNegativeNumber(formData.scoreCondition, 'La valeur doit être ≥ 0');
                      setErrors((prev) => (msg ? { ...prev, scoreCondition: msg } : { ...prev, scoreCondition: '' }));
                    }}
                    className={`${inputClass} ${errors.scoreCondition ? 'border-red-500' : ''}`}
                    placeholder={formData.typeCondition === 'SCORE_MIN' ? 'ex. 100' : 'ex. 5'}
                  />
                  {errors.scoreCondition && <p className="mt-1 text-sm text-red-600">{errors.scoreCondition}</p>}
                </div>
              )}

              <div>
                <label className={`${labelClass} mb-3`}>Icône <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {badgeIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => { setFormData({ ...formData, icone: icon }); setErrors((prev) => ({ ...prev, icone: '' })); }}
                      className={`w-12 h-12 flex items-center justify-center text-2xl rounded-lg border-2 transition-all ${
                        formData.icone === icon ? 'border-violet-500 bg-violet-50 scale-110' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                {errors.icone && <p className="mt-2 text-sm text-red-600">{errors.icone}</p>}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-shadow font-medium disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Créer le badge
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate('/admin/badges')}
                  disabled={loading}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
                >
                  Annuler
                </motion.button>
              </div>
            </form>
          </motion.div>
      </div>
    </div>
  );
}
