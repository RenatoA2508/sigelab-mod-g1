import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

// Captured output may contain administrative credentials: never print it.
const output = execFileSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['supabase', 'status', '-o', 'env'],
  { encoding: 'utf8' },
)
const config = {}
for (const line of output.split('\n')) {
  const match = /^([A-Z_]+)=(.*)$/.exec(line)
  if (match) config[match[1]] = match[2].startsWith('"') ? JSON.parse(match[2]) : match[2]
}
const url = config.API_URL
const key = config.PUBLISHABLE_KEY || config.ANON_KEY
if (!url || !key)
  throw new Error('No se encontró la configuración local. Ejecuta primero npm run db:start.')
writeFileSync('.env.local', `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_PUBLISHABLE_KEY=${key}\n`, {
  mode: 0o600,
})
console.log('Cliente configurado para el Supabase local. Reinicia Vite si estaba abierto.')
