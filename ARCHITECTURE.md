# Architecture Frontend - Gaming Educatif

## Structure complète du projet

```
frontend/
│
├── 📁 public/                          # Assets publics
│   └── vite.svg
│
├── 📁 src/                             # Code source principal
│   │
│   ├── 📄 main.jsx                     # Point d'entrée de l'application
│   ├── 📄 App.jsx                      # Composant racine
│   │
│   ├── 📁 config/                      # Configuration
│   │   ├── 📄 env.js                   # Variables d'environnement
│   │   └── 📄 routes.config.js         # Configuration des routes
│   │
│   ├── 📁 api/                         # Couche API (communication backend)
│   │   ├── 📄 axiosConfig.js           # Configuration Axios + interceptors
│   │   ├── 📄 endpoints.js             # Constantes des endpoints API
│   │   └── 📄 auth.api.js              # Appels API pour l'authentification
│   │
│   ├── 📁 services/                    # Services métier (logique pure)
│   │   └── 📄 auth.service.js          # Service d'authentification
│   │
│   ├── 📁 store/                       # State management (Context/Redux)
│   │   └── 📁 auth/
│   │       ├── 📄 AuthContext.jsx      # Context React pour l'auth
│   │       ├── 📄 authReducer.js        # Reducer (si besoin)
│   │       └── 📄 authActions.js       # Actions (si besoin)
│   │
│   ├── 📁 hooks/                       # Hooks personnalisés React
│   │   ├── 📄 useAuth.js               # Hook pour utiliser AuthContext
│   │   ├── 📄 useLocalStorage.js       # Hook pour localStorage
│   │   └── 📄 useForm.js                # Hook pour formulaires (validation)
│   │
│   ├── 📁 utils/                       # Utilitaires purs
│   │   ├── 📄 storage.js                # Abstraction localStorage/sessionStorage
│   │   ├── 📄 validators.js             # Fonctions de validation
│   │   └── 📄 constants.js              # Constantes globales (ROLES, ROUTES, etc.)
│   │
│   ├── 📁 components/                  # Composants React
│   │   │
│   │   ├── 📁 ui/                       # Composants UI réutilisables
│   │   │   ├── 📁 Button/
│   │   │   │   ├── 📄 Button.jsx
│   │   │   │   ├── 📄 Button.module.css
│   │   │   │   └── 📄 index.js          # Export barrel
│   │   │   │
│   │   │   ├── 📁 Input/
│   │   │   │   ├── 📄 Input.jsx
│   │   │   │   ├── 📄 Input.module.css
│   │   │   │   └── 📄 index.js
│   │   │   │
│   │   │   ├── 📁 Loader/
│   │   │   │   ├── 📄 Loader.jsx
│   │   │   │   └── 📄 index.js
│   │   │   │
│   │   │   └── 📄 index.js              # Export barrel pour tous les UI
│   │   │
│   │   ├── 📁 layout/                   # Composants de layout
│   │   │   ├── 📄 AuthLayout.jsx        # Layout pour pages d'authentification
│   │   │   └── 📄 MainLayout.jsx        # Layout principal de l'application
│   │   │
│   │   └── 📁 features/                 # Composants par feature (scalable)
│   │       └── 📁 auth/
│   │           ├── 📄 LoginForm.jsx
│   │           ├── 📄 RegisterForm.jsx
│   │           ├── 📄 ForgotPasswordForm.jsx
│   │           └── 📄 ResetPasswordForm.jsx
│   │
│   ├── 📁 pages/                        # Pages complètes de l'application
│   │   │
│   │   ├── 📁 auth/                     # Pages d'authentification
│   │   │   ├── 📁 Login/
│   │   │   │   ├── 📄 Login.jsx
│   │   │   │   └── 📄 index.js          # Export barrel
│   │   │   │
│   │   │   ├── 📁 Register/
│   │   │   │   ├── 📄 Register.jsx
│   │   │   │   └── 📄 index.js
│   │   │   │
│   │   │   ├── 📁 ForgotPassword/
│   │   │   │   ├── 📄 ForgotPassword.jsx
│   │   │   │   └── 📄 index.js
│   │   │   │
│   │   │   ├── 📁 ResetPassword/
│   │   │   │   ├── 📄 ResetPassword.jsx
│   │   │   │   └── 📄 index.js
│   │   │   │
│   │   │   └── 📄 index.js              # Export barrel pour toutes les pages auth
│   │   │
│   │   └── 📁 dashboard/
│   │       ├── 📄 Dashboard.jsx
│   │       └── 📄 index.js
│   │
│   ├── 📁 routes/                       # Configuration du routing
│   │   ├── 📄 AppRoutes.jsx              # Définition de toutes les routes
│   │   ├── 📄 PrivateRoute.jsx          # Route protégée (nécessite auth)
│   │   ├── 📄 PublicRoute.jsx           # Route publique (redirige si connecté)
│   │   └── 📄 AdminRoute.jsx             # Route admin (nécessite ROLE_ADMIN)
│   │
│   └── 📁 assets/                       # Assets statiques
│       ├── 📁 images/                    # Images
│       │   └── 📄 .gitkeep
│       ├── 📁 icons/                     # Icônes
│       │   └── 📄 .gitkeep
│       └── 📁 styles/                    # Fichiers CSS
│           ├── 📄 variables.css          # Variables CSS (couleurs, spacing)
│           ├── 📄 reset.css               # Reset CSS
│           ├── 📄 base.css                # Styles de base
│           ├── 📄 utilities.css           # Classes utilitaires
│           └── 📄 index.css               # Import de tous les CSS
│
├── 📄 index.html                         # Point d'entrée HTML
├── 📄 package.json                       # Dépendances et scripts
├── 📄 package-lock.json                  # Lock des versions
├── 📄 vite.config.js                     # Configuration Vite
├── 📄 .env                                # Variables d'environnement (à créer)
├── 📄 .env.local                          # Variables locales (à créer, gitignored)
└── 📄 .gitignore                          # Fichiers ignorés par Git
```

