// Flat "postcard" scene illustrations, keyed by category.
// Rendered inline as SVG (via dangerouslySetInnerHTML) so they need no image
// assets and work anywhere — used for card thumbnails, the map popup header,
// and the sidebar hero banner.
const SCENE_TYPE = {
  beach: 'beach',
  nature: 'mountains',
  attraction: 'landmark',
  museum: 'museum',
  hotel: 'city',
  shopping: 'city',
  cafe: 'cafe',
  restaurant: 'cafe',
  bar: 'night',
  other: 'hills',
}

const SCENES = {
  beach: `<rect width="120" height="80" fill="#bfe6ef"/><circle cx="92" cy="22" r="12" fill="#ffd166"/>
    <path d="M0 50h120v30H0z" fill="#57c4bd"/><path d="M0 58q30 8 60 0t60 0v22H0z" fill="#f0e0bd"/>
    <path d="M20 58q4-16 2-24 6 6 10 5-8 2-8 19z" fill="#2f8a7c"/><path d="M0 50q30 7 60 0t60 0v6q-30 7-60 0T0 56z" fill="#3fb4ac"/>`,
  mountains: `<rect width="120" height="80" fill="#d3ede2"/><circle cx="30" cy="24" r="10" fill="#ffe08a"/>
    <path d="M0 80 40 34l24 30 18-20 38 36z" fill="#a9dcc4"/><path d="M52 80 84 40l36 40z" fill="#63b58f"/>
    <path d="M0 80 34 44l26 36z" fill="#3f9c76"/><path d="M40 34l7 9-7 5-6-5z" fill="#f4fbf7"/><path d="M84 40l6 8-6 4-5-4z" fill="#f4fbf7"/>`,
  landmark: `<rect width="120" height="80" fill="#f6d9cf"/><circle cx="26" cy="24" r="10" fill="#ffb37a"/>
    <path d="M60 12l10 56H50z" fill="#6d4b63"/><path d="M55 34h10M52 50h16" stroke="#f6d9cf" stroke-width="3"/>
    <path d="M0 68h120v12H0z" fill="#caa2ab"/><path d="M60 12l3 8h-6z" fill="#8a6079"/>`,
  museum: `<rect width="120" height="80" fill="#deeaf6"/><path d="M20 34 60 18l40 16z" fill="#c3d2e6"/>
    <rect x="24" y="34" width="72" height="30" fill="#eef4fb"/>
    <g fill="#c9d7e8"><rect x="30" y="38" width="6" height="26"/><rect x="44" y="38" width="6" height="26"/><rect x="58" y="38" width="6" height="26"/><rect x="72" y="38" width="6" height="26"/><rect x="86" y="38" width="6" height="26"/></g>
    <rect x="18" y="64" width="84" height="16" fill="#b7c7dd"/>`,
  city: `<rect width="120" height="80" fill="#dbe9f2"/><circle cx="94" cy="24" r="10" fill="#ffe08a"/>
    <g fill="#5f7186"><rect x="10" y="40" width="18" height="40"/><rect x="34" y="28" width="16" height="52"/><rect x="56" y="46" width="16" height="34"/><rect x="78" y="34" width="18" height="46"/><rect x="100" y="50" width="14" height="30"/></g>
    <g fill="#ffd27a"><rect x="38" y="34" width="3" height="4"/><rect x="44" y="34" width="3" height="4"/><rect x="38" y="42" width="3" height="4"/><rect x="44" y="42" width="3" height="4"/><rect x="82" y="40" width="3" height="4"/><rect x="88" y="40" width="3" height="4"/><rect x="82" y="48" width="3" height="4"/></g>`,
  cafe: `<rect width="120" height="80" fill="#f3e3d2"/><path d="M0 30h120v8H0z" fill="#c65b4e"/>
    <path d="M0 38h120l-6 10H6z" fill="#e0e6e2"/><g fill="#c65b4e"><rect x="6" y="38" width="10" height="10"/><rect x="26" y="38" width="10" height="10"/><rect x="46" y="38" width="10" height="10"/><rect x="66" y="38" width="10" height="10"/><rect x="86" y="38" width="10" height="10"/><rect x="106" y="38" width="8" height="10"/></g>
    <rect x="0" y="48" width="120" height="32" fill="#efe6da"/><rect x="46" y="54" width="28" height="26" fill="#b6836a"/>
    <path d="M18 60h14v8a7 7 0 0 1-14 0z" fill="#7a5545"/><path d="M32 62h4a3 3 0 0 1 0 6h-4" fill="none" stroke="#7a5545" stroke-width="2"/>`,
  night: `<rect width="120" height="80" fill="#2c2350"/><circle cx="90" cy="20" r="8" fill="#f6e27a"/>
    <g fill="#fff" opacity="0.8"><circle cx="20" cy="16" r="1"/><circle cx="40" cy="10" r="1"/><circle cx="60" cy="20" r="1"/><circle cx="110" cy="30" r="1"/><circle cx="30" cy="30" r="1"/></g>
    <g fill="#4a3b6b"><rect x="8" y="46" width="20" height="34"/><rect x="36" y="36" width="16" height="44"/><rect x="60" y="50" width="18" height="30"/><rect x="86" y="42" width="20" height="38"/></g>
    <g fill="#ff9e7a"><rect x="14" y="52" width="3" height="4"/><rect x="20" y="52" width="3" height="4"/><rect x="41" y="44" width="3" height="4"/><rect x="47" y="44" width="3" height="4"/><rect x="92" y="50" width="3" height="4"/><rect x="98" y="50" width="3" height="4"/></g>`,
  hills: `<rect width="120" height="80" fill="#d9efe6"/><circle cx="90" cy="24" r="11" fill="#ffe08a"/>
    <path d="M0 60q30-16 60 0t60 0v20H0z" fill="#8ccfb0"/><path d="M0 68q34-12 60 2t60-2v12H0z" fill="#57ab86"/>`,
}

export function scene(categoryId) {
  const svg = SCENES[SCENE_TYPE[categoryId] || 'hills']
  return `<svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${svg}</svg>`
}

export const HERO = `<svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="rmly-hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9b0"/><stop offset="0.55" stop-color="#f7b591"/><stop offset="1" stop-color="#7fc7bd"/></linearGradient></defs>
  <rect width="400" height="150" fill="url(#rmly-hsky)"/>
  <circle cx="300" cy="58" r="30" fill="#ffce7e"/><circle cx="300" cy="58" r="46" fill="#ffce7e" opacity="0.25"/>
  <path d="M0 150 90 78l60 42 50-40 90 70 110-58v56z" fill="#5bb6a8" opacity="0.85"/>
  <path d="M0 150 70 96l70 30 70-34 80 44 110-30v44z" fill="#3f9a8c"/>
  <path d="M0 122q100 26 200 0t200 0v28H0z" fill="#2f7f77"/>
  <g fill="#fff" opacity="0.7"><path d="M60 40l4 4 4-4-4-4z"/><path d="M78 34l4 4 4-4-4-4z"/></g>
  <g stroke="#fbe7c8" stroke-width="2" fill="none" opacity="0.7"><path d="M110 30q6-5 12 0"/><path d="M124 30q6-5 12 0"/></g>
</svg>`
