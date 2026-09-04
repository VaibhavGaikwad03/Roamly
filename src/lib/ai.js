// Single entry point for all AI calls, so features never touch the transport.
//
// Resolution order (set one in a `.env` file):
//   1. VITE_AI_PROXY_URL — POST { messages, json } to your own serverless
//      function that holds the Groq key server-side. Safe for public deploys.
//   2. VITE_GROQ_API_KEY — call Groq directly from the browser. Simplest for
//      local / personal use, but the key is visible in the shipped page.
//   3. Neither — AI is disabled; the UI shows a short setup hint instead.
//
// Because everything goes through `aiChat`, switching from a browser key to a
// proxy later is a config change, not a code change.
const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

export function aiEnabled() {
  return Boolean(PROXY_URL || GROQ_KEY)
}

export function aiMode() {
  if (PROXY_URL) return 'proxy'
  if (GROQ_KEY) return 'browser'
  return 'off'
}

async function aiChat(messages, { json = false, temperature = 0.4 } = {}) {
  if (!aiEnabled()) throw new Error('AI is not configured.')

  const body = {
    model: MODEL,
    messages,
    temperature,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }

  const endpoint = PROXY_URL || 'https://api.groq.com/openai/v1/chat/completions'
  const headers = { 'Content-Type': 'application/json' }
  if (!PROXY_URL) headers.Authorization = `Bearer ${GROQ_KEY}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    // A proxy may accept the same OpenAI-shaped body; we also send the raw
    // fields so a thin proxy can forward or reshape as it likes.
    body: JSON.stringify(PROXY_URL ? { ...body, json } : body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI request failed (${res.status}). ${detail.slice(0, 140)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// Pull the first JSON value out of a model response, tolerating stray prose
// or ```json fences around it.
function parseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    /* fall through */
  }
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
  return null
}

const CATEGORY_IDS =
  'restaurant, cafe, bar, hotel, attraction, museum, nature, beach, shopping, other'

// Turn free-text ("that ramen place in Shibuya") into structured place hints.
// Returns [{ name, category, note }]; coordinates are resolved by geocoding
// the name elsewhere, so the model never invents map positions.
export async function extractPlacesFromText(text) {
  const content = await aiChat(
    [
      {
        role: 'system',
        content:
          'You turn a traveler\'s notes into place entries. Return ONLY JSON: ' +
          '{"places":[{"name":"","category":"","note":""}]}. ' +
          `"category" must be one of: ${CATEGORY_IDS}. ` +
          '"name" should be specific and geocodable (include the city/area if known). ' +
          '"note" is a short optional reason (<=90 chars) or "". Max 6 places.',
      },
      { role: 'user', content: text },
    ],
    { json: true, temperature: 0.2 },
  )
  const parsed = parseJson(content)
  const list = Array.isArray(parsed) ? parsed : parsed?.places
  return Array.isArray(list) ? list.filter((p) => p && p.name) : []
}

// A short, useful blurb for one saved place.
export async function placeInsights(place) {
  const content = await aiChat(
    [
      {
        role: 'system',
        content:
          'You are a concise, practical travel guide. Given a place, reply with ' +
          'ONLY JSON: {"summary":"","bestTime":"","tip":""}. ' +
          'summary: 1-2 sentences on what it is known for. ' +
          'bestTime: a short phrase (e.g. "Spring mornings"). ' +
          'tip: one practical visitor tip. No markdown.',
      },
      {
        role: 'user',
        content: `${place.name}${place.address ? `, ${place.address}` : ''}`,
      },
    ],
    { json: true, temperature: 0.5 },
  )
  return parseJson(content)
}

// Suggest new places to visit, informed by where the traveler has already been.
// Returns [{ name, category, reason }].
export async function recommendPlaces(places) {
  const visited = places
    .filter((p) => p.status === 'visited')
    .map((p) => p.name)
    .slice(0, 20)
  const want = places
    .filter((p) => p.status === 'want')
    .map((p) => p.name)
    .slice(0, 20)

  const content = await aiChat(
    [
      {
        role: 'system',
        content:
          'You are a travel recommender. Suggest 5 NEW places the traveler has ' +
          'not listed, matching the vibe of their history. Return ONLY JSON: ' +
          '{"places":[{"name":"","category":"","reason":""}]}. ' +
          `"category" one of: ${CATEGORY_IDS}. "name" must be specific and ` +
          'geocodable (include city/country). "reason" <=90 chars.',
      },
      {
        role: 'user',
        content: `Visited: ${visited.join('; ') || '(none)'}\nWant to visit: ${
          want.join('; ') || '(none)'
        }`,
      },
    ],
    { json: true, temperature: 0.7 },
  )
  const parsed = parseJson(content)
  const list = Array.isArray(parsed) ? parsed : parsed?.places
  return Array.isArray(list) ? list.filter((p) => p && p.name) : []
}

// Build a simple ordered itinerary from the want-to-visit list.
// Returns { title, days:[{ day, theme, stops:[{ name, why }] }] }.
export async function planTrip(places) {
  const want = places
    .filter((p) => p.status === 'want')
    .map((p) => `${p.name}${p.address ? ` (${p.address})` : ''}`)
  if (want.length === 0) return null

  const content = await aiChat(
    [
      {
        role: 'system',
        content:
          'You are a trip planner. Group the given want-to-visit places into a ' +
          'sensible ordered itinerary (cluster by geography, pace it out). Return ' +
          'ONLY JSON: {"title":"","days":[{"day":1,"theme":"","stops":[{"name":"","why":""}]}]}. ' +
          'Use ONLY the places provided. "why" <=80 chars.',
      },
      { role: 'user', content: want.join('\n') },
    ],
    { json: true, temperature: 0.5 },
  )
  return parseJson(content)
}
