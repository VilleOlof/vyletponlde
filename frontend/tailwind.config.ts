import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      fontFamily: {
        "IBMPlexMono": ["IBMPlexMono", "monospace"],
      }
    }
  },

  plugins: []
} satisfies Config;
