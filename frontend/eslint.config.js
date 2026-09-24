import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Without this, core no-unused-vars can't see a variable used only as a
      // JSX tag name (e.g. `function Card({ icon: Icon }) { return <Icon /> }`)
      // and false-flags it as unused across the whole codebase.
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Keeps the stylesheet clean-up from unravelling. Both of these were everywhere before:
      // 38 components injected their own <style> tag, and colours were written as hex in style
      // objects, which then stayed light-blue on a dark page.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="style"]',
          message:
            'Put the CSS in src/styles (a partial imported by main.scss) and give the element a class. A <style> tag here is global CSS with extra steps.',
        },
        {
          // White and black are exempt on purpose: white text on a coloured button is white in
          // both themes, and tokenising it would be busywork that reads as a rule nobody means.
          selector:
            'JSXAttribute[name.name="style"] Literal[value=/^#(?!(fff|ffffff|000|000000)$)[0-9A-Fa-f]{3,8}$/i]',
          message:
            'Use a theme token (var(--primary), var(--text-muted) …) instead of a hex. A hex is the same colour in dark mode, which is how text disappears into the background.',
        },
      ],
    },
  },
  {
    // Printed documents and the palette page are the exceptions: a receipt goes on white paper and
    // must not follow the screen's theme, and the style guide exists to show the raw values.
    files: [
      '**/StyleGuide.jsx',
      '**/AdmitCardPage.jsx',
      '**/SeatPlanPage.jsx',
      '**/FeeReceipt.jsx',
      '**/components/maps/**',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
]
