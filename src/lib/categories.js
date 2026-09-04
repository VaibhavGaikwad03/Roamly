// Central definition of the categories a place can belong to.
// Each entry drives the filter chips, the add form, the list badges,
// and the colored markers on the map.
export const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️', color: '#ef4444' },
  { id: 'cafe', label: 'Café', icon: '☕', color: '#b45309' },
  { id: 'bar', label: 'Bar & Nightlife', icon: '🍸', color: '#a855f7' },
  { id: 'hotel', label: 'Hotel & Stay', icon: '🛏️', color: '#6366f1' },
  { id: 'attraction', label: 'Attraction', icon: '🎡', color: '#ec4899' },
  { id: 'museum', label: 'Museum & Art', icon: '🏛️', color: '#0891b2' },
  { id: 'nature', label: 'Nature & Park', icon: '🌲', color: '#16a34a' },
  { id: 'beach', label: 'Beach', icon: '🏖️', color: '#eab308' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#f97316' },
  { id: 'other', label: 'Other', icon: '📍', color: '#64748b' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other
}

// Best-effort mapping from an OpenStreetMap / search result "class" or "type"
// onto one of our categories, so searched places get a sensible default.
export function guessCategory(result) {
  const hay = `${result?.class || ''} ${result?.type || ''} ${
    result?.category || ''
  }`.toLowerCase()

  const rules = [
    ['restaurant', ['restaurant', 'food', 'fast_food']],
    ['cafe', ['cafe', 'coffee']],
    ['bar', ['bar', 'pub', 'nightclub', 'biergarten']],
    ['hotel', ['hotel', 'hostel', 'guest_house', 'motel', 'tourism.*hotel']],
    ['museum', ['museum', 'gallery', 'artwork', 'arts_centre']],
    ['nature', ['park', 'forest', 'wood', 'nature', 'garden', 'peak', 'natural']],
    ['beach', ['beach', 'coast']],
    ['shopping', ['shop', 'mall', 'supermarket', 'store', 'marketplace']],
    ['attraction', ['attraction', 'viewpoint', 'monument', 'castle', 'theme_park', 'zoo', 'tourism']],
  ]

  for (const [id, keywords] of rules) {
    if (keywords.some((k) => new RegExp(k).test(hay))) return id
  }
  return 'other'
}
