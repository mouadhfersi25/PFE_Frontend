import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2, Award } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import type { BadgeDTO, UpdateBadgeRequest, TypeConditionBadge } from '@/api/types/api.types';
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

export default function EditBadge() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [badge, setBadge] = useState<BadgeDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationResult>({});
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    typeCondition: 'SCORE_MIN' as TypeConditionBadge,
    scoreCondition: '' as string | number,
    icone: '🏆',
  });

  const selectedCondition = BADGE_CONDITION_OPTIONS.find((c) => c.value === formData.typeCondition);
  const needsValue = selectedCondition?.needsValue ?? true;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    adminApi
      .getBadgeById(id)
      .then((res) => {
        if (!cancelled) {
          const b = res.data as BadgeDTO;
          setBadge(b);
          const type = (b.typeCondition || 'SCORE_MIN').toUpperCase() as TypeConditionBadge;
          setFormData({
            nom: b.nom ?? '',
            description: b.description ?? '',
            typeCondition: type,
            scoreCondition: b.scoreCondition ?? '',
            icone: b.icone ?? '🏆',
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setFetchError(err.response?.data?.message || err.message || 'Badge introuvable');
      });
    return () => { cancelled = true; };
  }, [id]);

  const validate = (): boolean => {
    const rules = [
      { field: 'nom', message: validateRequired(formData.nom, 'Nom du badge requis') ?? validateMaxLength(formData.nom, 150, 'Maximum 150 caractères') },
      { field: 'description', message: validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 255, 'Maximum 255 caractères') },
      { field: 'typeCondition', message: validateRequired(formData.typeCondition, 'Condition de déblocage requise') },
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
    if (!id || !badge) return;
    if (!validate()) return;
    const payload: UpdateBadgeRequest = {
      nom: formData.nom.trim(),
      description: formData.description.trim() || undefined,
      typeCondition: formData.typeCondition,
      icone: formData.icone || undefined,
    };
    if (needsValue) {
      const score = formData.scoreCondition === '' ? undefined : Number(formData.scoreCondition);
      if (score != null && !Number.isNaN(score)) payload.scoreCondition = score;
    }

    setLoading(true);
    adminApi
      .updateBadge(id, payload)
      .then(() => {
        toast.success('Badge mis à jour');
        navigate('/admin/badges');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour');
      })
      .finally(() => setLoading(false));
  };

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-violet-50/20 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
          <p className="text-slate-600 mb-6">{fetchError}</p>
          <button
            onClick={() => navigate('/admin/badges')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux badges
          </button>
        </div>
      </div>
    );
  }

  if (!badge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-violet-50/20 flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <p className="text-slate-500 text-sm">Chargement du badge…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80">
      {/* Header */}
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
              Modifier le badge
            </h1>
            <p className="text-white/90 text-base sm:text-lg mt-1 font-medium">
              {badge.nom}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5" noValidate>
            {/* Nom */}
            <div>
              <label htmlFor="edit-nom" className={labelClass}>
                Nom du badge <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-nom"
                type="text"
                value={formData.nom}
                onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); setErrors((p) => ({ ...p, nom: '' })); }}
                onBlur={() => {
                  const msg = validateRequired(formData.nom, 'Nom du badge requis') ?? validateMaxLength(formData.nom, 150, 'Maximum 150 caractères');
                  setErrors((p) => (msg ? { ...p, nom: msg } : { ...p, nom: '' }));
                }}
                className={`${inputClass} ${errors.nom ? 'border-red-500' : ''}`}
                placeholder="ex. Maître du Quiz"
              />
              {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-desc" className={labelClass}>
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="edit-desc"
                value={formData.description}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((p) => ({ ...p, description: '' })); }}
                onBlur={() => {
                  const msg = validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 255, 'Maximum 255 caractères');
                  setErrors((p) => (msg ? { ...p, description: msg } : { ...p, description: '' }));
                }}
                className={`${inputClass} min-h-[100px] resize-y ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Décrivez le badge..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Condition */}
            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-500" />
                Condition de déblocage
              </h3>
              <div>
                <label htmlFor="edit-condition" className={labelClass}>
                  Type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="edit-condition"
                  value={formData.typeCondition}
                  onChange={(e) => {
                    setFormData({ ...formData, typeCondition: e.target.value as TypeConditionBadge, scoreCondition: '' });
                    setErrors((p) => ({ ...p, typeCondition: '' }));
                  }}
                  className={`${inputClass} ${errors.typeCondition ? 'border-red-500' : ''}`}
                >
                  {BADGE_CONDITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.typeCondition && <p className="mt-1 text-sm text-red-600">{errors.typeCondition}</p>}
              </div>
              {needsValue && (
                <div>
                  <label htmlFor="edit-value" className={labelClass}>
                    Valeur{' '}
                    {formData.typeCondition === 'SCORE_MIN'
                      ? '(score minimum)'
                      : formData.typeCondition === 'GAMES_PLAYED'
                        ? '(nombre de parties)'
                        : '(nombre)'}
                  </label>
                  <input
                    id="edit-value"
                    type="number"
                    value={formData.scoreCondition}
                    onChange={(e) => {
                      setFormData({ ...formData, scoreCondition: e.target.value === '' ? '' : e.target.value });
                      setErrors((p) => ({ ...p, scoreCondition: '' }));
                    }}
                    onBlur={() => {
                      const empty = formData.scoreCondition === '' || formData.scoreCondition === undefined;
                      const msg = empty ? 'La valeur est requise' : validateNonNegativeNumber(formData.scoreCondition, 'La valeur doit être ≥ 0');
                      setErrors((p) => (msg ? { ...p, scoreCondition: msg } : { ...p, scoreCondition: '' }));
                    }}
                    className={`${inputClass} ${errors.scoreCondition ? 'border-red-500' : ''}`}
                    placeholder={formData.typeCondition === 'SCORE_MIN' ? 'ex. 100' : 'ex. 5'}
                  />
                  {errors.scoreCondition && <p className="mt-1 text-sm text-red-600">{errors.scoreCondition}</p>}
                </div>
              )}
            </div>

            {/* Icône */}
            <div>
              <label className={`${labelClass} mb-3`}>
                Icône <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {badgeIcons.map((icon) => (
                  <motion.button
                    key={icon}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setFormData({ ...formData, icone: icon }); setErrors((p) => ({ ...p, icone: '' })); }}
                    className={`w-14 h-14 flex items-center justify-center text-2xl rounded-xl border-2 transition-all ${
                      formData.icone === icon
                        ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-cyan-50 shadow-md ring-2 ring-violet-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {icon}
                  </motion.button>
                ))}
              </div>
              {errors.icone && <p className="mt-2 text-sm text-red-600">{errors.icone}</p>}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-5 border-t border-slate-100 mt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Enregistrer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/admin/badges')}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-60"
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
