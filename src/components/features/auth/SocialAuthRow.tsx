import { toast } from 'sonner';

/**
 * Rangée "ou continuer avec". La connexion sociale n'est pas encore câblée
 * côté backend : au clic, on informe l'utilisateur plutôt que de laisser le
 * bouton ne rien faire silencieusement.
 */
export default function SocialAuthRow() {
  const notAvailable = (provider: string) => () =>
    toast.info(`Connexion ${provider} bientôt disponible`);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 my-1">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">ou continuer avec</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={notAvailable('Google')}
          aria-label="Continuer avec Google"
          className="flex w-full items-center justify-center h-12 rounded-2xl bg-[#eef2f7] hover:bg-slate-200 transition-colors"
        >
          <svg width="19" height="19" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9C16.66 14.2 17.64 11.9 17.64 9.2z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
