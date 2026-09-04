// Central definition of the categories a place can belong to.
// Each entry drives the filter chips, the add form, the list badges,
// and the colored markers on the map.
export const CATEGORIES = [
  { id: 'trek', label: 'Trek', icon: '🥾', color: '#a16207' },
  { id: 'nature', label: 'Nature', icon: '🌲', color: '#16a34a' },
  { id: 'waterfall', label: 'Waterfall', icon: '💦', color: '#06b6d4' },
  { id: 'fort', label: 'Fort / Heritage', icon: '🏰', color: '#9a3412' },
  { id: 'beach', label: 'Beach', icon: '🏖️', color: '#f59e0b' },
  { id: 'viewpoint', label: 'Viewpoint', icon: '🌄', color: '#ea580c' },
  { id: 'spiritual', label: 'Spiritual', icon: '🛕', color: '#7c3aed' },
  { id: 'city', label: 'City / Town', icon: '🏙️', color: '#64748b' },
  { id: 'food', label: 'Food', icon: '🍽️', color: '#ef4444' },
  { id: 'stay', label: 'Stay', icon: '🏨', color: '#6366f1' },
  { id: 'wildlife', label: 'Wildlife', icon: '🐾', color: '#65a30d' },
  { id: 'camping', label: 'Camping', icon: '🏕️', color: '#059669' },
  { id: 'lake', label: 'Lake / Dam', icon: '🏞️', color: '#0891b2' },
  { id: 'caves', label: 'Caves', icon: '🗿', color: '#78716c' },
  { id: 'adventure', label: 'Adventure', icon: '🎢', color: '#db2777' },
  { id: 'sunset', label: 'Sunrise / Sunset', icon: '🌅', color: '#fb923c' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// Fallback category for unknown ids.
const DEFAULT_ID = 'city'

// Places saved under the app's previous category set are remapped so old pins
// still show a sensible category after this taxonomy change.
const LEGACY = {
  restaurant: 'food',
  cafe: 'food',
  bar: 'food',
  hotel: 'stay',
  attraction: 'viewpoint',
  museum: 'fort',
  shopping: 'city',
  other: 'city',
}

export function getCategory(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP[LEGACY[id]] || CATEGORY_MAP[DEFAULT_ID]
}

// Best-effort mapping from an OpenStreetMap / Google Places result "class",
// "type", or "category" onto one of our categories, so searched places get a
// sensible default.
export function guessCategory(result) {
  const hay = `${result?.class || ''} ${result?.type || ''} ${
    result?.category || ''
  }`.toLowerCase()

  const rules = [
    ['waterfall', ['waterfall']],
    ['caves', ['cave', 'cave_entrance']],
    ['beach', ['beach', 'coast', 'shore']],
    ['spiritual', ['place_of_worship', 'temple', 'shrine', 'monastery', 'church', 'mosque', 'gurudwara', 'hindu', 'buddhist']],
    ['fort', ['castle', 'fort', 'ruins', 'monument', 'memorial', 'archaeolog', 'heritage', 'citadel', 'palace', 'museum', 'gallery']],
    ['camping', ['camp_site', 'camping', 'campground', 'caravan']],
    ['stay', ['hotel', 'hostel', 'guest_house', 'motel', 'resort', 'lodging', 'apartment', 'chalet']],
    ['food', ['restaurant', 'fast_food', 'cafe', 'coffee', 'food', 'bar', 'pub', 'biergarten', 'bakery', 'ice_cream']],
    ['wildlife', ['zoo', 'wildlife', 'national_park', 'nature_reserve', 'safari', 'aviary', 'sanctuary']],
    ['lake', ['water', 'lake', 'reservoir', 'dam', 'pond', 'wetland', 'bay', 'lagoon', 'river']],
    ['viewpoint', ['viewpoint', 'peak', 'saddle', 'cliff', 'ridge', 'volcano']],
    ['trek', ['trail', 'path', 'hiking', 'trailhead', 'via_ferrata', 'footway']],
    ['nature', ['park', 'forest', 'wood', 'garden', 'natural', 'meadow', 'grassland', 'valley']],
    ['adventure', ['theme_park', 'attraction', 'water_park', 'amusement', 'stadium', 'sports', 'climbing', 'pitch']],
    ['city', ['city', 'town', 'village', 'suburb', 'neighbourhood', 'square', 'market', 'mall', 'shop', 'hamlet']],
  ]

  for (const [id, keywords] of rules) {
    if (keywords.some((k) => hay.includes(k))) return id
  }
  return DEFAULT_ID
}
