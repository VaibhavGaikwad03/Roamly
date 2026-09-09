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
- **👤 Accounts & sync** — sign up with an email and password; your places sync
  across every device you sign in on.
- **💾 Persistent** — everything is saved to a **Supabase** (Postgres) database,
  scoped to your account by row-level security. Theme is remembered per device.

## Setup — accounts & database (required)

Roamly uses [Supabase](https://supabase.com) for accounts and data. One-time setup:

1. **Create a free Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** In the project's **SQL Editor**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) and **Run**. This creates the
   `profiles`, `places`, and `ai_credentials` tables with row-level security
   and the AI-credential functions.
3. **Get your keys** from **Project Settings → API**: the **Project URL** and
   the **anon public** key.
4. **Configure the app.** Copy `.env.example` to `.env` and set:
   ```
   VITE_SUPABASE_URL=<your project URL>
   VITE_SUPABASE_ANON_KEY=<your anon public key>
   ```
   Then run `npm install && npm run dev`.
5. **For AI on a deploy** (Netlify), also set these **server-side** env vars in
   the Netlify dashboard (plain, not `VITE_`): `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (the **service_role**
   secret from the same API page). These let the AI proxy read each user's key
   server-side; the key is never exposed to the browser.

The anon key is safe to expose in the browser — row-level security ensures each
user can only read and write their own rows.

## AI setup (optional)

### Bring your own key — stored securely on your account

Each user connects their **own** Groq key from inside the app: click
**✨ Connect AI** (sidebar) or **🔑 AI key** (footer), paste a key from
[console.groq.com/keys](https://console.groq.com/keys), and **Verify & save**.
The key is stored **server-side on your account** (never in the browser after
setup); AI requests go through a serverless function that reads it with the
service role and calls Groq. Each user uses their own key and quota.

> Saved places and the AI key now sync per account via Supabase; access stays
> isolated behind `src/lib/settings.js` and `src/lib/storage.js` so a
> backend can slot in there without touching the rest of the app.

AI runs only where the serverless function is available (a Netlify deploy, or
`netlify dev` locally). All AI calls route through one module (`src/lib/ai.js`)
and the proxy (`netlify/functions/ai.mjs`), so the transport is in one place.

## Deploying to Netlify

This repo is Netlify-ready: `netlify.toml` sets the build (`npm run build` →
`dist`) and maps `/api/ai` to the serverless function
(`netlify/functions/ai.mjs`), which resolves each signed-in user's Groq key
server-side and forwards to Groq.

1. Connect the repo in Netlify (build settings come from `netlify.toml`).
2. In **Site settings → Environment variables**, add both the browser-safe and
   server-only Supabase values:
   ```
   VITE_SUPABASE_URL          = https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY     = <anon public key>
   SUPABASE_URL               = https://<project>.supabase.co
   SUPABASE_ANON_KEY          = <anon public key>
   SUPABASE_SERVICE_ROLE_KEY  = <service_role secret>   # server-only, no VITE_
   ```
   Never give the service role key a `VITE_` prefix — that would bundle the
   secret into the public page.
3. Deploy. Users sign up / sign in, and their places and AI key live in your
   Supabase project. AI requests hit `/api/ai`; the key never reaches the client.

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
