import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Fuseau UTC+1 (Cameroun, Bénin, Gabon…) : c'est là que les conversions
    // de dates en UTC se voient. À UTC+0 (Dakar), ces bugs passeraient inaperçus.
    env: { TZ: 'Africa/Douala' },
  },
});
