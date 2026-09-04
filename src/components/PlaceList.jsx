import { getCategory } from '../lib/categories.js'
import { scene } from '../lib/scenes.js'

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
    return (
      <div className="empty">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <p>{emptyHint}</p>
      </div>
    )
  }

  return (
    <ul className="list">
      {places.map((place) => {
        const cat = getCategory(place.category)
        return (
          <li
            key={place.id}
            className={`card ${selectedId === place.id ? 'active' : ''}`}
            onClick={() => onSelect(place.id)}
          >
            <span className="card__thumb">
              <span dangerouslySetInnerHTML={{ __html: scene(place.category) }} />
              <span className="card__emoji">{cat.icon}</span>
            </span>
            <div className="card__body">
              <div className="card__top">
                <span className="card__name">{place.name}</span>
                <span className={`badge badge--${place.status}`}>
                  {place.status === 'visited' ? 'Visited' : 'Want'}
                </span>
              </div>
              {place.address && <p className="card__addr">{place.address}</p>}
              <div className="card__foot">
                <span className="card__cat">
                  <i style={{ background: cat.color }} />
                  {cat.label}
                </span>
                {place.notes && <span className="card__note">· {place.notes}</span>}
              </div>
            </div>
            <div className="card__actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="icon-btn"
                title={place.status === 'visited' ? 'Mark want-to-visit' : 'Mark visited'}
                onClick={() => onStatusToggle(place.id)}
              >
                {place.status === 'visited' ? '↩' : '✓'}
              </button>
              <button
                className="icon-btn danger"
                title="Delete"
                onClick={() => onDelete(place.id)}
              >
                ✕
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
