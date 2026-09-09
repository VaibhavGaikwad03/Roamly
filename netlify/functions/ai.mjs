// Netlify serverless proxy for AI calls — per-account, server-only key.
//
// Flow:
//   1. Browser POSTs { messages, temperature, json } with the caller's
//      Supabase access token in the Authorization header.
//   2. This function verifies the token with Supabase (→ the user id).
//   3. Using the SERVICE ROLE key (server-only), it reads that user's Groq key
//      and model from ai_credentials — a table clients cannot read.
//   4. It calls Groq and passes the response straight back.
//
// Required environment variables (set in the Netlify dashboard, NOT VITE_*, so
// they never ship to the browser):
//   SUPABASE_URL                 your project URL
//   SUPABASE_ANON_KEY            anon public key (used to verify the token)
//   SUPABASE_SERVICE_ROLE_KEY    service role key (bypasses RLS to read the key)
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'openai/gpt-oss-20b'
const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'moonshotai/kimi-k2-instruct',
  'deepseek-r1-distill-llama-70b',
])

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Verify a Supabase access token and return the user, or null.
async function getUser(url, anonKey, token) {
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Read the user's stored Groq key + model using the service role (bypasses RLS).
async function getCredentials(url, serviceKey, userId) {
  try {
    const res = await fetch(
      `${url}/rest/v1/ai_credentials?user_id=eq.${userId}&select=groq_key,groq_model`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    )
    if (!res.ok) return null
    const rows = await res.json()
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch {
    return null
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey)
    return json({ error: 'Server is missing Supabase environment variables.' }, 500)

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return json({ error: 'Missing authorization token.' }, 401)

  const user = await getUser(url, anonKey, token)
  if (!user?.id) return json({ error: 'Invalid or expired session.' }, 401)

  const creds = await getCredentials(url, serviceKey, user.id)
  if (!creds?.groq_key)
    return json({ error: 'No Groq key on file for this account.' }, 402)

  let payload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const { messages, temperature, json: wantJson } = payload || {}
  if (!Array.isArray(messages) || messages.length === 0)
    return json({ error: 'A non-empty "messages" array is required.' }, 400)

  const model = ALLOWED_MODELS.has(creds.groq_model) ? creds.groq_model : DEFAULT_MODEL

  const body = {
    model,
    messages,
    temperature: typeof temperature === 'number' ? temperature : 0.4,
    ...(wantJson ? { response_format: { type: 'json_object' } } : {}),
  }

  const call = (payloadBody) =>
    fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${creds.groq_key}` },
      body: JSON.stringify(payloadBody),
    })

  try {
    let groqRes = await call(body)

    // Some reasoning models reject strict JSON mode with a 400 — retry once
    // without response_format (prompts already ask for JSON; parser is lenient).
    if (!groqRes.ok && groqRes.status === 400 && wantJson) {
      const { response_format, ...noJson } = body
      void response_format
      groqRes = await call(noJson)
    }

    const text = await groqRes.text()
    return new Response(text, {
      status: groqRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return json({ error: `Upstream request failed: ${err.message}` }, 502)
  }
}
