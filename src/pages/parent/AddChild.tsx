import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Loader2, Mail, MailCheck } from 'lucide-react';
import userApi from '@/api/user/user.api';
import { useParentChildren } from '@/context';

/** yyyy-mm-dd du jour même moins `years` années, pour borner le sélecteur de date de naissance. */
function isoDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export default function AddChild() {
  const navigate = useNavigate();
  const { refetchChildren, setSelectedChildId } = useParentChildren();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    dateDeNaissance: '',
    telephone: '',
    genre: '' as '' | 'HOMME' | 'FEMME',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.password || !form.dateDeNaissance) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }
    if (!form.genre) {
      toast.error('Choisissez le genre du joueur');
      return;
    }
    const birthDate = new Date(form.dateDeNaissance);
    const today = new Date();
    const rawAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const age = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? rawAge - 1 : rawAge;
    if (age < 7 || age > 18) {
      toast.error("L'âge du joueur doit être compris entre 7 et 18 ans");
      return;
    }
    setSaving(true);
    try {
      const payload: {
        nom: string;
        prenom: string;
        email: string;
        password: string;
        dateDeNaissance: string;
        telephone?: string;
        genre: 'HOMME' | 'FEMME';
      } = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dateDeNaissance: form.dateDeNaissance,
        genre: form.genre,
      };
      const phone = form.telephone.trim();
      if (phone && /^[0-9]{8}$/.test(phone)) payload.telephone = phone;

      const res = await userApi.createLinkedChild(payload);
      toast.success(`Compte de ${res.data.prenom} créé — ses identifiants lui ont été envoyés par e-mail`, {
        icon: <MailCheck className="h-4 w-4" />,
      });
      await refetchChildren();
      setSelectedChildId(res.data.id);
      navigate('/parent/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Impossible d’ajouter le joueur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50/60 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-blue-100/80 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/parent/dashboard')}
            className="rounded-xl border border-blue-100 bg-white shadow-sm p-2 text-slate-700"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Ajouter un joueur</h1>
            <p className="text-sm text-slate-400">Créez un compte enfant lié à votre espace parent</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm"
        >
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-sky-400" aria-hidden />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
              <p className="text-sm text-slate-600">
                Une fois le compte créé, un e-mail sera envoyé automatiquement à l’adresse du joueur avec son
                identifiant et le mot de passe que vous avez choisi, pour qu’il puisse se connecter directement.
              </p>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="child-nom" className="mb-1 block text-xs font-semibold text-slate-500">Nom *</label>
                  <input
                    id="child-nom"
                    required
                    placeholder="Nom"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="child-prenom" className="mb-1 block text-xs font-semibold text-slate-500">Prénom *</label>
                  <input
                    id="child-prenom"
                    required
                    placeholder="Prénom"
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="child-email" className="mb-1 block text-xs font-semibold text-slate-500">E-mail du joueur *</label>
                <input
                  id="child-email"
                  required
                  type="email"
                  placeholder="prenom@exemple.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white"
                />
                <p className="mt-1 text-xs text-slate-400">C’est à cette adresse que les identifiants seront envoyés.</p>
              </div>

              <div>
                <label htmlFor="child-password" className="mb-1 block text-xs font-semibold text-slate-500">Mot de passe *</label>
                <input
                  id="child-password"
                  required
                  type="password"
                  placeholder="Mot de passe (min. 6 caractères)"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="child-dateDeNaissance" className="mb-1 block text-xs font-semibold text-slate-500">Date de naissance *</label>
                  <input
                    id="child-dateDeNaissance"
                    required
                    type="date"
                    min={isoDateYearsAgo(18)}
                    max={isoDateYearsAgo(7)}
                    value={form.dateDeNaissance}
                    onChange={(e) => setForm((f) => ({ ...f, dateDeNaissance: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white"
                  />
                  <p className="mt-1 text-xs text-slate-400">Âge autorisé : 7 à 18 ans</p>
                </div>
                <div>
                  <label htmlFor="child-telephone" className="mb-1 block text-xs font-semibold text-slate-500">Téléphone (optionnel)</label>
                  <input
                    id="child-telephone"
                    placeholder="8 chiffres"
                    value={form.telephone}
                    onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Genre *</label>
                <div className="flex gap-4">
                  {(['HOMME', 'FEMME'] as const).map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="genre"
                        value={option}
                        checked={form.genre === option}
                        onChange={() => setForm((f) => ({ ...f, genre: option }))}
                      />
                      {option === 'HOMME' ? 'Homme' : 'Femme'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/parent/dashboard')}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Créer le compte joueur
                </button>
              </div>
            </form>
          </div>
        </motion.article>
      </main>
    </div>
  );
}
