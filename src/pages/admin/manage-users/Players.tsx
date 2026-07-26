import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Eye, Ban, Check, X, Loader2, UserCheck, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import type { UserDTO } from '@/data/types';
import adminApi from '@/api/admin';

export default function Players() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [roleUpdateUserId, setRoleUpdateUserId] = useState<number | null>(null);
  const navigate = useNavigate();
  const isCurrentUser = (user: UserDTO) =>
    currentUser?.email && user.email?.toLowerCase() === currentUser.email.toLowerCase();

  const ROLES_EDITABLE = ['JOUEUR', 'PARENT', 'EDUCATEUR'] as const;
  const canChangeRole = (user: UserDTO) => !isCurrentUser(user) && user.role?.toUpperCase() !== 'ADMIN';

  const handleRoleChange = (user: UserDTO, newRole: string) => {
    if (newRole === (user.role ?? '')) return;
    setRoleUpdateUserId(user.id);
    adminApi
      .updateUserRole(user.id, newRole)
      .then(() => {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Erreur lors du changement de rôle');
      })
      .finally(() => setRoleUpdateUserId(null));
  };

  const handleSuspend = (user: UserDTO) => {
    if (isCurrentUser(user)) return;
    setActionUserId(user.id);
    adminApi
      .suspendUser(user.id)
      .then(() => {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, etatCompte: 'SUSPENDU', enabled: false } : u)));
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Erreur lors de la suspension');
      })
      .finally(() => setActionUserId(null));
  };

  const handleReactivate = (user: UserDTO) => {
    setActionUserId(user.id);
    adminApi
      .reactivateUser(user.id)
      .then(() => {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, etatCompte: 'ACTIF', enabled: true } : u)));
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Erreur lors de la réactivation');
      })
      .finally(() => setActionUserId(null));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getUsers()
      .then((res) => {
        if (!cancelled) setUsers(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des utilisateurs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || String(user.niveau ?? '') === filterLevel;
    const matchesStatus = filterStatus === 'all' || user.etatCompte === filterStatus;
    const matchesRole = filterRole === 'all' || (user.role?.toUpperCase() ?? '') === filterRole;
    return matchesSearch && matchesLevel && matchesStatus && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortBy) return 0;
    if (sortBy === 'name') {
      const nameA = `${a.prenom ?? ''} ${a.nom ?? ''}`.trim().toLowerCase();
      const nameB = `${b.prenom ?? ''} ${b.nom ?? ''}`.trim().toLowerCase();
      const cmp = nameA.localeCompare(nameB);
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const dateA = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
    const dateB = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
    return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (field: 'name' | 'date') => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
    setPage(1);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-5 md:p-6 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-5 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
              <UserCheck className="w-4 h-4 text-violet-600" />
              Manage Users
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Manage Users</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterLevel}
                  onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                  <option value="6">Level 6</option>
                  <option value="7">Level 7</option>
                  <option value="8">Level 8</option>
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIF">Active</option>
                  <option value="SUSPENDU">Suspended</option>
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                >
                  <option value="all">All Roles</option>
                  <option value="JOUEUR">Joueur</option>
                  <option value="PARENT">Parent</option>
                  <option value="EDUCATEUR">Éducateur</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                        <button
                          type="button"
                          onClick={() => toggleSort('name')}
                          className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors"
                        >
                          Nom
                          {sortBy === 'name' ? (sortDir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 text-gray-400" />}
                        </button>
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Niveau</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Score total</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">État compte</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => navigate(`/admin/players/${user.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/admin/players/${user.id}`); } }}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden shrink-0 ${
                              user.role?.toUpperCase() === 'ADMIN'
                                ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'
                                : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                            }`}>
                              {user.role?.toUpperCase() === 'ADMIN' ? (
                                ((user.prenom?.trim().charAt(0) || '') + (user.nom?.trim().charAt(0) || '') || '?').toUpperCase()
                              ) : user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (user.prenom?.[0] || user.nom?.[0] || '?').toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{user.prenom} {user.nom}</p>
                              <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          {canChangeRole(user) ? (
                            <div className="relative">
                              <select
                                value={user.role ?? ''}
                                onChange={(e) => handleRoleChange(user, e.target.value)}
                                disabled={roleUpdateUserId === user.id}
                                className="block w-full min-w-[7rem] py-1.5 pl-2 pr-8 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-60"
                              >
                                {ROLES_EDITABLE.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              {roleUpdateUserId === user.id && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {user.niveau ?? '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{(user.scoreTotal ?? 0).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.etatCompte === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.etatCompte === 'ACTIF' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {user.etatCompte}
                          </span>
                        </td>
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/players/${user.id}`); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir le profil"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            {!isCurrentUser(user) && user.etatCompte === 'ACTIF' && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSuspend(user)}
                                disabled={actionUserId === user.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Suspendre"
                              >
                                {actionUserId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                              </motion.button>
                            )}
                            {!isCurrentUser(user) && user.etatCompte !== 'ACTIF' && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReactivate(user)}
                                disabled={actionUserId === user.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Réactiver"
                              >
                                {actionUserId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <p>No users found matching your filters</p>
                </div>
              )}

              {filteredUsers.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-sm text-gray-600">
                    Affichage {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedUsers.length)} sur {sortedUsers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                      title="Page précédente"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[7rem] text-center">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                      title="Page suivante"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
    </div>
  );
}
