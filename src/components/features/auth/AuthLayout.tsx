import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import AuthIllustration from './AuthIllustration';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  /** 'login' | 'register' — pour surligner le lien actif dans la nav.
   * Omis pour les écrans annexes (mot de passe oublié, réinitialisation) :
   * aucun des deux onglets n'est alors mis en avant. */
  mode?: 'login' | 'register';
  /** Libellé au-dessus du formulaire ; déduit du mode si omis. */
  eyebrow?: string;
};

export default function AuthLayout({ title, subtitle, children, footer, mode, eyebrow }: Props) {
  const resolvedEyebrow = eyebrow ?? (mode === 'register' ? 'Inscription' : mode === 'login' ? 'Connexion' : undefined);

  return (
    <div className="min-h-screen flex flex-col bg-[#eef2fc] font-[family-name:var(--font-family)] text-slate-800">
      {/* --- en-tête --- */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-[1400px] mx-auto w-full">
        <Link to="/home" className="flex items-center gap-2 no-underline">
          <img src="/logo-edugame-icon.png" alt="" className="h-9 w-auto" />
          <span className="text-lg font-bold tracking-tight text-slate-900">EduGame</span>
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-sm ring-1 ring-slate-900/5">
          <Link
            to="/login"
            className={`text-sm font-semibold no-underline rounded-full px-5 py-2.5 transition-colors ${
              mode === 'login'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className={`text-sm font-semibold no-underline rounded-full px-5 py-2.5 transition-colors ${
              mode === 'register'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Inscription
          </Link>
        </div>
      </header>

      {/* --- corps : illustration + formulaire --- */}
      <main className="flex-1 grid lg:grid-cols-2 max-w-[1400px] mx-auto w-full">
        {/* panneau illustration (masqué en dessous de lg) */}
        <section className="hidden lg:flex flex-col justify-center gap-10 px-14 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-w-md"
          >
            <h1 className="text-4xl xl:text-[2.75rem] font-extrabold italic tracking-tight leading-[1.1] bg-gradient-to-r from-sky-600 to-indigo-500 bg-clip-text text-transparent text-balance">
              {title}
            </h1>
            <p className="mt-4 text-slate-500 text-[15px] leading-relaxed max-w-sm">{subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="flex justify-center"
          >
            <AuthIllustration flipped={mode === 'register'} />
          </motion.div>
        </section>

        {/* panneau formulaire */}
        <section className="flex items-center justify-center px-5 sm:px-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-[400px]"
          >
            {resolvedEyebrow && (
              <div className="mb-6">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-600">
                  {resolvedEyebrow}
                </span>
              </div>
            )}

            {children}

            <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
