import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Seulement les règles classiques (respect des règles des hooks + deps
      // d'effet) : la v7 du plugin embarque aussi des règles "React Compiler"
      // (purity, set-state-in-effect, immutability...) hors-sujet ici et très
      // bruyantes sur du code existant — non activées volontairement.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Le projet n'active pas encore noUnusedLocals/Parameters côté TS : on ne
      // bloque pas le lint dessus pour l'instant (voir tsconfig.json).
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Profondeur par défaut trop faible pour nos <label> dont le texte est
      // nické dans des <span> imbriqués (ex. case à cocher avec description).
      'jsx-a11y/label-has-associated-control': ['error', { depth: 5 }],
    },
  },
)
