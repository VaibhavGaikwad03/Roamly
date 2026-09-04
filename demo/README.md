# Roamly — Hosted Demo

`index.html` is a **single-file, zero-dependency** version of Roamly you can open
directly in any browser (just double-click it) or host on any static site.

It exists because a locked-down hosted sandbox can't reach live map tiles or the
Places API, so this demo:

- draws the world map in-page (hand-drawn SVG, no external tiles), and
- searches a built-in atlas of ~50 famous destinations instead of a live API.

Everything else mirrors the full app: add places, mark visited / want-to-visit,
category filtering, an interactive pan/zoom map with fly-to, illustrated
category "postcard" thumbnails, light/dark themes, and browser persistence.

> The **full application** (React + Vite with live OpenStreetMap / Google Places
> search and real map tiles) lives at the repository root — run it with
> `npm install && npm run dev`.
