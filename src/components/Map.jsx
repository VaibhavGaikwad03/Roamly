import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getCategory } from '../lib/categories.js'

// Build a colored pin marker using an inline SVG data URL, so we avoid
// Leaflet's default marker-image loading issues under bundlers entirely.
function makeIcon(category, status) {
  const cat = getCategory(category)
  const visited = status === 'visited'
  const ring = visited ? '#0ea5a4' : '#f59e0b'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <path d="M17 45C17 45 32 27 32 16A15 15 0 1 0 2 16C2 27 17 45 17 45Z"
            fill="${cat.color}" stroke="${ring}" stroke-width="3"/>
      <circle cx="17" cy="16" r="10" fill="#ffffff"/>
      <text x="17" y="21" font-size="12" text-anchor="middle">${cat.icon}</text>
    </svg>`
  return L.divIcon({
    className: 'roamly-marker',
    html: svg,
    iconSize: [34, 46],
    iconAnchor: [17, 45],
    popupAnchor: [0, -40],
  })
}

// Imperatively fly the map to whichever place is currently selected.
function FlyToSelected({ place }) {
  const map = useMap()
  useEffect(() => {
    if (place) map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 13), {
      duration: 0.8,
    })
  }, [place, map])
  return null
}

// Fit the map to show all places the first time some exist.
function FitToPlaces({ places }) {
  const map = useMap()
  const key = places.map((p) => p.id).join(',')
  useEffect(() => {
    if (places.length === 0) return
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

export default function Map({ places, selectedId, onSelect, onStatusToggle, onDelete }) {
  const selected = useMemo(
    () => places.find((p) => p.id === selectedId) || null,
    [places, selectedId],
  )

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      className="map"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitToPlaces places={places} />
      <FlyToSelected place={selected} />

      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={makeIcon(place.category, place.status)}
          eventHandlers={{ click: () => onSelect(place.id) }}
        >
          <Popup>
            <div className="popup">
              <strong className="popup__name">{place.name}</strong>
              {place.address && <div className="popup__addr">{place.address}</div>}
              <div className="popup__meta">
                <span>{getCategory(place.category).icon} {getCategory(place.category).label}</span>
                <span className={`badge badge--${place.status}`}>
                  {place.status === 'visited' ? 'Visited' : 'Want to visit'}
                </span>
              </div>
              {place.notes && <p className="popup__notes">{place.notes}</p>}
              <div className="popup__actions">
                <button onClick={() => onStatusToggle(place.id)}>
                  {place.status === 'visited' ? 'Mark want-to-visit' : 'Mark visited'}
                </button>
                <button className="danger" onClick={() => onDelete(place.id)}>
                  Delete
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
