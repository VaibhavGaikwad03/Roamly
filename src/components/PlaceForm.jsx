import { useEffect, useRef, useState } from 'react'
import { searchPlaces, searchProvider, reverseGeocode, guessCategory } from '../lib/places.js'
import { parseGoogleMapsUrl, isGoogleMapsShortLink } from '../lib/googleMaps.js'
import { CATEGORIES, getCategory } from '../lib/categories.js'

// Search for a place — by name/keyword or by pasting a Google Maps link —
// then add it to the tracker with a category, status, and notes.
export default function PlaceForm({ onAdd }) {
  const [mode, setMode] = useState('search') // search | link
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [draft, setDraft] = useState(null)
  const abortRef = useRef(null)

  // Debounced keyword search whenever the query changes and no result is chosen.
  useEffect(() => {
    if (draft || mode !== 'search') return
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setError('')
      return
    }
    setLoading(true)
    setError('')
    const handle = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const found = await searchPlaces(q, { signal: controller.signal })
        setResults(found)
        if (found.length === 0) setError('No matching places found.')
      } catch (err) {
        if (err.name !== 'AbortError') setError('Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [query, draft, mode])

  function chooseResult(result) {
    setDraft({
      name: result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
      category: guessCategory(result),
      status: 'want',
      notes: '',
    })
    setResults([])
  }

  async function addFromLink(e) {
    e.preventDefault()
    const raw = link.trim()
    if (!raw) return
    setLinkError('')

    const parsed = parseGoogleMapsUrl(raw)
    if (!parsed) {
      setLinkError('Couldn’t read that. Paste a Google Maps place link or "lat, lng".')
      return
    }
    if (parsed.shortLink) {
      setLinkError(
        'Short links (maps.app.goo.gl) can’t be opened here. Open it in Google Maps, then copy the full URL from the address bar.',
      )
      return
    }

    setLinkLoading(true)
    try {
      if (parsed.lat != null && parsed.lng != null) {
        // Coordinates in hand — reverse-geocode for a readable name/address.
        const info = await reverseGeocode(parsed.lat, parsed.lng).catch(() => null)
        setDraft({
          name: parsed.name || info?.name || 'Dropped pin',
          address: info?.address || '',
          lat: parsed.lat,
          lng: parsed.lng,
          category: guessCategory(info || {}),
          status: 'want',
          notes: '',
        })
      } else if (parsed.name) {
        // Only a name — forward-geocode it.
        const found = await searchPlaces(parsed.name)
        if (found.length === 0) {
          setLinkError(`Couldn’t locate “${parsed.name}”. Try the Search tab.`)
          return
        }
        chooseResult(found[0])
      }
      setLink('')
    } catch {
      setLinkError('Could not look that place up. Please try again.')
    } finally {
      setLinkLoading(false)
    }
  }

  function reset() {
    setDraft(null)
    setQuery('')
    setResults([])
    setError('')
    setLink('')
    setLinkError('')
  }

  function submit(e) {
    e.preventDefault()
    if (!draft) return
    onAdd(draft)
    reset()
  }

  return (
    <div className="panel">
      <div className="panel__title">Add a place</div>

      {!draft && (
        <>
          <div className="segmented" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={mode === 'search' ? 'active' : ''}
              onClick={() => setMode('search')}
            >
              🔎 Search
            </button>
            <button
              type="button"
              className={mode === 'link' ? 'active' : ''}
              onClick={() => setMode('link')}
            >
              🔗 Google link
            </button>
          </div>

          {mode === 'search' && (
            <>
              <div className="search">
                <svg
                  className="search__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={query}
                  placeholder="Search a place, city, or landmark…"
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  aria-label="Search for a place"
                />
                {loading && <span className="search__spinner" aria-hidden="true" />}
              </div>
              <p className="search__hint">
                Searching with{' '}
                {searchProvider === 'google' ? 'Google Places' : 'OpenStreetMap'}.
              </p>

              {error && <p className="form__error">{error}</p>}

              {results.length > 0 && (
                <ul className="results">
                  {results.map((r) => {
                    const cat = getCategory(guessCategory(r))
                    return (
                      <li key={r.id}>
                        <button className="results__item" onClick={() => chooseResult(r)}>
                          <span
                            className="results__icon"
                            style={{ background: `${cat.color}22`, color: cat.color }}
                          >
                            {cat.icon}
                          </span>
                          <span className="results__text">
                            <strong>{r.name}</strong>
                            <small>{r.address}</small>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}

          {mode === 'link' && (
            <form onSubmit={addFromLink}>
              <div className="search">
                <svg
                  className="search__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                  <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                </svg>
                <input
                  type="text"
                  value={link}
                  placeholder="Paste a Google Maps link…"
                  onChange={(e) => setLink(e.target.value)}
                  autoComplete="off"
                  aria-label="Google Maps link"
                />
                {linkLoading && <span className="search__spinner" aria-hidden="true" />}
              </div>
              <p className="search__hint">
                {isGoogleMapsShortLink(link)
                  ? 'Tip: open the short link, then copy the full URL from the address bar.'
                  : 'Paste a maps.google.com place link — or plain “lat, lng”.'}
              </p>
              {linkError && <p className="form__error">{linkError}</p>}
              <div className="row">
                <button type="submit" className="btn btn--primary" disabled={linkLoading}>
                  {linkLoading ? 'Looking up…' : 'Find place'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {draft && (
        <form onSubmit={submit}>
          <div className="draft__head">
            <span
              className="draft__pin"
              style={{ background: getCategory(draft.category).color }}
            >
              {getCategory(draft.category).icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <strong>{draft.name}</strong>
              {draft.address && <small>{draft.address}</small>}
            </div>
          </div>

          <label className="field">
            <span>Category</span>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon}  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>Status</span>
            <div className="segmented">
              <button
                type="button"
                className={draft.status === 'want' ? 'active' : ''}
                onClick={() => setDraft({ ...draft, status: 'want' })}
              >
                ✦ Want to visit
              </button>
              <button
                type="button"
                className={draft.status === 'visited' ? 'active' : ''}
                onClick={() => setDraft({ ...draft, status: 'visited' })}
              >
                ✓ Visited
              </button>
            </div>
          </div>

          <label className="field">
            <span>
              Notes <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(optional)</span>
            </span>
            <textarea
              rows={2}
              value={draft.notes}
              placeholder="A memory, a tip, a reason to go…"
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>

          <div className="row">
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Add to atlas
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