## Description des dossiers

### 📁 `config/`
Configuration centralisée de l'application (variables d'environnement, routes).

### 📁 `api/`
Couche de communication avec le backend :
- `axiosConfig.js` : Instance Axios avec interceptors (token, refresh, erreurs)
- `endpoints.js` : Constantes des endpoints API
- `auth.api.js` : Fonctions pour appeler les endpoints d'authentification

### 📁 `services/`
Logique métier pure (appelle les API et traite les données).

### 📁 `store/`
Gestion de l'état global :
- `AuthContext.jsx` : Context React pour l'authentification
- `authReducer.js` : Reducer pour gérer les actions (optionnel)
- `authActions.js` : Actions pour dispatcher (optionnel)

### 📁 `hooks/`
Hooks React personnalisés réutilisables.

### 📁 `utils/`
Fonctions utilitaires pures (pas de dépendances React).

### 📁 `components/ui/`
Composants UI réutilisables avec CSS Modules (scoped styles).

### 📁 `components/layout/`
Composants de mise en page (layouts).

### 📁 `components/features/`
Composants organisés par feature (auth, jeux, admin, etc.).

### 📁 `pages/`
Pages complètes de l'application (assemblent composants + layout).

### 📁 `routes/`
Configuration du routing avec guards (PrivateRoute, AdminRoute).

### 📁 `assets/`
Assets statiques (images, icônes, styles CSS).

## Flux de données

```
User Action
    ↓
Page Component
    ↓
Feature Component (Form)
    ↓
Hook (useAuth)
    ↓
Service (auth.service)
    ↓
API (auth.api)
    ↓
Axios (axiosConfig)
    ↓
Backend API
```

## Principes d'organisation

1. **Séparation des responsabilités** : Chaque dossier a un rôle précis
2. **Scalabilité** : Structure par feature pour faciliter l'ajout de nouvelles fonctionnalités
3. **Réutilisabilité** : Composants UI et hooks réutilisables
4. **Maintenabilité** : Code organisé et facile à trouver
5. **Performance** : CSS Modules, barrel exports, code splitting possible

## Prochaines étapes

1. Implémenter le contenu de chaque fichier selon le plan d'authentification
2. Ajouter les features suivantes (jeux, questions, sessions, etc.)
3. Optimiser avec lazy loading et code splitting
