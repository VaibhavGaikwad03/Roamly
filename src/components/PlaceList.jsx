import { getCategory } from '../lib/categories.js'

// The scrollable list of saved places. Clicking a row focuses it on the map.
export default function PlaceList({
  places,
  selectedId,
  onSelect,
  onStatusToggle,
  onDelete,
  emptyHint,
}) {
  if (places.length === 0) {
    return <p className="list__empty">{emptyHint}</p>
  }

  return (
    <ul className="list">
      {places.map((place) => {
        const cat = getCategory(place.category)
        return (
          <li
            key={place.id}
            className={`card ${selectedId === place.id ? 'card--active' : ''}`}
            onClick={() => onSelect(place.id)}
          >
            <span className="card__dot" style={{ background: cat.color }}>
              {cat.icon}
            </span>
            <div className="card__body">
              <div className="card__top">
                <strong className="card__name">{place.name}</strong>
                <span className={`badge badge--${place.status}`}>
                  {place.status === 'visited' ? 'Visited' : 'Want to visit'}
                </span>
              </div>
              {place.address && <p className="card__addr">{place.address}</p>}
              <div className="card__foot">
                <span className="card__cat">{cat.label}</span>
                {place.notes && <span className="card__note">· {place.notes}</span>}
              </div>
            </div>
            <div className="card__actions" onClick={(e) => e.stopPropagation()}>
              <button
                title={place.status === 'visited' ? 'Mark want-to-visit' : 'Mark visited'}
                onClick={() => onStatusToggle(place.id)}
              >
                {place.status === 'visited' ? '↩' : '✓'}
              </button>
              <button title="Delete" className="danger" onClick={() => onDelete(place.id)}>
                ✕
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
