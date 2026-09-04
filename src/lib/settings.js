// Per-user settings — currently the user's own Groq API key and an optional
// display name, stored in this browser.
//
// This module is the seam for a future backend: today it reads/writes
// localStorage, but every caller goes through these functions, so swapping in
// a DB-backed, per-account implementation later (key + places synced across
// devices) is a change here, not across the app.
const KEY_STORAGE = 'roamly.groq.key'
const NAME_STORAGE = 'roamly.profile.name'

export function getGroqKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setGroqKey(value) {
  try {
    if (value) localStorage.setItem(KEY_STORAGE, value)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* ignore */
  }
}

export function hasGroqKey() {
  return Boolean(getGroqKey())
}

// A short, masked preview for the settings UI (never the full key).
export function maskedGroqKey() {
  const k = getGroqKey()
  if (!k) return ''
  return k.length <= 10 ? '••••' : `${k.slice(0, 4)}••••${k.slice(-4)}`
}

export function getProfileName() {
  try {
    return localStorage.getItem(NAME_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setProfileName(value) {
  try {
    if (value) localStorage.setItem(NAME_STORAGE, value)
    else localStorage.removeItem(NAME_STORAGE)
  } catch {
    /* ignore */
  }
}
