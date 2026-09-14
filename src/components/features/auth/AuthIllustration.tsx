/**
 * Illustration décorative du panneau gauche des écrans d'authentification.
 * Dessinée à la main en SVG (dégradés + formes simples) plutôt qu'importée,
 * pour rester légère et cohérente dans les deux thèmes.
 */
export default function AuthIllustration({ flipped = false }: { flipped?: boolean }) {
  return (
    <svg
      viewBox="0 0 420 420"
      role="img"
      aria-label="Fusée survolant des étoiles et des nuages, illustrant le départ d'une aventure éducative"
      style={{ transform: flipped ? 'scaleX(-1)' : undefined }}
      className="w-full max-w-[380px] h-auto drop-shadow-[0_30px_40px_rgba(37,99,235,0.18)]"
    >
      <defs>
        <radialGradient id="ai-glow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#c7d7ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#c7d7ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ai-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbe6ff" />
        </linearGradient>
        <linearGradient id="ai-nose" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a65" />
          <stop offset="100%" stopColor="#ff5f6d" />
        </linearGradient>
        <linearGradient id="ai-fin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6a7cf0" />
          <stop offset="100%" stopColor="#4a5cd6" />
        </linearGradient>
        <linearGradient id="ai-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd36e" />
          <stop offset="100%" stopColor="#ff8a3d" />
        </linearGradient>
        <linearGradient id="ai-window" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf3ff" />
          <stop offset="100%" stopColor="#8fb2ff" />
        </linearGradient>
      </defs>

      {/* halo doux derrière la scène */}
      <circle cx="210" cy="190" r="170" fill="url(#ai-glow)" />

      {/* étoiles */}
      <g fill="#9fb2e8">
        <circle cx="70" cy="80" r="3.5" />
        <circle cx="340" cy="70" r="3" />
        <circle cx="365" cy="180" r="2.5" />
        <circle cx="50" cy="230" r="2.5" />
        <circle cx="95" cy="330" r="3" />
        <circle cx="320" cy="300" r="2.5" />
      </g>
      <g fill="#c3d0f7">
        <path d="M300 110 l4 0 l0 4 l-4 0 z" />
        <path d="M120 60 l4 0 l0 4 l-4 0 z" />
        <path d="M330 250 l4 0 l0 4 l-4 0 z" />
      </g>

      {/* nuage */}
      <g opacity="0.9">
        <circle cx="130" cy="330" r="26" fill="#ffffff" />
        <circle cx="160" cy="322" r="34" fill="#ffffff" />
        <circle cx="196" cy="334" r="24" fill="#ffffff" />
        <rect x="118" y="330" width="96" height="22" rx="11" fill="#ffffff" />
      </g>
      <g opacity="0.55">
        <circle cx="290" cy="100" r="14" fill="#ffffff" />
        <circle cx="305" cy="96" r="18" fill="#ffffff" />
        <rect x="282" y="98" width="42" height="12" rx="6" fill="#ffffff" />
      </g>

      {/* fusée (inclinée) */}
      <g transform="translate(210 205) rotate(-18)">
        {/* flamme */}
        <ellipse cx="0" cy="108" rx="16" ry="34" fill="url(#ai-flame)" />
        <ellipse cx="0" cy="100" rx="9" ry="18" fill="#fff3c4" />

        {/* ailerons */}
        <polygon points="-30,60 -58,100 -22,84" fill="url(#ai-fin)" />
        <polygon points="30,60 58,100 22,84" fill="url(#ai-fin)" />

        {/* corps */}
        <path
          d="M0 -120
             C 34 -100, 40 -40, 40 30
             L -40 30
             C -40 -40, -34 -100, 0 -120 Z"
          fill="url(#ai-body)"
          stroke="#c3d0f7"
          strokeWidth="1.5"
        />

        {/* coiffe */}
        <path d="M0 -120 C 14 -104, 20 -84, 20 -68 L -20 -68 C -20 -84, -14 -104, 0 -120 Z" fill="url(#ai-nose)" />

        {/* hublot */}
        <circle cx="0" cy="-28" r="19" fill="url(#ai-window)" stroke="#ffffff" strokeWidth="4" />
        <circle cx="-6" cy="-35" r="5" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  );
}
