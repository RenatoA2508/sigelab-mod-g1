import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isConfigured = Boolean(
  url && key && key !== 'replace-with-local-anon-or-hosted-publishable-key',
)
if (key?.startsWith('sb_secret_'))
  throw new Error('Las claves de servidor no pueden utilizarse en el navegador.')
if (key?.startsWith('eyJ')) {
  try {
    const encoded = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(encoded)) as { role?: string }
    if (payload.role === 'service_role') throw new Error('SERVER_KEY_IN_BROWSER')
  } catch (error) {
    if (error instanceof Error && error.message === 'SERVER_KEY_IN_BROWSER')
      throw new Error('Las claves de servidor no pueden utilizarse en el navegador.', {
        cause: error,
      })
  }
}

export const supabase = createClient<Database>(
  url || 'http://127.0.0.1:54321',
  key || 'not-configured',
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  },
)
