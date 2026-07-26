import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import { useAuth } from '@/context';
import type { UserDTO } from '@/data/types';

const ROLES_EDITABLE = ['JOUEUR', 'PARENT', 'EDUCATEUR'] as const;

export default function EditPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('');

  const currentEmail = currentUser?.email ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_email') : null) ?? '';
  const isSelf = user?.email && currentEmail && user.email.toLowerCase() === currentEmail.toLowerCase();
  const isAdminTarget = user?.role?.toUpperCase() === 'ADMIN';
  const canChangeRole = user && !isSelf && !isAdminTarget;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getUserById(Number(id))
      .then((res) => {
        if (!cancelled) {
          setUser(res.data);
          setRole(res.data?.role ?? 'JOUEUR');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Utilisateur introuvable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canChangeRole || !user) return;
    setSaving(true);
    setError(null);
    adminApi
      .updateUserRole(Number(id), role)
      .then(() => {
        toast.success('Rôle mis à jour.');
        navigate(`/admin/players/${id}`);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du rôle');
      })
      .finally(() => setSaving(false));
  };

  const handleCancel = () => navigate(`/admin/players/${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-8">
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/admin/players')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la fiche utilisateur
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Modifier le rôle</h1>
        <p className="text-gray-600 mt-1">
          {user.prenom} {user.nom} · {user.email}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 max-w-xl"
      >
        {!canChangeRole ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-4">
            {isSelf && <p>Vous ne pouvez pas modifier votre propre rôle.</p>}
            {isAdminTarget && !isSelf && <p>Le rôle ADMIN ne peut pas être modifié.</p>}
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 px-4 py-2 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Retour
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {ROLES_EDITABLE.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Seuls les rôles JOUEUR, PARENT et EDUCATEUR peuvent être attribués.</p>
            </div>
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-shadow font-medium disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </motion.button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
