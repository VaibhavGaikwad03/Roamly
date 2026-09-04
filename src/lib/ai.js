// Single entry point for all AI calls, so features never touch the transport.
//
// Resolution order (highest priority first):
//   1. The user's own Groq key (set in the app, stored in their browser) —
//      "bring your own key". Called directly from the browser; it's their key
//      on their device, so nothing central is exposed.
//   2. VITE_AI_PROXY_URL — POST { messages, json } to a serverless function
//      that holds a shared key server-side. Safe for public deploys.
//   3. VITE_GROQ_API_KEY — a build-time browser key (visible in the page;
//      local/personal use only).
//   4. None — AI is disabled; the UI shows a "set your key" prompt.
//
// Because everything goes through `aiChat`, and the user key comes from the
// settings seam, a future per-account DB just changes where the key lives.
import { getGroqKey, getGroqModel } from './settings.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL
const BUILD_KEY = import.meta.env.VITE_GROQ_API_KEY
export const DEFAULT_MODEL = 'openai/gpt-oss-20b'

// User's chosen model (Connect AI screen) wins, else a build-time override,
// else the default.
function model() {
  return getGroqModel() || import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL
}

// Pull Groq's human-readable error message out of a failed response body.
async function errorMessage(res) {
  const raw = await res.text().catch(() => '')
  try {
    return JSON.parse(raw)?.error?.message || raw
  } catch {
    return raw
  }
}

export function aiEnabled() {
  return Boolean(getGroqKey() || PROXY_URL || BUILD_KEY)
}

export function aiMode() {
  if (getGroqKey()) return 'user'
  if (PROXY_URL) return 'proxy'
  if (BUILD_KEY) return 'browser'
  return 'off'
}

// Check a candidate key + the selected model with a minimal request.
export async function verifyGroqKey(key, testModel) {
  const k = (key || '').trim()
  if (!k) return { ok: false, error: 'Enter a key first.' }
  const useModel = testModel || model()
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
  const userKey = getGroqKey()

  const body = {
    model: model(),
    messages,
    temperature,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }

  let endpoint
  let sendBody
  const headers = { 'Content-Type': 'application/json' }

  if (userKey) {
    endpoint = GROQ_URL
    headers.Authorization = `Bearer ${userKey}`
    sendBody = body
  } else if (PROXY_URL) {
    endpoint = PROXY_URL
    sendBody = { ...body, json }
  } else if (BUILD_KEY) {
    endpoint = GROQ_URL
    headers.Authorization = `Bearer ${BUILD_KEY}`
    sendBody = body
  } else {
    throw new Error('Add your Groq API key to use AI features.')
  }

  const post = (payload) =>
    fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) })

  let res = await post(sendBody)

  // Some (reasoning) models reject strict JSON mode with a 400. Retry once
  // without response_format — the prompts already ask for JSON and the parser
  // tolerates prose around it.
  if (!res.ok && res.status === 400 && json) {
    const { response_format, ...noJson } = sendBody
    void response_format
    res = await post(noJson)
  }

  if (!res.ok) {
    if (res.status === 401)
      throw new Error('Your Groq key was rejected. Update it in AI settings.')
    const msg = await errorMessage(res)
    if (res.status === 404)
      throw new Error(`Model “${model()}” isn’t available — change it in AI settings.`)
    throw new Error(`AI request failed (${res.status}). ${msg.slice(0, 120)}`)
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
