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
- **🔗 Add via Google Maps link** — paste a Google Maps URL (or plain
  `lat, lng`) and Roamly extracts the location. Short links are detected with a
  hint to paste the full URL.
- **✨ AI features (optional)** — powered by [Groq](https://groq.com/):
  - **Smart add** — describe a place in plain language ("that rooftop bar in
    Bangkok I want to try"); AI names it and Roamly geocodes it to a real pin.
  - **Place insights** — an AI blurb per place: what it's known for, best time
    to visit, a tip.
  - **Recommendations** — suggestions based on where you've been, one-tap to add.
  - **Trip planner** — turns your want-to-visit list into a day-by-day itinerary.
- **💾 Persistent** — everything is saved in your browser's `localStorage`, so
  your places are still there when you come back. No account, no backend.

## AI setup (optional)

The AI features are hidden until you configure a provider. Copy `.env.example`
to `.env` and set **one** of:

```
# Local / personal — calls Groq directly from the browser (simplest).
# Free key: https://console.groq.com/keys
VITE_GROQ_API_KEY=your_key_here

# — or, for a public deployment — point at your own serverless proxy that
#   holds the key server-side, keeping it out of the shipped page:
VITE_AI_PROXY_URL=https://your-proxy.example/ai
```

> ⚠️ A `VITE_GROQ_API_KEY` is bundled into the built page, so it's visible to
> anyone who loads the site. That's fine for **local / personal** use. For a
> **public** deployment, use the serverless proxy below so the key stays
> server-side. All AI calls route through one module (`src/lib/ai.js`), so
> switching is a config change, not a code change.

## Deploying to Netlify (with the AI key kept server-side)

This repo is Netlify-ready: `netlify.toml` sets the build (`npm run build` →
`dist`), wires `VITE_AI_PROXY_URL=/api/ai`, and a serverless function
(`netlify/functions/ai.mjs`) proxies AI calls to Groq using a server-side key.

1. Connect the repo in Netlify (build settings come from `netlify.toml`).
2. In **Site settings → Environment variables**, add:
   ```
   GROQ_API_KEY = your_groq_key      # server-side only — no VITE_ prefix
   ```
   Do **not** set `VITE_GROQ_API_KEY` in Netlify — that would bundle the key
   into the public page. Leave it unset; the proxy handles AI in production.
3. Deploy. The browser calls `/api/ai`, the function adds the key and forwards
   to Groq, and the key never reaches the client.

> Because `VITE_AI_PROXY_URL` is set at build time, the AI features light up
> automatically once `GROQ_API_KEY` is present on the server.

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
