/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: [
      'next/core-web-vitals',
      'plugin:tailwindcss/recommended',
      'plugin:shadcn/recommended'
    ],
    plugins: ['tailwindcss', 'shadcn'],
    settings: {
      tailwindcss: {
        config: 'tailwind.config.js'
      }
    },
    rules: {
      // Enforce using CSS variables and design tokens instead of hardcoded colors
      'shadcn/no-inline-styles': 'error',
      // Encourage use of cva() for variant-based styling patterns
      'shadcn/require-cva': 'warn'
    }
  };
  