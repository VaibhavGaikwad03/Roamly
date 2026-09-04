# 🗺️ Roamly — Travel Places Tracker

Roamly is a web app for keeping track of the places you've been and the ones
you want to explore next. Search for a place, drop it on an interactive map,
mark it **visited** or **want to visit**, and filter your collection by
category.

![Roamly](public/favicon.svg)

## Features

- **🔎 Search places** — type a place, city, or landmark and pick from live
  search results. Uses **Google Places** when an API key is configured, and
  falls back to **OpenStreetMap** so it works with zero setup.
- **➕ Add places** — save any result with a category, a visited / want-to-visit
  status, and personal notes.
- **🗺️ Interactive map** — every place shows as a colored, category-coded pin.
  Click a pin (or a list item) to focus it; the map flies to your selection and
  fits itself to your whole collection.
- **✅ Track status** — flip any place between **Visited** and **Want to visit**
  in one click, from the list or the map popup.
- **🏷️ Filter by category** — restaurants, cafés, hotels, attractions, nature,
  beaches, museums, shopping, bars, and more. Combine category chips with a
  status filter and a live text search.
- **💾 Persistent** — everything is saved in your browser's `localStorage`, so
  your places are still there when you come back. No account, no backend.

## Tech stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Leaflet](https://leafletjs.com/) via
  [react-leaflet](https://react-leaflet.js.org/) for the interactive map
- [OpenStreetMap](https://www.openstreetmap.org/) tiles & Nominatim search
  (default), with optional [Google Places](https://developers.google.com/maps/documentation/places/web-service)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

### Optional: Google Places search

By default Roamly searches with OpenStreetMap and needs no configuration. To
use Google Places instead:

1. Create a **browser** (HTTP-referrer restricted) API key with the
   **Places API (New)** enabled.
2. Copy `.env.example` to `.env` and set the key:
   ```
   VITE_GOOGLE_PLACES_KEY=your_key_here
   ```
3. Restart `npm run dev`.

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the dev server               |
| `npm run build`   | Build for production into `dist/`  |
| `npm run preview` | Preview the production build       |

## Project structure

```
src/
  App.jsx              # App shell + state (places, filters, selection)
  components/
    Map.jsx            # Leaflet map with category-colored pins & popups
    PlaceForm.jsx      # Search + add-a-place form
    Filters.jsx        # Status / category / text filtering
    PlaceList.jsx      # Scrollable list of saved places
  lib/
    places.js          # Search provider (Google Places / OpenStreetMap)
    categories.js      # Category definitions + auto-categorization
    storage.js         # localStorage persistence
```
