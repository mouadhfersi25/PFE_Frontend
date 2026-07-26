import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Trophy, Target, Zap, Mail, Phone, Loader2, User, Contact, Activity, Ban, UserCheck, Link2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context';
import type { UserDTO } from '@/data/types';
import adminApi from '@/api/admin';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return dateStr;
  }
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [parentLinkLoading, setParentLinkLoading] = useState(false);
  const [parentAccounts, setParentAccounts] = useState<UserDTO[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const isCurrentUser = user && currentUser?.email && user.email?.toLowerCase() === currentUser.email.toLowerCase();
  const canSuspendOrReactivate = user && !isCurrentUser;

  const handleSuspend = () => {
    if (!user || !canSuspendOrReactivate || user.etatCompte !== 'ACTIF') return;
    setActionLoading(true);
    setError(null);
    adminApi
      .suspendUser(user.id)
      .then((res) => setUser(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Erreur lors de la suspension'))
      .finally(() => setActionLoading(false));
  };

  const handleReactivate = () => {
    if (!user || !canSuspendOrReactivate) return;
    setActionLoading(true);
    setError(null);
    adminApi
      .reactivateUser(user.id)
      .then((res) => setUser(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Erreur lors de la réactivation'))
      .finally(() => setActionLoading(false));
  };

  useEffect(() => {
    if (user?.idParent != null) setSelectedParentId(String(user.idParent));
    else setSelectedParentId('');
  }, [user?.id, user?.idParent]);

  useEffect(() => {
    if (!user || user.role?.toUpperCase() !== 'JOUEUR') {
      setParentAccounts([]);
      return;
    }
    let cancelled = false;
    adminApi
      .getUsers()
      .then((res) => {
        if (cancelled || !Array.isArray(res.data)) return;
        const parents = (res.data as UserDTO[]).filter((u) => u.role?.toUpperCase() === 'PARENT');
        setParentAccounts(parents);
      })
      .catch(() => {
        if (!cancelled) setParentAccounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const handleSaveParentLink = () => {
    if (!user || user.role?.toUpperCase() !== 'JOUEUR') return;
    const parentId = selectedParentId === '' ? null : Number(selectedParentId);
    if (parentId !== null && Number.isNaN(parentId)) {
      setError('Identifiant parent invalide');
      return;
    }
    setParentLinkLoading(true);
    setError(null);
    adminApi
      .setUserParentLink(user.id, { parentId })
      .then((res) => {
        setUser(res.data);
        setSelectedParentId(res.data.idParent != null ? String(res.data.idParent) : '');
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Erreur lors du rattachement'))
      .finally(() => setParentLinkLoading(false));
  };

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
        if (!cancelled) setUser(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Utilisateur introuvable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">{error || 'Utilisateur introuvable'}</p>
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

  const fullName = `${user.prenom} ${user.nom}`.trim();

  return (
    <div className="p-8 flex flex-col min-h-[calc(100vh-4rem)] gap-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/players')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-all"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Retour à la liste des utilisateurs
            </button>
          </div>
          <div className="mb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-medium overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.prenom?.[0] || user.nom?.[0] || '?').toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>
              {canSuspendOrReactivate && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  {user.etatCompte === 'ACTIF' ? (
                    <button
                      type="button"
                      onClick={handleSuspend}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      Suspendre
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReactivate}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      Réactiver
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700">{user.role}</span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  user.etatCompte === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.etatCompte}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Rôle / État compte</p>
              <p className="text-sm font-medium text-gray-900">{user.role} · {user.etatCompte}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <Trophy className="w-8 h-8 text-yellow-500 mb-3" />
              <p className="text-sm text-gray-600 mb-1">Niveau</p>
              <p className="text-2xl font-bold text-gray-900">{user.niveau ?? '—'}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <Target className="w-8 h-8 text-blue-500 mb-3" />
              <p className="text-sm text-gray-600 mb-1">Score total</p>
              <p className="text-2xl font-bold text-gray-900">{(user.scoreTotal ?? 0).toLocaleString()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <Zap className="w-8 h-8 text-purple-500 mb-3" />
              <p className="text-sm text-gray-600 mb-1">Points d'expérience</p>
              <p className="text-2xl font-bold text-gray-900">{user.pointsExperience ?? '—'}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            {/* Identité */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Identité</h3>
                    <p className="text-xs text-gray-500">Nom et prénom</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Prénom</p>
                  <p className="text-gray-900 font-medium">{user.prenom}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Nom</p>
                  <p className="text-gray-900 font-medium">{user.nom}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Date de naissance</p>
                  <p className="text-gray-900 font-medium">{user.dateDeNaissance ? formatDate(user.dateDeNaissance) : '—'}</p>
                </div>
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Contact className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Contact</h3>
                    <p className="text-xs text-gray-500">Email et téléphone</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                  <Mail className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-gray-900 font-medium break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                  <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Téléphone</p>
                    <p className="text-gray-900 font-medium">{user.telephone ?? '—'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Activité du compte */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Activité du compte</h3>
                    <p className="text-xs text-gray-500">Statut et dates</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Compte activé</p>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    user.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.enabled ? 'Oui' : 'Non'}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Date de création</p>
                    <p className="text-gray-900 font-medium text-sm">{formatDateTime(user.dateCreation)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                  <Zap className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Dernière connexion</p>
                    <p className="text-gray-900 font-medium text-sm">{formatDateTime(user.dateDerniereConnexion)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {user.role?.toUpperCase() === 'JOUEUR' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden"
            >
              <div className="px-5 py-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-b border-teal-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Rattachement parent</h3>
                    <p className="text-xs text-gray-500">Compte tuteur (rôle PARENT) pour l’espace parent</p>
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Parent</label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm"
                  >
                    <option value="">— Aucun parent —</option>
                    {parentAccounts.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.prenom} {p.nom} · {p.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.idParent != null && (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/players/${user.idParent}`)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 text-sm font-medium hover:bg-teal-100"
                    >
                      Fiche parent
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveParentLink}
                    disabled={parentLinkLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                  >
                    {parentLinkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Enregistrer le lien
                  </button>
                </div>
              </div>
            </motion.div>
          )}
    </div>
  );
}
