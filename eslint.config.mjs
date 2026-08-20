import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'mcp/**'],
  },
  ...nextCoreWebVitals,
]

export default config
