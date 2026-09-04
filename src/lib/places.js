// Place search.
//
// Roamly can search places two ways:
//
//   1. Google Places (New) Text Search — used automatically when a browser
//      key is provided via the `VITE_GOOGLE_PLACES_KEY` environment variable
//      (put it in a `.env` file). The key must allow the "Places API (New)"
//      and be referrer-restricted for browser use.
//
//   2. OpenStreetMap / Nominatim — the zero-config default, so search works
//      the moment you clone and run the project without any API key.
//
// Both return the same normalized shape:
//   { id, name, address, lat, lng, class, type }
import { guessCategory } from './categories.js'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY

export const searchProvider = GOOGLE_KEY ? 'google' : 'osm'

export async function searchPlaces(query, { signal } = {}) {
  const q = query.trim()
  if (!q) return []
  return GOOGLE_KEY ? searchGoogle(q, signal) : searchOsm(q, signal)
}

async function searchGoogle(query, signal) {
  const res = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 8 }),
    },
  )
  if (!res.ok) throw new Error(`Google Places search failed (${res.status})`)
  const data = await res.json()
  return (data.places || []).map((p) => ({
    id: p.id,
    name: p.displayName?.text || 'Unnamed place',
    address: p.formattedAddress || '',
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    class: p.primaryType || (p.types && p.types[0]) || '',
    type: p.primaryType || '',
  }))
}

async function searchOsm(query, signal) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '8')

  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Place search failed (${res.status})`)
  const data = await res.json()
  return (data || []).map((p) => ({
    id: `osm_${p.osm_type}_${p.osm_id}`,
    name: p.name || p.display_name?.split(',')[0] || 'Unnamed place',
    address: p.display_name || '',
    lat: Number(p.lat),
    lng: Number(p.lon),
    class: p.class || '',
    type: p.type || '',
  }))
}

// Convenience re-export so callers can categorize a search result.
export { guessCategory }
