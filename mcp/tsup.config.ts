import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  // lib/ lives outside this package, so it must be inlined rather than
  // left as a bare import that npm consumers cannot resolve.
  noExternal: [/^@lib\//],
  banner: { js: '#!/usr/bin/env node' },
})
