# Design et avatars – Comment c’est fait (pour l’encadrant)

## 1. Outils et stack utilisés pour le design

- **Aucune librairie UI** : pas de Bootstrap, Tailwind, Material-UI, etc. Tout est fait “à la main” en React.
- **Stack front** : **React** + **Vite** ; pas de préprocesseur CSS (Sass/Less).
- **Méthode de style** : **styles inline** en JavaScript (objets `style={{ ... }}`) dans les composants, plus des balises `<style>` pour les **animations CSS** (keyframes : dégradés, particules, etc.).
- **Pas de maquette Figma/Adobe XD** dans le projet : le design a été défini directement dans le code (couleurs, espacements, dégradés, ombres).

En résumé pour l’encadrant : *“Le design a été fait entièrement en code : styles inline en React et animations en CSS. Aucun outil de maquette ni librairie de composants, pour garder le bundle léger et tout contrôler.”*

---

## 2. D’où viennent les avatars ? Comment ils sont “générés”

Il n’y a **pas d’upload de photo** ni d’API externe pour des images. Deux sources uniquement :

### A. Avatars prédéfinis (choix par l’utilisateur)

- **Source** : une **liste fixe d’emojis** définie dans le frontend, dans `src/utils/avatarUtils.js` (constante `PREDEFINED_AVATARS`).
- **Contenu** : environ 80 emojis Unicode (personnages, métiers, loisirs, gaming, etc.) : 👤, 👨, 👩, 🎮, 🏆, 🤖, etc.
- **Stockage** : l’utilisateur en choisit un ; on envoie cet emoji (chaîne de caractères) au backend dans le champ `avatarUrl`. En base, on stocke donc une **chaîne** (ex. `"🎮"`), pas une image.
- **Affichage** : on affiche simplement l’emoji dans un cercle (style gradient autour). Pas de génération d’image côté serveur.

En résumé : *“Les avatars ‘choisis’ viennent d’une liste d’emojis codée en dur dans le projet. On ne génère pas d’image : on stocke l’emoji en base et on l’affiche tel quel.”*

### B. Avatar par défaut (quand aucun avatar n’est choisi)

- **Génération** : **côté front uniquement**, dans `avatarUtils.js`, fonction `generateDefaultAvatar(initial, size)`.
- **Principe** :
  - On calcule une **initiale** à partir de l’email, du nom et du prénom (fonction `getInitial`) : par ex. “Jean Dupont” → “JD”.
  - On affiche un **cercle coloré** (dégradé) avec cette initiale en blanc au centre.
  - La **couleur du dégradé** est choisie de façon **déterministe** à partir du code du premier caractère de l’initiale (`charCodeAt(0) % nombre de palettes`), pour que le même utilisateur ait toujours la même couleur.
- **Aucune image** : c’est du HTML/CSS (une `div` avec `borderRadius: "50%"`, un `linear-gradient`, et le texte de l’initiale).

En résumé : *“Quand l’utilisateur n’a pas choisi d’avatar, on affiche un cercle avec ses initiales et un dégradé de couleurs. C’est généré en JavaScript/CSS dans le frontend, pas d’image ni d’API.”*

---

## 3. Récapitulatif pour l’encadrant

| Question | Réponse courte |
|----------|----------------|
| **Avec quels outils le design a été fait ?** | React + Vite, styles inline (objets JS) + CSS (keyframes). Aucune librairie UI, pas de Figma dans le projet. |
| **Comment vous avez travaillé le design ?** | Directement dans le code : couleurs, dégradés, ombres, espacements et animations définis dans les composants et dans des `<style>`. |
| **D’où viennent les avatars ?** | 1) Liste d’emojis prédéfinie dans le code (avatar choisi). 2) Cercle avec initiales + dégradé généré en JS/CSS (avatar par défaut). |
| **Où sont-ils “générés” ?** | Côté front uniquement. Les emojis sont stockés en base comme chaînes ; l’avatar par défaut est du HTML/CSS généré par `avatarUtils.js`. |

Fichiers à montrer si besoin :
- **Design / styles** : `src/pages/Home/Home.jsx`, `src/components/layout/AdminLayout.jsx`, `src/pages/admin/profile/AdminProfile.jsx` (objets `styles`, `style={}`).
- **Avatars** : `src/utils/avatarUtils.js` (liste d’emojis, `getInitial`, `generateDefaultAvatar`).
