// Per-account settings — display name (profiles table) and the AI credential
// status (ai_credentials, via security-definer RPCs).
//
// The Groq key is SERVER-ONLY: it is written through the ai_set RPC and read
// back only as a boolean (has_key) via ai_status. The raw key never returns to
// the browser after it is saved — actual AI calls resolve it server-side in
// the Netlify function using the service role.
import { supabase } from './supabase.js'

// ---------- profile name ----------
export async function getProfileName() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ''
  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()
  // Fall back to the name captured at signup if the profile row lags.
  return data?.display_name || user.user_metadata?.display_name || ''
}

export async function setProfileName(value) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: (value || '').trim() })
}

// ---------- AI credential status ----------
// Returns { hasKey, model }. Never returns the key itself.
export async function getAiStatus() {
  const { data, error } = await supabase.rpc('ai_status')
  if (error) return { hasKey: false, model: '' }
  const row = Array.isArray(data) ? data[0] : data
  return { hasKey: Boolean(row?.has_key), model: row?.model || '' }
}

// Save (or replace) the key and/or model. Empty key keeps the existing one.
export async function setAiCredentials(key, model) {
  const { error } = await supabase.rpc('ai_set', {
    p_key: (key || '').trim(),
    p_model: (model || '').trim(),
  })
  if (error) throw error
}

export async function clearAiCredentials() {
  const { error } = await supabase.rpc('ai_clear')
  if (error) throw error
}
