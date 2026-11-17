import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (key?.startsWith('sb_secret_'))
    throw new Error(
      'VITE_SUPABASE_PUBLISHABLE_KEY debe ser una clave publicable, nunca una clave secreta.',
    )
  if (
    key?.startsWith('eyJ') &&
    JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role !== 'anon'
  ) {
    throw new Error('Una clave privilegiada de Supabase no puede incluirse en el frontend.')
  }
  return {
    plugins: [react()],
    test: {
      include: ['src/**/*.test.{ts,tsx}', 'tests/database/**/*.test.ts'],
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
    },
    server: { port: 3000, strictPort: true },
    build: {
      sourcemap: false,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'react-vendor', test: /node_modules\/(react|react-dom|scheduler)\// },
              { name: 'supabase-vendor', test: /node_modules\/@supabase\// },
            ],
          },
        },
      },
    },
  }
})
