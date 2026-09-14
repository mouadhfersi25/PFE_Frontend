import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserPlus, Loader2, GraduationCap, Handshake, MailCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import adminApi from '@/api/admin';
import {
  validateRequired,
  validateMinLength,
  validatePhone,
  runValidations,
  type ValidationResult,
} from '@/utils/formValidation';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-colors';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2';

type StaffRole = 'EDUCATEUR' | 'SPONSOR';

const ROLE_OPTIONS: Array<{
  value: StaffRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}> = [
  {
    value: 'EDUCATEUR',
    label: 'Éducateur',
    description: 'Crée et gère des jeux, questions et contenus pédagogiques',
    icon: GraduationCap,
  },
  {
    value: 'SPONSOR',
    label: 'Sponsor',
    description: 'Publie des publicités et récompenses pour les joueurs',
    icon: Handshake,
  },
];

export default function CreateStaffUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationResult>({});
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    dateDeNaissance: '',
    role: 'EDUCATEUR' as StaffRole,
    telephone: '',
    genre: '' as '' | 'HOMME' | 'FEMME',
  });

  const validate = (): boolean => {
    const rules = [
      { field: 'nom', message: validateRequired(formData.nom, 'Le nom est requis') },
      { field: 'prenom', message: validateRequired(formData.prenom, 'Le prénom est requis') },
      { field: 'email', message: validateRequired(formData.email, "L'e-mail est requis") },
      {
        field: 'password',
        message:
          validateRequired(formData.password, 'Le mot de passe est requis') ??
          validateMinLength(formData.password, 6, 'Minimum 6 caractères'),
      },
      { field: 'dateDeNaissance', message: validateRequired(formData.dateDeNaissance, 'La date de naissance est requise') },
      {
        field: 'telephone',
        message: validateRequired(formData.telephone, 'Le téléphone est requis') ?? validatePhone(formData.telephone),
      },
      { field: 'genre', message: validateRequired(formData.genre, 'Le genre est requis') },
    ];
    const next = runValidations(rules);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: {
      nom: string;
      prenom: string;
      email: string;
      password: string;
      dateDeNaissance: string;
      role: StaffRole;
      telephone: string;
      genre: 'HOMME' | 'FEMME';
    } = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      dateDeNaissance: formData.dateDeNaissance,
      role: formData.role,
      telephone: formData.telephone.trim(),
      genre: formData.genre as 'HOMME' | 'FEMME',
    };

    setLoading(true);
    adminApi
      .createStaffUser(payload)
      .then(() => {
        const roleLabel = formData.role === 'EDUCATEUR' ? 'Éducateur' : 'Sponsor';
        toast.success(`Compte ${roleLabel} créé — ses identifiants lui ont été envoyés par e-mail`, {
          icon: <MailCheck className="h-4 w-4" />,
        });
        navigate('/admin/players');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || 'Création impossible');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="sticky top-0 z-10 pt-4 pb-6 px-6 bg-slate-100/80">
        <div className="max-w-5xl mx-auto space-y-4">
          <button
            onClick={() => navigate('/admin/players')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-medium text-sm shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux utilisateurs
          </button>
          <div
            className="w-full rounded-2xl shadow-md p-6 sm:p-8 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Créer un compte éducateur ou sponsor
            </h1>
            <p className="text-white/90 text-base sm:text-lg mt-1 font-medium">
              Un e-mail sera envoyé automatiquement avec l’e-mail et le mot de passe définis ici, pour une connexion immédiate.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5" noValidate>
            <div>
              <label className={`${labelClass} mb-3`}>Rôle du compte <span className="text-rose-500">*</span></label>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map((opt) => {
                  const isActive = formData.role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, role: opt.value }))}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        isActive
                          ? 'border-violet-500 bg-violet-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isActive ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <opt.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold ${isActive ? 'text-violet-700' : 'text-slate-800'}`}>{opt.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="staff-nom" className={labelClass}>Nom <span className="text-rose-500">*</span></label>
                <input
                  id="staff-nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); setErrors((prev) => ({ ...prev, nom: '' })); }}
                  onBlur={() => setErrors((prev) => ({ ...prev, nom: validateRequired(formData.nom, 'Le nom est requis') ?? '' }))}
                  className={`${inputClass} ${errors.nom ? 'border-red-500' : ''}`}
                  placeholder="Nom"
                />
                {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
              </div>
              <div>
                <label htmlFor="staff-prenom" className={labelClass}>Prénom <span className="text-rose-500">*</span></label>
                <input
                  id="staff-prenom"
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => { setFormData({ ...formData, prenom: e.target.value }); setErrors((prev) => ({ ...prev, prenom: '' })); }}
                  onBlur={() => setErrors((prev) => ({ ...prev, prenom: validateRequired(formData.prenom, 'Le prénom est requis') ?? '' }))}
                  className={`${inputClass} ${errors.prenom ? 'border-red-500' : ''}`}
                  placeholder="Prénom"
                />
                {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="staff-email" className={labelClass}>E-mail <span className="text-rose-500">*</span></label>
              <input
                id="staff-email"
                type="email"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors((prev) => ({ ...prev, email: '' })); }}
                onBlur={() => setErrors((prev) => ({ ...prev, email: validateRequired(formData.email, "L'e-mail est requis") ?? '' }))}
                className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                placeholder="prenom.nom@exemple.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="staff-password" className={labelClass}>Mot de passe <span className="text-rose-500">*</span></label>
              <input
                id="staff-password"
                type="password"
                value={formData.password}
                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors((prev) => ({ ...prev, password: '' })); }}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    password: validateRequired(formData.password, 'Le mot de passe est requis') ?? validateMinLength(formData.password, 6, 'Minimum 6 caractères') ?? '',
                  }))
                }
                className={`${inputClass} ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Minimum 6 caractères"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="staff-dateDeNaissance" className={labelClass}>Date de naissance <span className="text-rose-500">*</span></label>
                <input
                  id="staff-dateDeNaissance"
                  type="date"
                  value={formData.dateDeNaissance}
                  onChange={(e) => { setFormData({ ...formData, dateDeNaissance: e.target.value }); setErrors((prev) => ({ ...prev, dateDeNaissance: '' })); }}
                  onBlur={() => setErrors((prev) => ({ ...prev, dateDeNaissance: validateRequired(formData.dateDeNaissance, 'La date de naissance est requise') ?? '' }))}
                  className={`${inputClass} ${errors.dateDeNaissance ? 'border-red-500' : ''}`}
                />
                {errors.dateDeNaissance && <p className="mt-1 text-sm text-red-600">{errors.dateDeNaissance}</p>}
              </div>
              <div>
                <label htmlFor="staff-telephone" className={labelClass}>Téléphone <span className="text-rose-500">*</span></label>
                <input
                  id="staff-telephone"
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => { setFormData({ ...formData, telephone: e.target.value }); setErrors((prev) => ({ ...prev, telephone: '' })); }}
                  onBlur={() => setErrors((prev) => ({ ...prev, telephone: validateRequired(formData.telephone, 'Le téléphone est requis') ?? validatePhone(formData.telephone) ?? '' }))}
                  className={`${inputClass} ${errors.telephone ? 'border-red-500' : ''}`}
                  placeholder="8 chiffres"
                />
                {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
              </div>
            </div>

            <div>
              <label className={labelClass}>Genre <span className="text-rose-500">*</span></label>
              <div className="flex gap-6">
                {(['HOMME', 'FEMME'] as const).map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="genre"
                      value={option}
                      checked={formData.genre === option}
                      onChange={() => { setFormData({ ...formData, genre: option }); setErrors((prev) => ({ ...prev, genre: '' })); }}
                    />
                    {option === 'HOMME' ? 'Homme' : 'Femme'}
                  </label>
                ))}
              </div>
              {errors.genre && <p className="mt-1 text-sm text-red-600">{errors.genre}</p>}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-shadow font-medium disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Créer le compte
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/admin/players')}
                disabled={loading}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
              >
                Annuler
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
