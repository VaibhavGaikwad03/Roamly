// Netlify serverless proxy for AI calls.
//
// Keeps the Groq API key server-side: the browser POSTs to /api/ai, and this
// function forwards the request to Groq using GROQ_API_KEY (a *non*-VITE
// environment variable set in the Netlify dashboard, never shipped to the
// client). The frontend reaches this via VITE_AI_PROXY_URL="/api/ai", which a
// netlify.toml redirect maps to this function, so no key is ever in the bundle.
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

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const key = process.env.GROQ_API_KEY
  if (!key) return json({ error: 'Server is missing GROQ_API_KEY.' }, 500)

  let payload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const { messages, model, temperature, response_format } = payload || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'A non-empty "messages" array is required.' }, 400)
  }

  const chosenModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages,
        temperature: typeof temperature === 'number' ? temperature : 0.4,
        ...(response_format ? { response_format } : {}),
      }),
    })

    // Pass Groq's OpenAI-shaped response straight through (success or error).
    const text = await groqRes.text()
    return new Response(text, {
      status: groqRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return json({ error: `Upstream request failed: ${err.message}` }, 502)
  }
}
