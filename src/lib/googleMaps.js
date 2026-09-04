// Parse a pasted Google Maps URL (or raw "lat, lng") into coordinates and,
// when present, a place name. Runs entirely client-side.
//
// Handles the common desktop/mobile URL shapes:
//   .../maps/place/Eiffel+Tower/@48.8584,2.2945,17z/data=...!3d48.8584!4d2.2945
//   .../maps/search/48.8584,2.2945
//   .../maps?q=48.8584,2.2945   ?ll=...  &destination=...  &daddr=...
//   .../maps/@48.8584,2.2945,15z
//   raw "48.8584, 2.2945"
//
// Short links (maps.app.goo.gl / goo.gl/maps) are redirects whose target
// can't be read from the browser (CORS), so we flag them so the UI can ask
// for the full link instead.
const COORD = String.raw`(-?\d{1,3}(?:\.\d+)?)`

function validLat(n) {
  return Number.isFinite(n) && n >= -90 && n <= 90
}
function validLng(n) {
  return Number.isFinite(n) && n >= -180 && n <= 180
}

function decodeName(raw) {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim()
  } catch {
    return raw.replace(/\+/g, ' ').trim()
  }
}

export function isGoogleMapsShortLink(text) {
  return /(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(text)
}

export function parseGoogleMapsUrl(input) {
  const text = (input || '').trim()
  if (!text) return null

  if (isGoogleMapsShortLink(text)) return { shortLink: true }

  let name = ''
  // Named place segment: /place/<Name>/
  const placeMatch = text.match(/\/place\/([^/@?]+)/)
  if (placeMatch) name = decodeName(placeMatch[1])

  // Coordinates, most precise source first.
  // 1. data marker coords: !3d<lat>!4d<lng>
  let m = text.match(new RegExp(`!3d${COORD}!4d${COORD}`))
  // 2. query/link params: q= / query= / ll= / destination= / daddr=
  if (!m)
    m = text.match(new RegExp(`[?&](?:q|query|ll|destination|daddr)=${COORD}%2C\\s*${COORD}`, 'i'))
  if (!m)
    m = text.match(new RegExp(`[?&](?:q|query|ll|destination|daddr)=${COORD},\\s*${COORD}`, 'i'))
  // 3. /search/<lat>,<lng>
  if (!m) m = text.match(new RegExp(`/search/${COORD},\\s*${COORD}`))
  // 4. viewport centre: @<lat>,<lng>
  if (!m) m = text.match(new RegExp(`@${COORD},${COORD}`))
  // 5. raw "lat, lng" (only when the whole string is basically that)
  if (!m && /^-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/.test(text))
    m = text.match(new RegExp(`^${COORD},\\s*${COORD}$`))

  if (m) {
    const lat = parseFloat(m[1])
    const lng = parseFloat(m[2])
    if (validLat(lat) && validLng(lng)) return { lat, lng, name }
  }

  // A named place with no coordinates (e.g. /maps/search/<name>) — the caller
  // can forward-geocode the name.
  if (!name) {
    const searchMatch = text.match(/\/(?:search|dir)\/([^/@?]+)/)
    if (searchMatch) name = decodeName(searchMatch[1])
  }
  if (name) return { name }

  return null
}
