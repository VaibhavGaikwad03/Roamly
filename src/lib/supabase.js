// Supabase client — the single connection the app uses for auth + data.
//
// Configure by copying .env.example to .env and setting:
//   VITE_SUPABASE_URL       your project URL (Dashboard → Project Settings → API)
//   VITE_SUPABASE_ANON_KEY  the "anon public" key from the same page
//
// The anon key is safe to ship in the browser: it only grants what Row-Level
// Security policies allow (each user sees just their own rows). The Groq API
// key is NOT stored through this client — it lives server-side (see the
// Netlify function) and is never exposed here.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
