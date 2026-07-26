import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Mail, User, Phone, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/user.service';
import storage from '@/utils/storage';
import type { UserDTO } from '@/data/types';
import type { UpdateProfileRequest } from '@/api/types';
import { validateRequired, validatePhone, validateMaxLength, validateMinLength, type ValidationResult } from '@/utils/formValidation';

export default function AdminEditMyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationResult>({});

  const [form, setForm] = useState<UpdateProfileRequest>({
    nom: '',
    prenom: '',
    telephone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    userService
      .getProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data as UserDTO);
          const d = data as UserDTO;
          setForm({
            nom: d.nom ?? '',
            prenom: d.prenom ?? '',
            telephone: d.telephone ?? '',
          });
          if (d.prenom != null) storage.set('auth_prenom', d.prenom);
          if (d.nom != null) storage.set('auth_nom', d.nom);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Erreur chargement profil');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const next: ValidationResult = {};
    const nomErr = validateRequired(form.nom, 'Le nom est requis')
      ?? validateMaxLength(form.nom ?? '', 100, 'Le nom ne doit pas dépasser 100 caractères');
    if (nomErr) next.nom = nomErr;
    const prenomErr = validateRequired(form.prenom, 'Le prénom est requis')
      ?? validateMaxLength(form.prenom ?? '', 100, 'Le prénom ne doit pas dépasser 100 caractères');
    if (prenomErr) next.prenom = prenomErr;
    const phoneErr = validateRequired(form.telephone, 'Le téléphone est requis')
      ?? validatePhone(form.telephone);
    if (phoneErr) next.telephone = phoneErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    userService
      .updateProfile({
        nom: form.nom || undefined,
        prenom: form.prenom || undefined,
        telephone: form.telephone || undefined,
      })
      .then((updated) => {
        setSuccess(true);
        if (updated?.prenom != null) storage.set('auth_prenom', updated.prenom);
        if (updated?.nom != null) storage.set('auth_nom', updated.nom);
        navigate('/admin/players');
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour');
      })
      .finally(() => setSaving(false));
  };

  const handlePasswordChange = async () => {
    const pwdErrors: ValidationResult = {};
    const currentErr = validateRequired(passwordForm.currentPassword, 'Le mot de passe actuel est requis');
    if (currentErr) pwdErrors.currentPassword = currentErr;
    const newErr = validateRequired(passwordForm.newPassword, 'Le nouveau mot de passe est requis')
      ?? validateMinLength(passwordForm.newPassword, 6, 'Le nouveau mot de passe doit contenir au moins 6 caractères');
    if (newErr) pwdErrors.newPassword = newErr;
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      pwdErrors.confirmPassword = 'La confirmation du mot de passe ne correspond pas';
    }
    setErrors((prev) => ({ ...prev, ...pwdErrors }));
    if (Object.keys(pwdErrors).length > 0) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-600">Profil introuvable.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Modifier mon profil</h1>
              <p className="text-sm text-slate-500 mt-0.5">Mettez à jour vos informations personnelles.</p>
            </div>
          </div>
        </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8" noValidate>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm" role="status">
                  Profil enregistré avec succès.
                </div>
              )}

              <div className="border-t border-slate-200 pt-6 space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <Mail className="w-4 h-4 text-slate-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email ?? ''}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">L’email ne peut pas être modifié.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <User className="w-4 h-4 text-slate-500" />
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={form.prenom}
                      onChange={handleChange}
                      onBlur={() => {
                        const msg = validateRequired(form.prenom, 'Le prénom est requis')
                          ?? validateMaxLength(form.prenom ?? '', 100, 'Maximum 100 caractères');
                        setErrors((p) => (msg ? { ...p, prenom: msg } : { ...p, prenom: '' }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${errors.prenom ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Prénom"
                    />
                    {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <User className="w-4 h-4 text-slate-500" />
                      Nom
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      onBlur={() => {
                        const msg = validateRequired(form.nom, 'Le nom est requis')
                          ?? validateMaxLength(form.nom ?? '', 100, 'Maximum 100 caractères');
                        setErrors((p) => (msg ? { ...p, nom: msg } : { ...p, nom: '' }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${errors.nom ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Nom"
                    />
                    {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <Phone className="w-4 h-4 text-slate-500" />
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    name="telephone"
                    value={form.telephone}
                    onChange={handleChange}
                    onBlur={() => {
                      const msg = validateRequired(form.telephone, 'Le téléphone est requis') ?? validatePhone(form.telephone);
                      setErrors((p) => (msg ? { ...p, telephone: msg } : { ...p, telephone: '' }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${errors.telephone ? 'border-red-500' : 'border-slate-200'}`}
                    placeholder="8 chiffres"
                  />
                  {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  Changer le mot de passe
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="password"
                      placeholder="Mot de passe actuel"
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }));
                        setErrors((prev) => ({ ...prev, currentPassword: '' }));
                        setError(null);
                        setSuccess(false);
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${errors.currentPassword ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Nouveau mot de passe"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                        setErrors((prev) => ({ ...prev, newPassword: '' }));
                        setError(null);
                        setSuccess(false);
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${errors.newPassword ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        setError(null);
                        setSuccess(false);
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors font-medium text-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Mettre à jour le mot de passe
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200">
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium text-sm shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/players')}
                    className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/players')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-sm ml-auto sm:ml-0"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  Retour à la liste
                </button>
              </div>
            </form>
          </motion.div>
    </div>
  );
}
