// Local persistence for the user's saved places.
// Everything lives in the browser's localStorage so the app works
// fully client-side with no backend or account required.
const STORAGE_KEY = 'roamly.places.v1'

export function loadPlaces() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('Could not read saved places:', err)
    return []
  }
}

export function savePlaces(places) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places))
  } catch (err) {
    console.warn('Could not persist places:', err)
  }
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
