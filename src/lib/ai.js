// Single entry point for all AI calls, so features never touch the transport.
//
// The user's Groq key is stored SERVER-SIDE (ai_credentials, per account) and
// is never sent to the browser. So AI requests go to a serverless proxy
// (/api/ai) with the caller's Supabase access token; the function verifies the
// user, loads their key + model with the service role, and calls Groq.
//
// The one exception is verifyGroqKey(): during setup the user types a key into
// the browser, so we can check it directly against Groq before saving. After
// it's saved, the raw key never comes back here.
import { supabase } from './supabase.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || '/api/ai'
export const DEFAULT_MODEL = 'openai/gpt-oss-20b'

async function errorMessage(res) {
  const raw = await res.text().catch(() => '')
  try {
    return JSON.parse(raw)?.error?.message || raw
  } catch {
    return raw
  }
}

// Check a candidate key + model with a minimal request, straight to Groq.
// Only used while the user is entering the key on the Connect AI screen.
export async function verifyGroqKey(key, testModel) {
  const k = (key || '').trim()
  if (!k) return { ok: false, error: 'Enter a key first.' }
  const useModel = testModel || DEFAULT_MODEL
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k}` },
      body: JSON.stringify({
        model: useModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    })
    if (res.ok) return { ok: true }
    if (res.status === 401)
      return { ok: false, error: 'Key rejected (401). Double-check the key.' }
    if (res.status === 429)
      return { ok: true, warn: 'Key works, but is rate-limited right now.' }
    const msg = await errorMessage(res)
    if (res.status === 404)
      return {
        ok: false,
        error: `Model “${useModel}” isn’t available for this key. Pick another model. (${msg})`,
      }
    return { ok: false, error: `Groq error ${res.status}: ${msg}` }
  } catch {
    return { ok: false, error: 'Could not reach Groq — check your connection.' }
  }
}

async function aiChat(messages, { json = false, temperature = 0.4 } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Sign in to use AI features.')

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, temperature, json }),
  })

  if (!res.ok) {
    if (res.status === 401)
      throw new Error('Session expired or AI key rejected — check AI settings.')
    if (res.status === 402)
      throw new Error('No Groq key on your account yet. Add one in AI settings.')
    const msg = await errorMessage(res)
    throw new Error(`AI request failed (${res.status}). ${String(msg).slice(0, 120)}`)
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
  'trek, nature, waterfall, fort, beach, viewpoint, spiritual, city, food, stay, ' +
  'wildlife, camping, lake, caves, adventure, sunset'

// Turn free-text ("that ramen place in Shibuya") into structured place hints.
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

// Suggest new places, informed by the traveler's history.
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
