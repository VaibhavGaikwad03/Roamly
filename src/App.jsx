import { useEffect, useMemo, useState } from 'react'
import Map from './components/Map.jsx'
import PlaceForm from './components/PlaceForm.jsx'
import Filters from './components/Filters.jsx'
import PlaceList from './components/PlaceList.jsx'
import { CATEGORIES } from './lib/categories.js'
import { HERO } from './lib/scenes.js'
import { loadPlaces, savePlaces, createId } from './lib/storage.js'

function getInitialTheme() {
  try {
    return localStorage.getItem('roamly.theme') || ''
  } catch {
    return ''
  }
}

export default function App() {
  const [places, setPlaces] = useState(() => loadPlaces())
  const [selectedId, setSelectedId] = useState(null)
  const [status, setStatus] = useState('all') // all | want | visited
  const [activeCategories, setActiveCategories] = useState([])
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState(getInitialTheme)
  const [view, setView] = useState('map') // mobile: map | list

  // Persist places.
  useEffect(() => {
    savePlaces(places)
  }, [places])

  // Apply + persist theme.
  useEffect(() => {
    const root = document.documentElement
    if (theme) root.setAttribute('data-theme', theme)
    else root.removeAttribute('data-theme')
    try {
      if (theme) localStorage.setItem('roamly.theme', theme)
      else localStorage.removeItem('roamly.theme')
    } catch {
      /* ignore */
    }
  }, [theme])

  // Reflect mobile view on <body> for CSS.
  useEffect(() => {
    document.body.dataset.view = view
  }, [view])

  function toggleTheme() {
    const isDark =
      theme === 'dark' ||
      (theme === '' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setTheme(isDark ? 'light' : 'dark')
  }

  function addPlace(draft) {
    const place = { id: createId(), createdAt: Date.now(), ...draft }
    setPlaces((prev) => [place, ...prev])
    setSelectedId(place.id)
  }

  function toggleStatus(id) {
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'visited' ? 'want' : 'visited' }
          : p,
      ),
    )
  }

  function deletePlace(id) {
    setPlaces((prev) => prev.filter((p) => p.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
  }

  function toggleCategory(id) {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const counts = useMemo(
    () => ({
      all: places.length,
      want: places.filter((p) => p.status === 'want').length,
      visited: places.filter((p) => p.status === 'visited').length,
    }),
    [places],
  )

  const pct = counts.all ? Math.round((counts.visited / counts.all) * 100) : 0

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return places.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (activeCategories.length > 0 && !activeCategories.includes(p.category))
        return false
      if (term) {
        const hay = `${p.name} ${p.address} ${p.notes || ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [places, status, activeCategories, search])

  const hasFilters =
    status !== 'all' || activeCategories.length > 0 || search.trim() !== ''

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__scroll">
          <div className="hero">
            <div className="hero__bg" dangerouslySetInnerHTML={{ __html: HERO }} />
            <header className="brand">
              <span className="brand__mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    fill="#ffffff"
                  />
                  <circle cx="12" cy="9" r="2.6" fill="#0f766e" />
                </svg>
              </span>
              <div>
                <h1 className="brand__name">Roamly</h1>
                <p className="brand__tag">Your atlas of places loved &amp; longed for</p>
              </div>
            </header>
          </div>

          <div className="progress">
            <div className="progress__top">
              <span className="progress__lead">Your travels</span>
              <span className="progress__pct">{pct}% explored</span>
            </div>
            <div className="progress__bignum">
              {counts.visited}
              <small> of {counts.all} places visited</small>
            </div>
            <div className="progress__bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="progress__meta">
              <span>
                <i style={{ background: '#fff' }} />
                {counts.visited} visited
              </span>
              <span>
                <i style={{ background: 'rgba(255,255,255,.5)' }} />
                {counts.want} want to visit
              </span>
            </div>
          </div>

          <PlaceForm onAdd={addPlace} />

          <Filters
            status={status}
            onStatusChange={setStatus}
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
            onClearCategories={() => setActiveCategories([])}
            search={search}
            onSearchChange={setSearch}
            counts={counts}
          />

          <div className="list-head">
            <span>Saved places</span>
          </div>
          <div className="list-wrap">
            <PlaceList
              places={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStatusToggle={toggleStatus}
              onDelete={deletePlace}
              emptyHint={
                places.length === 0
                  ? 'No places yet — search above to add your first one.'
                  : hasFilters
                    ? 'No places match these filters.'
                    : 'No places to show.'
              }
            />
          </div>
        </div>

        <footer className="foot">
          <span>
            {counts.all} place{counts.all === 1 ? '' : 's'} · saved in your browser
          </span>
          <button className="theme-toggle" onClick={toggleTheme}>
            ◑ Theme
          </button>
        </footer>
      </aside>

      <main className="map__wrap">
        <Map
          places={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onStatusToggle={toggleStatus}
          onDelete={deletePlace}
        />
        <div className="legend">
          <b>Categories</b>
          {CATEGORIES.map((c) => (
            <span key={c.id} style={{ color: c.color }}>
              <i />
              <span style={{ color: 'var(--ink-soft)' }}>{c.label}</span>
            </span>
          ))}
        </div>
      </main>

      <div className="mobile-tab">
        <button
          className={view === 'list' ? 'active' : ''}
          onClick={() => setView('list')}
        >
          Places
        </button>
        <button
          className={view === 'map' ? 'active' : ''}
          onClick={() => setView('map')}
        >
          Map
        </button>
      </div>
    </div>
  )
}
