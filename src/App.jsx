import { useEffect, useMemo, useState } from 'react'
import Map from './components/Map.jsx'
import PlaceForm from './components/PlaceForm.jsx'
import Filters from './components/Filters.jsx'
import PlaceList from './components/PlaceList.jsx'
import { loadPlaces, savePlaces, createId } from './lib/storage.js'

export default function App() {
  const [places, setPlaces] = useState(() => loadPlaces())
  const [selectedId, setSelectedId] = useState(null)
  const [status, setStatus] = useState('all') // all | want | visited
  const [activeCategories, setActiveCategories] = useState([])
  const [search, setSearch] = useState('')

  // Persist whenever the collection changes.
  useEffect(() => {
    savePlaces(places)
  }, [places])

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
        <header className="brand">
          <span className="brand__mark">🗺️</span>
          <div>
            <h1 className="brand__name">Roamly</h1>
            <p className="brand__tag">Track the places you love & the ones you'll go next</p>
          </div>
        </header>

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

        <div className="list__wrap">
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

        <footer className="sidebar__foot">
          {counts.all} place{counts.all === 1 ? '' : 's'} saved · stored in your browser
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
      </main>
    </div>
  )
}
