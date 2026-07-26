import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorApi from '@/api/educator/educator.api';
import type { QuizQuestionDTO } from '@/api/types/api.types';

function difficultyLabel(d: number | null): string {
  return d === 1 ? 'Easy' : d === 2 ? 'Medium' : d === 3 ? 'Hard' : 'Medium';
}

export default function ViewQuestion() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const questionId = id ? Number(id) : NaN;

  const [question, setQuestion] = useState<QuizQuestionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(questionId)) {
      setError('Invalid question id');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    educatorApi
      .getQuestionById(questionId)
      .then((res) => {
        if (cancelled) return;
        setQuestion(res.data as QuizQuestionDTO);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load question.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const options = useMemo(() => (Array.isArray(question?.options) ? question!.options! : []), [question]);
  const correctIndex = useMemo(() => {
    if (!question) return -1;
    if (!Array.isArray(question.options) || !question.bonneReponse) return -1;
    return question.options.findIndex((o) => o === question.bonneReponse);
  }, [question]);

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

  if (error || !question) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <EducatorSidebar />
        <EducatorHeader />
        <div className="flex-1 flex items-center justify-center gap-4">
          <p className="text-gray-600">{error ?? 'Question introuvable.'}</p>
          <button onClick={() => navigate('/educator/games/manage')} className="text-green-600 hover:underline font-medium">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const backToGames = () => {
    navigate('/educator/games/manage');
  };

  const diff = difficultyLabel(question.difficulte);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />
      <div className="flex-1 overflow-auto pt-16">
        <div className="p-6 md:p-8 max-w-4xl">
          <button
            onClick={backToGames}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 mb-5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Détails de la question</h1>
            <p className="text-sm text-gray-500 mt-1">
              Jeu : <span className="font-medium text-gray-800">{question.jeuTitre}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  diff === 'Easy' ? 'bg-green-100 text-green-800' : diff === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {diff}
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Énoncé</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{question.contenu}</p>
            </div>

            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Options</h2>
              {options.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune option.</p>
              ) : (
                <div className="space-y-2">
                  {options.map((opt, idx) => {
                    const isCorrect = idx === correctIndex;
                    return (
                      <div
                        key={`${opt}-${idx}`}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${
                          isCorrect ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50/40'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800">{opt}</p>
                        </div>
                        {isCorrect ? <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">Correcte</span> : null}
                      </div>
                    );
                  })}
                </div>
              )}
              {correctIndex < 0 && question.bonneReponse ? (
                <p className="text-sm text-gray-500 mt-3">
                  Bonne réponse : <span className="font-medium text-gray-700">{question.bonneReponse}</span>
                </p>
              ) : null}
            </div>

            <div className="mb-0">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Explication</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {question.explication?.trim() ? question.explication : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

