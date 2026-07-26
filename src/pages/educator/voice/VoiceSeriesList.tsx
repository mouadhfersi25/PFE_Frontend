import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Loader2, Mic, Send, Archive } from 'lucide-react';
import { toast } from 'sonner';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import educatorVoiceApi from '@/api/educator/educatorVoice.api';
import type { VoiceSeriesDTO } from '@/api/types/voice.types';
import { VOICE_SERIES_STATE_LABELS } from '@/constants/voiceExerciseTypes';

const STATE_STYLES: Record<string, string> = {
  BROUILLON: 'bg-slate-100 text-slate-700',
  PUBLIE: 'bg-emerald-100 text-emerald-700',
  ARCHIVE: 'bg-amber-100 text-amber-700',
};

export default function VoiceSeriesList() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<VoiceSeriesDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    educatorVoiceApi.getSeries()
      .then((res) => setSeries(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Impossible de charger les séries orales'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette série ? Les sessions et tentatives liées seront aussi supprimées.')) return;
    setActionId(id);
    try {
      await educatorVoiceApi.deleteSeries(id);
      toast.success('Série supprimée');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Suppression impossible');
    } finally {
      setActionId(null);
    }
  };

  const handlePublish = async (id: number) => {
    setActionId(id);
    try {
      await educatorVoiceApi.publishSeries(id);
      toast.success('Série publiée');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Publication impossible');
    } finally {
      setActionId(null);
    }
  };

  const handleArchive = async (id: number) => {
    setActionId(id);
    try {
      await educatorVoiceApi.archiveSeries(id);
      toast.success('Série archivée');
      load();
    } catch {
      toast.error('Archivage impossible');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <EducatorHeader title="Atelier oral" subtitle="Créez des séries de lecture et d’évaluation vocale" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Mic className="w-7 h-7 text-emerald-600" />
                Séries orales
              </h1>
              <p className="text-gray-600 mt-1">Module indépendant des jeux — les joueurs s’entraînent à l’oral.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/educator/voice/series/add')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
            >
              <Plus className="w-4 h-4" />
              Nouvelle série
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : series.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-gray-600 mb-4">Aucune série orale pour le moment.</p>
              <button
                type="button"
                onClick={() => navigate('/educator/voice/series/add')}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
              >
                Créer ma première série
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {series.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="font-bold text-gray-900">{item.titre}</h2>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description || 'Sans description'}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATE_STYLES[item.etat] || STATE_STYLES.BROUILLON}`}>
                      {VOICE_SERIES_STATE_LABELS[item.etat] || item.etat}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {item.promptsCount ?? 0} consigne(s) · {item.langue?.toUpperCase() || 'FR'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/educator/voice/series/${item.id}/edit`)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Éditer
                    </button>
                    {item.etat === 'BROUILLON' && (
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => void handlePublish(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Publier
                      </button>
                    )}
                    {item.etat === 'PUBLIE' && (
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => void handleArchive(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
                      >
                        <Archive className="w-4 h-4" />
                        Archiver
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionId === item.id}
                      onClick={() => void handleDelete(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-medium hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
