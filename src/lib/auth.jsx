// Auth context — exposes the current session/user and sign-in/up/out actions.
//
// Wraps Supabase auth so components read `useAuth()` instead of touching the
// client directly. Session is restored on load and kept in sync via
// onAuthStateChange (login in another tab, token refresh, sign-out).
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,

    // Create an account. Depending on project settings Supabase may require
    // email confirmation before a session exists — the UI handles both.
    async signUp({ email, password, name }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || '' } },
      })
      return { data, error, needsConfirmation: !error && !data.session }
    },

    async signIn({ email, password }) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      return { data, error }
    },

    async signOut() {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
