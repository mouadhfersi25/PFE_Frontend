import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Mail, User, Phone, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorHeader from '@/components/educator/EducatorHeader';
import { userService } from '@/services/user.service';
import storage from '@/utils/storage';
import type { UserDTO, UpdateProfileRequest } from '@/api/types';
import { validateRequired, validatePhone, validateMaxLength, validateMinLength, type ValidationResult } from '@/utils/formValidation';

export default function EducatorManageProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
        if (cancelled) return;
        const d = data as UserDTO;
        setProfile(d);
        setForm({
          nom: d.nom ?? '',
          prenom: d.prenom ?? '',
          telephone: d.telephone ?? '',
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Erreur chargement profil');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateProfile = (): boolean => {
    const next: ValidationResult = {};
    const prenomErr = validateRequired(form.prenom, 'Le prénom est requis')
      ?? validateMaxLength(form.prenom ?? '', 100, 'Maximum 100 caractères');
    if (prenomErr) next.prenom = prenomErr;

    const nomErr = validateRequired(form.nom, 'Le nom est requis')
      ?? validateMaxLength(form.nom ?? '', 100, 'Maximum 100 caractères');
    if (nomErr) next.nom = nomErr;

    const telephoneErr = validateRequired(form.telephone, 'Le téléphone est requis')
      ?? validatePhone(form.telephone, 'Le téléphone doit contenir 8 chiffres');
    if (telephoneErr) next.telephone = telephoneErr;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await userService.updateProfile({
        nom: form.nom || undefined,
        prenom: form.prenom || undefined,
        telephone: form.telephone || undefined,
      });
      if (updated?.prenom != null) storage.set('auth_prenom', updated.prenom as string);
      if (updated?.nom != null) storage.set('auth_nom', updated.nom as string);
      setSuccess('Profil mis à jour avec succès.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const pwdErrors: ValidationResult = {};
    const currentErr = validateRequired(passwordForm.currentPassword, 'Mot de passe actuel requis');
    if (currentErr) pwdErrors.currentPassword = currentErr;
    const newErr = validateRequired(passwordForm.newPassword, 'Nouveau mot de passe requis')
      ?? validateMinLength(passwordForm.newPassword, 6, 'Minimum 6 caractères');
    if (newErr) pwdErrors.newPassword = newErr;
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      pwdErrors.confirmPassword = 'La confirmation ne correspond pas au nouveau mot de passe';
    }
    setErrors((prev) => ({ ...prev, ...pwdErrors }));
    if (Object.keys(pwdErrors).length > 0) return;

    setSaving(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Mot de passe modifié avec succès.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors du changement du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EducatorSidebar />
      <EducatorHeader />

      <div className="flex-1 overflow-auto">
        <div className="p-5 md:p-8 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full" style={{ paddingTop: '110px' }}>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
              <User className="w-4 h-4 text-emerald-600" />
              Mon profil
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Gérer profil</h1>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : !profile ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-slate-600">Profil introuvable.</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <motion.form
                onSubmit={handleSaveProfile}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
              >
                {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                {success && <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1.5">
                      <User className="w-4 h-4 text-slate-500" />
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={form.prenom ?? ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.prenom ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1.5">
                      <User className="w-4 h-4 text-slate-500" />
                      Nom
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={form.nom ?? ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.nom ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1.5">
                    <Mail className="w-4 h-4 text-slate-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email ?? ''}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1.5">
                    <Phone className="w-4 h-4 text-slate-500" />
                    Téléphone
                  </label>
                  <input
                    type="text"
                    name="telephone"
                    value={form.telephone ?? ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.telephone ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors text-sm font-medium"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => navigate('/educator/dashboard')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour dashboard
                  </button>
                </div>
              </motion.form>

              <div className="space-y-6">
                <motion.form onSubmit={handleChangePassword} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    Changer mot de passe
                  </p>
                  <input
                    type="password"
                    placeholder="Mot de passe actuel"
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }));
                      setErrors((prev) => ({ ...prev, currentPassword: '' }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.currentPassword ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.currentPassword && <p className="text-sm text-red-600 -mt-2">{errors.currentPassword}</p>}
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                      setErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.newPassword ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.newPassword && <p className="text-sm text-red-600 -mt-2">{errors.newPassword}</p>}
                  <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }));
                      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-600 -mt-2">{errors.confirmPassword}</p>}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors text-sm font-medium"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Mettre à jour le mot de passe
                  </button>
                </motion.form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
