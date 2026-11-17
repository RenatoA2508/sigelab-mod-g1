import { randomBytes, randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'

process.loadEnvFile('.env.local')
const id = randomUUID()
const values = {
  E2E_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  E2E_SUPABASE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  E2E_STAFF_ID: id,
  E2E_STAFF_EMAIL: `sigelab-check-${id}@example.invalid`,
  E2E_STAFF_PASSWORD: `Test-${randomBytes(30).toString('base64url')}!`,
  E2E_OTHER_ID: randomUUID(),
  E2E_OTHER_EMAIL: `sigelab-other-${id}@example.invalid`,
  E2E_OTHER_PASSWORD: `Test-${randomBytes(30).toString('base64url')}!`,
  E2E_OBJECT_ID: randomUUID(),
  E2E_NOTEBOOK_ID: randomUUID(),
  E2E_RETURNED_ID: randomUUID(),
}
writeFileSync(
  '.env.e2e',
  Object.entries(values)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n',
  { mode: 0o600 },
)
console.log('Credenciales efímeras de verificación preparadas en un archivo ignorado por Git.')
