// Supabase client - the single connection the app uses for auth + data.
//
// Configure by copying .env.example to .env and setting:
//   VITE_SUPABASE_URL       your project URL (Dashboard -> Project Settings -> API)
//   VITE_SUPABASE_ANON_KEY  the "anon public" key from the same page
//
// The anon key is safe to ship in the browser: it only grants what Row-Level
// Security policies allow (each user sees just their own rows). The Groq API
// key is NOT stored through this client - it lives server-side (see the
// Netlify function) and is never exposed here.
import { createClient } from '@supabase/supabase-js'

// The anon key is sent as an HTTP header (apikey / Authorization), and header
// values must be ISO-8859-1 (Latin-1). A copy-paste artifact - a smart quote,
// a zero-width or full-width character - makes every auth request throw
// "String contains non ISO-8859-1 code point". Trim stray whitespace and, if a
// non-Latin-1 character survives, surface a clear, named error instead of the
// browser's cryptic one. (Fix the value itself in your env / Netlify vars.)
function cleanEnv(value, name) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  for (const ch of trimmed) {
    if (ch.charCodeAt(0) > 255) {
      console.error(
        `[Roamly] ${name} contains a non Latin-1 character, so auth requests will ` +
          `fail. Re-paste it from the Supabase dashboard as plain text and redeploy.`,
      )
      break
    }
  }
  return trimmed
}

const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
const anonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY')

// True only when both values are present, so the app can show a friendly
// "finish setup" screen instead of crashing when env vars are missing.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
