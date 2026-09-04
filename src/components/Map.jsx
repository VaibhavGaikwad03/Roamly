import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getCategory } from '../lib/categories.js'
import { scene } from '../lib/scenes.js'

// Build a colored pin marker as an inline SVG data URL, avoiding Leaflet's
// default marker-image loading issues under bundlers.
function makeIcon(place, active) {
  const cat = getCategory(place.category)
  const ring = place.status === 'visited' ? '#ffffff' : '#fde68a'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 37" width="28" height="37">
      <path d="M14 36C14 36 26 22 26 13A12 12 0 1 0 2 13C2 22 14 36 14 36Z"
            fill="${cat.color}" stroke="${ring}" stroke-width="2"/>
      <circle cx="14" cy="13" r="7" fill="#ffffff"/>
      <text x="14" y="17" font-size="9" text-anchor="middle">${cat.icon}</text>
    </svg>`
  return L.divIcon({
    className: `roamly-marker${active ? ' is-active' : ''}`,
    html: svg,
    iconSize: [28, 37],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  })
}

// Imperatively fly the map to whichever place is currently selected.
function FlyToSelected({ place }) {
  const map = useMap()
  useEffect(() => {
    if (place)
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 13), { duration: 0.8 })
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
    map.fitBounds(bounds, { padding: [70, 70], maxZoom: 13 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

// A single marker + popup. Opens its popup automatically when it becomes the
// selected place (so choosing a place from the list opens it on the map too).
function PlaceMarker({ place, active, onSelect, onStatusToggle, onDelete }) {
  const markerRef = useRef(null)
  const cat = getCategory(place.category)

  useEffect(() => {
    if (active && markerRef.current) markerRef.current.openPopup()
  }, [active])

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={makeIcon(place, active)}
      eventHandlers={{ click: () => onSelect(place.id) }}
    >
      <Popup>
        <div className="popup__img">
          <div className="popup__scene" dangerouslySetInnerHTML={{ __html: scene(place.category) }} />
          <span className={`badge badge--${place.status} popup__badge-float`}>
            {place.status === 'visited' ? 'Visited' : 'Want'}
          </span>
          <div className="popup__name">{place.name}</div>
        </div>
        <div className="popup__body">
          {place.address && <div className="popup__addr">{place.address}</div>}
          <div className="popup__meta">
            <span className="popup__cat">
              <i style={{ background: cat.color }} />
              {cat.label}
            </span>
          </div>
          {place.notes && <p className="popup__notes">{place.notes}</p>}
          <div className="popup__row">
            <button className="btn btn--ghost" onClick={() => onStatusToggle(place.id)}>
              {place.status === 'visited' ? '↩ Want to visit' : '✓ Mark visited'}
            </button>
            <button
              className="btn btn--ghost"
              style={{ flex: '0 0 auto' }}
              onClick={() => onDelete(place.id)}
            >
              ✕
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
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
      zoomControl={false}
      className="map"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topright" />

      <FitToPlaces places={places} />
      <FlyToSelected place={selected} />

      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          active={place.id === selectedId}
          onSelect={onSelect}
          onStatusToggle={onStatusToggle}
          onDelete={onDelete}
        />
      ))}
    </MapContainer>
  )
}
