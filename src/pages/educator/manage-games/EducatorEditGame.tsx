import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import educatorApi from '@/api/educator/educator.api';
import type { GameDTO, TypeJeu, ModeJeu } from '@/api/types';
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

const TYPE_ICONS: Record<string, string> = {
  QUIZ: '🧮',
  MEMOIRE: '🧠',
  REFLEXE: '⚡',
  LOGIQUE: '🎯',
};

const getContentEditPath = (game: Pick<GameDTO, 'id' | 'typeJeu'>): string | null => {
  if (game.typeJeu === 'QUIZ') return `/educator/games/quiz/${game.id}/questions`;
  if (game.typeJeu === 'MEMOIRE') return `/educator/games/memory/${game.id}/configure`;
  if (game.typeJeu === 'REFLEXE') return `/educator/games/reflex/${game.id}/configure`;
  return null;
};

const DIFFICULTY_NUMBER_TO_LABEL: Record<number, string> = {
  0: 'Easy', 1: 'Easy', 2: 'Easy', 3: 'Easy',
  4: 'Medium', 5: 'Medium', 6: 'Medium',
  7: 'Hard', 8: 'Hard', 9: 'Hard', 10: 'Hard',
};

export default function EducatorEditGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'infos' | 'contenu'>('infos');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationResult>({});
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [quizCount, setQuizCount] = useState(0);
  const [memoryPairCount, setMemoryPairCount] = useState(0);
  const [reflexRounds, setReflexRounds] = useState(0);
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
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    educatorApi.getGameById(Number(id))
      .then((res) => {
        if (!cancelled && res.data) {
          const g = res.data;
          setGame(g);
          setFormData({
            titre: g.titre ?? '',
            description: g.description ?? '',
            typeJeu: g.typeJeu ?? 'QUIZ',
            modeJeu: g.modeJeu ?? 'INDIVIDUEL',
            difficulte: g.difficulte ?? 5,
            ageMin: g.ageMin ?? 7,
            ageMax: g.ageMax ?? 18,
            dureeMinutes: g.dureeMinutes ?? 15,
            icone: g.icone ?? TYPE_ICONS[g.typeJeu] ?? '🎮',
            actif: g.actif ?? true,
          });
        }
      })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Jeu introuvable'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!game || loading) return;
    if (game.etat === 'EN_ATTENTE' || game.etat === 'ACCEPTE') {
      toast.info('Ce jeu est finalisé : vous ne pouvez plus modifier ses informations.');
      navigate('/educator/games/manage', { replace: true });
    }
  }, [game, loading, navigate]);

  useEffect(() => {
    if (!game || activeTab !== 'contenu') return;
    let cancelled = false;
    setContentLoading(true);
    setContentError(null);

    const load = async () => {
      try {
        if (game.typeJeu === 'QUIZ') {
          const res = await educatorApi.getQuestions(game.id);
          if (!cancelled) setQuizCount(Array.isArray(res.data) ? res.data.length : 0);
        } else if (game.typeJeu === 'MEMOIRE') {
          const res = await educatorApi.getMemoryCards(game.id);
          if (!cancelled) {
            const cards = Array.isArray(res.data) ? res.data : [];
            const keys = new Set(cards.map((c) => c.pairKey).filter(Boolean));
            setMemoryPairCount(keys.size > 0 ? keys.size : Math.floor(cards.length / 2));
          }
        } else if (game.typeJeu === 'REFLEXE') {
          const res = await educatorApi.getReflexSettings(game.id);
          if (!cancelled) {
            setReflexRounds(res.data?.nombreRounds ?? 0);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            || (err as Error)?.message
            || 'Impossible de charger le contenu.';
          setContentError(msg);
        }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [game, activeTab]);

  const validate = (): boolean => {
    const ageMaxErr = validateInteger(formData.ageMax, 7, 18, 'Âge max entre 7 et 18')
      ?? (formData.ageMin > formData.ageMax ? "L'âge max doit être ≥ âge min" : null);
    const rules = [
      { field: 'titre', message: validateRequired(formData.titre, 'Titre du jeu requis') },
      { field: 'description', message: validateRequired(formData.description, 'La description est requise') ?? validateMaxLength(formData.description ?? '', 2000, 'Maximum 2000 caractères') },
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
      await educatorApi.updateGame(Number(id), {
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
      toast.success('Jeu mis à jour.');
      navigate('/educator/games/manage');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message || 'Erreur lors de la mise à jour.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
        <EducatorHeader />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    </div>
  );

  if (error && !game) return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
        <EducatorHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">{error}</p>
        <button onClick={() => navigate('/educator/games/manage')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
          <ArrowLeft className="w-4 h-4" />Retour à la liste
        </button>
      </div>
    </div>
  );

  if (!game) return null;

  if (game.etat === 'EN_ATTENTE' || game.etat === 'ACCEPTE') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-600 text-sm">Ce jeu est finalisé. Redirection…</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";
  const contentEditPath = getContentEditPath(game);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />
      <div className="flex-1 overflow-auto pt-16">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/educator/games/manage')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Retour à la liste des jeux
              </button>
            </div>
          </div>

          <div className="h-28 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-end p-6 mb-8 shadow-lg">
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
            <div className="px-8 pt-6">
              <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('infos')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'infos' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Infos du jeu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contenu')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'contenu' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Contenu du jeu
                </button>
              </div>
            </div>

            {activeTab === 'infos' ? (
            <form onSubmit={handleSubmit} className="p-8" noValidate>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Infos générales</h2>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Titre du jeu *</label>
                    <input type="text" value={formData.titre}
                      onChange={(e) => { setFormData({ ...formData, titre: e.target.value }); setErrors((p) => ({ ...p, titre: '' })); }}
                      className={`${inputClass} ${errors.titre ? 'border-red-500' : ''}`} placeholder="ex. Quiz Math" />
                    {errors.titre && <p className="mt-1 text-sm text-red-600">{errors.titre}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea value={formData.description}
                      onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setErrors((p) => ({ ...p, description: '' })); }}
                      className={`${inputClass} min-h-[120px] resize-y ${errors.description ? 'border-red-500' : ''}`}
                      placeholder="Décrivez le jeu pour les joueurs..." rows={4} />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Type & paramètres</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className={labelClass}>Type de jeu *</label>
                    <select value={formData.typeJeu} onChange={(e) => setFormData({ ...formData, typeJeu: e.target.value as TypeJeu })} className={inputClass}>
                      <option value="QUIZ">Quiz</option>
                      <option value="MEMOIRE">Memory</option>
                      <option value="LOGIQUE">Logic</option>
                      <option value="REFLEXE">Reflex</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Mode de jeu *</label>
                    <select value={formData.modeJeu} onChange={(e) => setFormData({ ...formData, modeJeu: e.target.value as ModeJeu })} className={inputClass}>
                      <option value="INDIVIDUEL">Individuel</option>
                      <option value="COLLECTIF">Collectif</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Difficulté (0–10) *</label>
                    <input type="number" value={formData.difficulte}
                      onChange={(e) => { setFormData({ ...formData, difficulte: parseInt(e.target.value, 10) || 0 }); setErrors((p) => ({ ...p, difficulte: '' })); }}
                      className={`${inputClass} ${errors.difficulte ? 'border-red-500' : ''}`} />
                    {errors.difficulte && <p className="mt-1 text-sm text-red-600">{errors.difficulte}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Âge min * (7–18)</label>
                    <input type="number" value={formData.ageMin}
                      onChange={(e) => { setFormData({ ...formData, ageMin: parseInt(e.target.value, 10) || 0 }); setErrors((p) => ({ ...p, ageMin: '', ageMax: '' })); }}
                      className={`${inputClass} ${errors.ageMin ? 'border-red-500' : ''}`} />
                    {errors.ageMin && <p className="mt-1 text-sm text-red-600">{errors.ageMin}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Âge max * (7–18)</label>
                    <input type="number" value={formData.ageMax}
                      onChange={(e) => { setFormData({ ...formData, ageMax: parseInt(e.target.value, 10) || 0 }); setErrors((p) => ({ ...p, ageMax: '' })); }}
                      className={`${inputClass} ${errors.ageMax ? 'border-red-500' : ''}`} />
                    {errors.ageMax && <p className="mt-1 text-sm text-red-600">{errors.ageMax}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Durée (minutes) *</label>
                    <input type="number" value={formData.dureeMinutes}
                      onChange={(e) => { setFormData({ ...formData, dureeMinutes: parseInt(e.target.value, 10) || 1 }); setErrors((p) => ({ ...p, dureeMinutes: '' })); }}
                      className={`${inputClass} ${errors.dureeMinutes ? 'border-red-500' : ''}`} placeholder="ex. 15" />
                    {errors.dureeMinutes && <p className="mt-1 text-sm text-red-600">{errors.dureeMinutes}</p>}
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Icône du jeu *</h2>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {ICONS.map((icon) => (
                    <button key={icon} type="button"
                      onClick={() => { setFormData({ ...formData, icone: icon }); setErrors((p) => ({ ...p, icone: '' })); }}
                      className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all ${formData.icone === icon ? 'border-emerald-500 bg-emerald-50 scale-105' : 'border-gray-200 hover:border-gray-300'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
                {errors.icone && <p className="mt-2 text-sm text-red-600">{errors.icone}</p>}
              </section>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Visibilité</h2>
                <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-100 cursor-pointer transition-all bg-gray-50/30">
                  <input type="checkbox" id="actif" checked={formData.actif} onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    className="w-5 h-5 rounded-md border-gray-300 text-emerald-500 focus:ring-emerald-500 focus:ring-2" />
                  <div>
                    <span className="font-semibold text-gray-900">Jeu actif</span>
                    <p className="text-sm text-gray-500 mt-0.5">Visible pour les joueurs une fois accepté</p>
                  </div>
                </label>
              </section>

              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-100">
                <motion.button whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }}
                  type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:pointer-events-none">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </motion.button>
                <button type="button" onClick={() => navigate('/educator/games/manage')} disabled={submitting}
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-70">
                  Annuler
                </button>
              </div>
            </form>
            ) : (
              <div className="p-8">
                <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <h2 className="text-lg font-bold text-emerald-900 mb-1">Contenu du jeu</h2>
                  <p className="text-sm text-emerald-800">
                    Gérez le contenu pédagogique lié à ce jeu depuis cet onglet.
                  </p>
                </div>

                {contentLoading && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement du contenu...
                  </div>
                )}

                {!contentLoading && contentError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    {contentError}
                  </div>
                )}

                {!contentLoading && !contentError && (
                  <div className="space-y-4">
                    {game.typeJeu === 'QUIZ' && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quiz</p>
                            <p className="text-gray-900 font-semibold">{quizCount} question{quizCount > 1 ? 's' : ''} configurée{quizCount > 1 ? 's' : ''}</p>
                          </div>
                          {contentEditPath && (
                            <button
                              type="button"
                              onClick={() => navigate(contentEditPath)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100"
                            >
                              <FileText className="w-4 h-4" />
                              Ouvrir l'éditeur des questions
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {game.typeJeu === 'MEMOIRE' && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Mémoire</p>
                            <p className="text-gray-900 font-semibold">{memoryPairCount} paire{memoryPairCount > 1 ? 's' : ''} configurée{memoryPairCount > 1 ? 's' : ''}</p>
                          </div>
                          {contentEditPath && (
                            <button
                              type="button"
                              onClick={() => navigate(contentEditPath)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100"
                            >
                              <FileText className="w-4 h-4" />
                              Ouvrir l'éditeur des paires
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {game.typeJeu === 'REFLEXE' && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Réflexe</p>
                            <p className="text-gray-900 font-semibold">{reflexRounds} round{reflexRounds > 1 ? 's' : ''} configuré{reflexRounds > 1 ? 's' : ''}</p>
                          </div>
                          {contentEditPath && (
                            <button
                              type="button"
                              onClick={() => navigate(contentEditPath)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100"
                            >
                              <FileText className="w-4 h-4" />
                              Ouvrir la configuration Réflexe
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {game.typeJeu === 'LOGIQUE' && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
                        L'édition intégrée du contenu n'est pas encore disponible pour ce type de jeu.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
