import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import type { GameDTO, UpdateGameRequest, TypeJeu, ModeJeu } from '@/api/types';
import {
  validateRequired,
  validateInteger,
  validateMaxLength,
  runValidations,
  type ValidationResult,
} from '@/utils/formValidation';

const ICONS = ['🎮', '🧮', '🧠', '🎯', '⚡', '🔬', '🦁', '🌟', '🚀', '🎨'];

const TYPE_ICONS: Record<string, string> = {
  QUIZ: '🧮',
  MEMOIRE: '🧠',
  REFLEXE: '⚡',
  LOGIQUE: '🎯',
};

const DIFFICULTY_NUMBER_TO_LABEL: Record<number, string> = {
  0: 'Easy',
  1: 'Easy',
  2: 'Easy',
  3: 'Easy',
  4: 'Medium',
  5: 'Medium',
  6: 'Medium',
  7: 'Hard',
  8: 'Hard',
  9: 'Hard',
  10: 'Hard',
};

export default function EditGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationResult>({});
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    typeJeu: 'QUIZ' as TypeJeu,
    modeJeu: 'INDIVIDUEL' as ModeJeu,
    difficulte: 5,
    ageMin: 7,
    ageMax: 18,
    dureeMinutes: 15,
    icone: '🎮',
    actif: true,
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getGameById(Number(id))
      .then((res) => {
        if (!cancelled && res.data) {
          const g = res.data;
          setGame(g);
          const diffNum = g.difficulte ?? 5;
          const diffLabel = DIFFICULTY_NUMBER_TO_LABEL[diffNum] ?? 'Medium';
          setFormData({
            titre: g.titre ?? '',
            description: g.description ?? '',
            typeJeu: g.typeJeu ?? 'QUIZ',
            modeJeu: g.modeJeu ?? 'INDIVIDUEL',
            difficulte: diffNum,
            ageMin: g.ageMin ?? 7,
            ageMax: g.ageMax ?? 18,
            dureeMinutes: g.dureeMinutes ?? 15,
            icone: g.icone ?? TYPE_ICONS[g.typeJeu] ?? '🎮',
            actif: g.actif ?? true,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Jeu introuvable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const buildRequest = (): UpdateGameRequest => ({
    titre: formData.titre.trim(),
    description: formData.description.trim() || undefined,
    difficulte: formData.difficulte,
    ageMin: formData.ageMin,
    ageMax: formData.ageMax,
    dureeMinutes: formData.dureeMinutes,
    icone: formData.icone || undefined,
    typeJeu: formData.typeJeu,
    modeJeu: formData.modeJeu,
    actif: formData.actif,
  });

  const validate = (): boolean => {
    const ageMaxErr = validateInteger(formData.ageMax, 7, 18, 'Âge max entre 7 et 18')
      ?? (formData.ageMin > formData.ageMax ? 'L\'âge max doit être ≥ âge min' : null);
    const rules = [
      { field: 'titre', message: validateRequired(formData.titre, 'Titre du jeu requis') },
      { field: 'description', message: validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 2000, 'La description ne doit pas dépasser 2000 caractères') },
      { field: 'difficulte', message: validateInteger(formData.difficulte, 0, 10, 'Difficulté entre 0 et 10') },
      { field: 'ageMin', message: validateInteger(formData.ageMin, 7, 18, 'Âge min entre 7 et 18') },
      { field: 'ageMax', message: ageMaxErr },
      { field: 'dureeMinutes', message: validateInteger(formData.dureeMinutes, 1, 999, 'Durée entre 1 et 999 minutes') },
      { field: 'icone', message: validateRequired(formData.icone, 'Choisissez une icône') },
    ];
    const next = runValidations(rules);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminApi.updateGame(Number(id), buildRequest());
      toast.success('Jeu mis à jour.');
      navigate('/admin/games');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || 'Erreur lors de la mise à jour.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => navigate('/admin/games')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </div>
    );
  }

  if (!game) return null;

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Barre de navigation en haut, bien visible */}
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

      {/* En-tête */}
      <div className="h-28 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 flex items-end p-6 mb-8 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">Modifier le jeu</h1>
          <p className="text-white/90 text-sm mt-0.5">{game.titre}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="p-8" noValidate>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Section Infos générales */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Infos générales
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Titre du jeu *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => { setFormData({ ...formData, titre: e.target.value }); setErrors((p) => ({ ...p, titre: '' })); }}
                  onBlur={() => {
                    const msg = validateRequired(formData.titre, 'Titre du jeu requis');
                    setErrors((p) => (msg ? { ...p, titre: msg } : { ...p, titre: '' }));
                  }}
                  className={`${inputClass} ${errors.titre ? 'border-red-500' : ''}`}
                  placeholder="ex. Quiz Math"
                />
                {errors.titre && <p className="mt-1 text-sm text-red-600">{errors.titre}</p>}
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((p) => ({ ...p, description: '' })); }}
                  onBlur={() => {
                    const msg = validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 2000, 'Maximum 2000 caractères');
                    setErrors((p) => (msg ? { ...p, description: msg } : { ...p, description: '' }));
                  }}
                  className={`${inputClass} min-h-[120px] resize-y ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Décrivez le jeu pour les joueurs..."
                  rows={4}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>
            </div>
          </section>

          {/* Section Type & paramètres */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Type & paramètres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <label className={labelClass}>Type de jeu *</label>
                <select
                  value={formData.typeJeu}
                  onChange={(e) => setFormData({ ...formData, typeJeu: e.target.value as TypeJeu })}
                  className={inputClass}
                >
                  <option value="QUIZ">Quiz</option>
                  <option value="MEMOIRE">Memory</option>
                  <option value="LOGIQUE">Logic</option>
                  <option value="REFLEXE">Reflex</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Mode de jeu *</label>
                <select
                  value={formData.modeJeu}
                  onChange={(e) => setFormData({ ...formData, modeJeu: e.target.value as ModeJeu })}
                  className={inputClass}
                >
                  <option value="INDIVIDUEL">Individuel</option>
                  <option value="EN_LIGNE">En ligne · chacun pour soi</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Difficulté (0–10) *</label>
                <input
                  type="number"
                  value={formData.difficulte}
                  onChange={(e) => { setFormData({ ...formData, difficulte: parseInt(e.target.value, 10) || 0 }); setErrors((p) => ({ ...p, difficulte: '' })); }}
                  onBlur={() => {
                    const msg = validateInteger(formData.difficulte, 0, 10, 'Difficulté entre 0 et 10');
                    setErrors((p) => (msg ? { ...p, difficulte: msg } : { ...p, difficulte: '' }));
                  }}
                  className={`${inputClass} ${errors.difficulte ? 'border-red-500' : ''}`}
                />
                {errors.difficulte && <p className="mt-1 text-sm text-red-600">{errors.difficulte}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Âge min * (7–18)</label>
                <input
                  type="number"
                  value={formData.ageMin}
                  onChange={(e) => { setFormData({ ...formData, ageMin: parseInt(e.target.value, 10) || 0 }); setErrors((p) => ({ ...p, ageMin: '', ageMax: '' })); }}
                  onBlur={() => {
                    const msg = validateInteger(formData.ageMin, 7, 18, 'Âge min entre 7 et 18');
                    setErrors((p) => (msg ? { ...p, ageMin: msg } : { ...p, ageMin: '' }));
                  }}
                  className={`${inputClass} ${errors.ageMin ? 'border-red-500' : ''}`}
                />
                {errors.ageMin && <p className="mt-1 text-sm text-red-600">{errors.ageMin}</p>}
              </div>
              <div>
                <label className={labelClass}>Âge max * (7–18)</label>
                <input
                  type="number"
                  value={formData.ageMax}
                  onChange={(e) => { setFormData({ ...formData, ageMax: parseInt(e.target.value, 10) || 0 }); setErrors((p) => ({ ...p, ageMax: '' })); }}
                  onBlur={() => {
                    const msg = validateInteger(formData.ageMax, 7, 18, 'Âge max entre 7 et 18')
                      ?? (formData.ageMin > formData.ageMax ? 'L\'âge max doit être ≥ âge min' : null);
                    setErrors((p) => (msg ? { ...p, ageMax: msg } : { ...p, ageMax: '' }));
                  }}
                  className={`${inputClass} ${errors.ageMax ? 'border-red-500' : ''}`}
                />
                {errors.ageMax && <p className="mt-1 text-sm text-red-600">{errors.ageMax}</p>}
              </div>
              <div>
                <label className={labelClass}>Durée (minutes) *</label>
                <input
                  type="number"
                  value={formData.dureeMinutes}
                  onChange={(e) => { setFormData({ ...formData, dureeMinutes: parseInt(e.target.value, 10) || 1 }); setErrors((p) => ({ ...p, dureeMinutes: '' })); }}
                  onBlur={() => {
                    const msg = validateInteger(formData.dureeMinutes, 1, 999, 'Durée entre 1 et 999 minutes');
                    setErrors((p) => (msg ? { ...p, dureeMinutes: msg } : { ...p, dureeMinutes: '' }));
                  }}
                  className={`${inputClass} ${errors.dureeMinutes ? 'border-red-500' : ''}`}
                  placeholder="ex. 15"
                />
                {errors.dureeMinutes && <p className="mt-1 text-sm text-red-600">{errors.dureeMinutes}</p>}
              </div>
            </div>
          </section>

          {/* Section Icône */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Icône du jeu *
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => { setFormData({ ...formData, icone: icon }); setErrors((p) => ({ ...p, icone: '' })); }}
                  className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all ${
                    formData.icone === icon ? 'border-orange-500 bg-orange-50 scale-105' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            {errors.icone && <p className="mt-2 text-sm text-red-600">{errors.icone}</p>}
          </section>

          {/* Section Statut */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              Visibilité
            </h2>
            <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-orange-100 focus-within:border-orange-200 focus-within:ring-2 focus-within:ring-orange-500/20 cursor-pointer transition-all bg-gray-50/30">
              <input
                type="checkbox"
                id="actif"
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

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
