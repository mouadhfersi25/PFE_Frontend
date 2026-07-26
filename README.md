# EduGame AI – Frontend

Application React (Vite) pour la plateforme EduGame AI : authentification, dashboards Admin / Éducateur / Joueur / Parent, et jeux éducatifs.

## Structure du projet (bonnes pratiques React)

```
src/
├── api/                 # Appels API (axios, endpoints)
├── assets/              # Styles globaux, variables CSS
│   └── styles/          # index.css, minimal.css, legacy-pages.css, variables.css
├── components/          # Composants réutilisables
│   ├── admin/           # AdminSidebar (dashboard admin)
│   ├── educator/        # EducatorSidebar (dashboard éducateur)
│   ├── features/        # Par fonctionnalité (auth: LoginForm, RegisterForm, etc.)
│   ├── figma/           # ImageWithFallback et composants design
│   ├── layout/          # Layouts (DashboardLayout, AdminLayout, AuthLayout)
│   └── ui/              # Composants UI (Button, Input, Loader + shadcn: button, card, dialog, etc.)
├── context/             # Contexte React global (auth jeu, admin data)
│   ├── EduGameAuthBridge.tsx  # Pont auth backend → useAuth() pour les pages jeu
│   ├── AdminDataContext.tsx   # Données admin (games, badges, configs)
│   └── index.js         # Exports centralisés
├── data/                # Données mock (mockData.ts)
├── hooks/               # Hooks personnalisés (useInputFocus, etc.)
├── pages/               # Toutes les pages de l’application
│   ├── admin/           # AdminDashboard, Players, Games, Badges, Moderation, Statistics, profile
│   ├── auth/            # Login, Register, ForgotPassword, ResetPassword, Verify
│   ├── dashboard/       # Dashboard utilisateur + UserProfile
│   ├── educator/        # EducatorDashboard, Questions, EducatorGames, etc.
│   ├── Home/            # Page d’accueil
│   ├── parent/          # ParentDashboard, ChildProgress, Analytics
│   └── player/          # PlayerDashboard, NewGame, WaitingRoom, games/, Progress, Badges, etc.
├── routes/              # Configuration des routes (AppRoutes, guards, BodyClassSync)
├── services/            # Services (auth.service, user.service, roomService)
├── store/               # État global auth (AuthContext connecté au backend)
├── styles/              # Tailwind, formAnimations, tailwind.css
├── utils/               # Utilitaires (constants, storage, errorHandler, avatarUtils)
├── App.jsx
└── main.jsx
```

## Règles de style

- **Pages Auth + Home** : ancien CSS (dégradé, formulaire) appliqué quand `body` a la classe `page-legacy` (gérée par `BodyClassSync`).
- **Tout le reste** (dashboards, jeux) : **Tailwind** uniquement (template EduGame). Rien ne doit écraser les classes Tailwind.

## Alias

- `@/` → `src/` (défini dans `vite.config.js`). À utiliser pour importer context, data, services, store.

## Commandes

- `npm run dev`   – serveur de développement (port 3000)
- `npm run build` – build de production
- `npm run preview` – prévisualisation du build
