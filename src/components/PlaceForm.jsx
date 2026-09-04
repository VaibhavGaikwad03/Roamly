import { useEffect, useRef, useState } from 'react'
import { searchPlaces, searchProvider, guessCategory } from '../lib/places.js'
import { CATEGORIES, getCategory } from '../lib/categories.js'

// Search for a place and add it to the tracker.
// The user searches, picks a result, tweaks category/status/notes, and saves.
export default function PlaceForm({ onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(null)
  const abortRef = useRef(null)

  // Debounced search whenever the query changes and no result is chosen yet.
  useEffect(() => {
    if (draft) return
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
  }, [query, draft])

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

  function reset() {
    setDraft(null)
    setQuery('')
    setResults([])
    setError('')
  }

  function submit(e) {
    e.preventDefault()
    if (!draft) return
    onAdd(draft)
    reset()
  }

  return (
    <div className="panel">
      <h2 className="panel__title">Add a place</h2>

      {!draft && (
        <>
          <div className="search">
            <input
              type="text"
              value={query}
              placeholder="Search for a place, city, or landmark…"
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
              {results.map((r) => (
                <li key={r.id}>
                  <button className="results__item" onClick={() => chooseResult(r)}>
                    <span className="results__icon">{getCategory(guessCategory(r)).icon}</span>
                    <span className="results__text">
                      <strong>{r.name}</strong>
                      <small>{r.address}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {draft && (
        <form className="draft" onSubmit={submit}>
          <div className="draft__head">
            <strong>{draft.name}</strong>
            {draft.address && <small>{draft.address}</small>}
          </div>

          <label className="field">
            <span>Category</span>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
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
                Want to visit
              </button>
              <button
                type="button"
                className={draft.status === 'visited' ? 'active' : ''}
                onClick={() => setDraft({ ...draft, status: 'visited' })}
              >
                Visited
              </button>
            </div>
          </div>

          <label className="field">
            <span>Notes (optional)</span>
            <textarea
              rows={2}
              value={draft.notes}
              placeholder="Anything worth remembering…"
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>

          <div className="draft__actions">
            <button type="button" className="ghost" onClick={reset}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Add place
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
