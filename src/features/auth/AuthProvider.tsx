import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

type AuthState = {
  session: Session | null
  loading: boolean
  isStaff: boolean
  roleError: boolean
  signOut: () => Promise<void>
}
const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const queryClient = useQueryClient()
  useEffect(() => {
    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, current) => {
      if (active) {
        setSession(current)
        setInitializing(false)
      }
    })
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setSession(data.session)
          setInitializing(false)
        }
      })
      .catch(() => {
        if (active) setInitializing(false)
      })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])
  const role = useQuery({
    queryKey: ['staff', session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_labfis_staff')
      if (error) throw error
      return Boolean(data)
    },
    retry: 1,
    staleTime: 30_000,
  })
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    queryClient.clear()
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        loading: initializing || Boolean(session && role.isPending),
        isStaff: role.data === true,
        roleError: role.isError,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Context and hook intentionally share the provider's public entry point.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('AuthProvider is required')
  return auth
}
