/** Rovo design tokens — sampled from the Rovo mobile mockups.
 *  Core keys (bg/primary/accent/text/border) are repointed to the new palette so every
 *  screen adopts the rebrand; navy/cream/amber/green/ink/muted are the named Rovo tokens. */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Rovo named tokens
        navy: { DEFAULT: '#2C3A4B', dark: '#1E2A38', light: '#3A4A5C' },
        cream: '#F4EFE6',
        card: '#FFFFFF',
        amber: { DEFAULT: '#E0913C', light: '#FBEFDD' },
        green: { DEFAULT: '#3E9E75', light: '#E4F2EA' },
        ink: '#1E2A38',
        muted: '#8A94A0',
        // Legacy keys repointed to the Rovo palette (keeps existing classNames on-brand)
        bg: '#F4EFE6',
        white: '#FFFFFF',
        primary: { DEFAULT: '#2C3A4B', light: '#E7EBEF', dark: '#1E2A38' },
        accent: { DEFAULT: '#E0913C', light: '#FBEFDD' },
        maize: { DEFAULT: '#E0913C', light: '#FBEFDD' },
        text: { DEFAULT: '#1E2A38', 2: '#4A5763', 3: '#8A94A0' },
        border: '#E7E2D8',
        sidebar: '#1E2A38',
      },
      borderRadius: { card: '16px', btn: '14px' },
    },
  },
  plugins: [],
};
