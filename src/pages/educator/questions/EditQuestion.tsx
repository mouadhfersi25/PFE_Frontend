import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { QuizQuestionDTO, GameDTO, UpdateQuizQuestionRequest } from '@/api/types/api.types';
import QuestionMediaField from '@/components/educator/QuestionMediaField';
import {
  getQuizVariantMeta,
  isCloze,
  isTrueFalse,
  requiresAudio,
  requiresMedia,
} from '@/constants/quizVariants';
import { QuizVariantBadge } from '@/components/educator/QuizVariantPicker';

const OPTIONS_COUNT = 4; { value: number; label: string }[] = [
  { value: 1, label: 'Facile' },
  { value: 2, label: 'Moyen' },
  { value: 3, label: 'Difficile' },
];

export default function EditQuestion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questionId = id ? Number(id) : null;

  const [question, setQuestion] = useState<QuizQuestionDTO | null>(null);
  const [linkedGame, setLinkedGame] = useState<GameDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [promptAudioFile, setPromptAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState('');

  const [formData, setFormData] = useState<{
    contenu: string;
    options: string[];
    correctAnswerIndex: number;
    explication: string;
    difficulte: number | '';
  }>({
    contenu: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explication: '',
    difficulte: '',
  });

  const gameVariant = linkedGame?.quizVariant ?? 'DEFAULT';

  const handleMediaFile = (file: File | null) => {
    setMediaFile(file);
    setMediaPreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      if (file) return URL.createObjectURL(file);
      return question?.mediaUrl ?? '';
    });
  };

  const handleAudioFile = (file: File | null) => {
    setPromptAudioFile(file);
    setAudioPreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      if (file) return URL.createObjectURL(file);
      return question?.promptAudioUrl ?? '';
    });
  };

  useEffect(() => {
    if (questionId == null || Number.isNaN(questionId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    educatorApi
      .getQuestionById(questionId)
      .then(async (res) => {
        if (cancelled) return;
        const q = res.data as QuizQuestionDTO;
        let linkedGameData: GameDTO | null = null;
        try {
          const gRes = await educatorApi.getGameById(q.jeuId);
          linkedGameData = gRes.data ?? null;
          if (linkedGameData) setLinkedGame(linkedGameData);
          if (linkedGameData && linkedGameData.etat !== 'BROUILLON' && linkedGameData.etat !== 'REFUSE') {
            toast.info('Ce jeu est en attente ou déjà accepté : modification impossible.');
            navigate('/educator/games/manage', { replace: true });
            return;
          }
        } catch {
          toast.error('Impossible de vérifier le jeu.');
          navigate('/educator/games/manage', { replace: true });
          return;
        }
        setQuestion(q);
        const variant = linkedGameData?.quizVariant ?? q.sousType ?? 'DEFAULT';
        const isTf = variant === 'TRUE_FALSE';
        const isCz = variant === 'CLOZE';
        const raw = q.options && q.options.length > 0 ? [...q.options] : [];
        const opts: string[] = isTf
          ? ['Vrai', 'Faux', '', '']
          : (() => {
              const padded: string[] = [];
              for (let i = 0; i < OPTIONS_COUNT; i++) padded.push(raw[i] ?? '');
              return padded;
            })();
        const correctIndex = isTf
          ? (q.bonneReponse?.trim().toLowerCase() === 'faux' ? 1 : 0)
          : isCz
            ? Math.max(0, opts.findIndex((o) => o.trim() && o.trim().toLowerCase() === (q.bonneReponse ?? '').trim().toLowerCase()))
            : (q.bonneReponse
                ? Math.max(0, opts.findIndex((o) => o === q.bonneReponse))
                : 0);
        setFormData({
          contenu: q.contenu ?? '',
          options: opts,
          correctAnswerIndex: correctIndex < 0 ? 0 : correctIndex,
          explication: q.explication ?? '',
          difficulte: q.difficulte ?? '',
        });
        setMediaPreview(q.mediaUrl ?? '');
        setAudioPreview(q.promptAudioUrl ?? '');
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Question introuvable.');
          setQuestion(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [questionId]);

  const setOptionText = (index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionId == null || !question) return;
    const contenu = formData.contenu.trim();
    if (!contenu) {
      toast.error("L'énoncé est obligatoire.");
      return;
    }
    if (isCloze(gameVariant) && !contenu.includes('___')) {
      toast.error('La phrase doit contenir ___ pour le mot à compléter.');
      return;
    }

    if (requiresMedia(gameVariant) && !mediaFile && !mediaPreview) {
      toast.error("L'image est obligatoire pour la variante Image -> Mot.");
      return;
    }
    if (requiresAudio(gameVariant) && !promptAudioFile && !audioPreview) {
      toast.error("L'audio est obligatoire pour la variante Ecoute couleur (audio).");
      return;
    }

    const optionsFiltered = isTrueFalse(gameVariant)
      ? ['Vrai', 'Faux']
      : formData.options.map((o) => o.trim()).filter(Boolean);
    if (isCloze(gameVariant)) {
      if (optionsFiltered.length < 3 || optionsFiltered.length > 6) {
        toast.error('Ajoutez entre 3 et 6 mots proposés.');
        return;
      }
    } else if (!isTrueFalse(gameVariant) && optionsFiltered.length !== OPTIONS_COUNT) {
      toast.error(`Veuillez remplir les ${OPTIONS_COUNT} options.`);
      return;
    }
    const bonneReponse = isTrueFalse(gameVariant)
      ? (formData.correctAnswerIndex === 1 ? 'Faux' : 'Vrai')
      : optionsFiltered[formData.correctAnswerIndex];
    if (!bonneReponse) {
      toast.error('Sélectionnez la bonne réponse.');
      return;
    }
    const payload: UpdateQuizQuestionRequest = {
      contenu,
      bonneReponse,
      options: optionsFiltered,
    };
    if (formData.explication.trim()) payload.explication = formData.explication.trim();
    if (formData.difficulte !== '') payload.difficulte = formData.difficulte as number;

    setSubmitting(true);
    educatorApi
      .updateQuestion(questionId, payload)
      .then(async () => {
        if (mediaFile) {
          await educatorApi.uploadQuestionMedia(questionId, mediaFile);
        }
        if (promptAudioFile) {
          await educatorApi.uploadQuestionPromptAudio(questionId, promptAudioFile);
        }
        toast.success('Question mise à jour.');
        navigate(`/educator/games/quiz/${question.jeuId}/questions`);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour.');
      })
      .finally(() => setSubmitting(false));
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center gap-4">
          <p className="text-gray-600">Question introuvable.</p>
          <button
            onClick={() => navigate('/educator/games/manage')}
            className="text-green-600 hover:underline font-medium"
          >
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
        <div className="p-8">
          <div className="mb-6">
            <button
              onClick={() => navigate(`/educator/games/quiz/${question.jeuId}/questions`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au quiz
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Modifier la question</h1>
            <p className="text-sm text-gray-500 mt-1">
              Jeu : {question.jeuTitre}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 max-w-3xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isTrueFalse(gameVariant)
                    ? 'Affirmation'
                    : isCloze(gameVariant)
                      ? 'Phrase à compléter'
                      : 'Contenu (énoncé)'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  className={`${inputClass} min-h-[100px]`}
                  placeholder={
                    isTrueFalse(gameVariant)
                      ? 'Ex. : La Terre tourne autour du Soleil.'
                      : isCloze(gameVariant)
                        ? 'Ex. : Le chat ___ sur le tapis.'
                        : 'Énoncé de la question...'
                  }
                  required
                />
              </div>

              <div className={`rounded-xl border-2 p-4 ${getQuizVariantMeta(gameVariant).accent}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xl">{getQuizVariantMeta(gameVariant).icon}</span>
                  <span className="font-semibold text-gray-900">Variante du quiz</span>
                  <QuizVariantBadge variant={gameVariant} />
                </div>
                <p className="text-sm text-gray-700">{getQuizVariantMeta(gameVariant).description}</p>
                <p className="text-xs text-gray-500 mt-2 italic">{getQuizVariantMeta(gameVariant).example}</p>
              </div>

              {requiresMedia(gameVariant) && (
                <QuestionMediaField
                  kind="image"
                  label="Image de la question"
                  required
                  previewUrl={mediaPreview}
                  fileName={mediaFile?.name}
                  onFileSelect={handleMediaFile}
                  disabled={submitting}
                />
              )}

              {requiresAudio(gameVariant) && (
                <QuestionMediaField
                  kind="audio"
                  label="Audio (écoute couleur)"
                  required={!audioPreview}
                  previewUrl={audioPreview}
                  fileName={promptAudioFile?.name}
                  onFileSelect={handleAudioFile}
                  disabled={submitting}
                />
              )}

              {isTrueFalse(gameVariant) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Bonne réponse <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['Vrai', 'Faux'] as const).map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFormData({ ...formData, correctAnswerIndex: index })}
                        className={`px-6 py-5 rounded-xl border-2 text-lg font-bold transition-all ${
                          formData.correctAnswerIndex === index
                            ? label === 'Vrai'
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-red-500 bg-red-50 text-red-800'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : isCloze(gameVariant) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mots proposés (3 à 6) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={formData.correctAnswerIndex === index && option.trim() !== ''}
                          onChange={() => setFormData({ ...formData, correctAnswerIndex: index })}
                          className="w-4 h-4 text-green-600 shrink-0"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => setOptionText(index, e.target.value)}
                          className={`${inputClass} flex-1`}
                          placeholder={`Mot ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Options de réponse (4 obligatoires) <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswerIndex === index}
                        onChange={() => setFormData({ ...formData, correctAnswerIndex: index })}
                        className="w-4 h-4 text-green-600 shrink-0"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => setOptionText(index, e.target.value)}
                        className={`${inputClass} flex-1`}
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sélectionnez la bonne réponse en cliquant sur le bouton radio.
                </p>
              </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explication (optionnel)
                </label>
                <textarea
                  value={formData.explication}
                  onChange={(e) => setFormData({ ...formData, explication: e.target.value })}
                  className={`${inputClass} min-h-[80px]`}
                  placeholder="Explication affichée après la réponse..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulté (optionnel)
                </label>
                <select
                  value={formData.difficulte === '' ? '' : formData.difficulte}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulte: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className={inputClass}
                >
                  <option value="">—</option>
                  {DIFFICULTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-shadow font-medium disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les modifications
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate(`/educator/games/quiz/${question.jeuId}/questions`)}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-60"
                >
                  Annuler
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
