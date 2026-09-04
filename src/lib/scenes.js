// Flat "postcard" scene illustrations, keyed by category.
// Rendered inline as SVG (via dangerouslySetInnerHTML) so they need no image
// assets and work anywhere — used for card thumbnails, the map popup header,
// and the sidebar hero banner.
const SCENE_TYPE = {
  trek: 'mountains',
  nature: 'forest',
  waterfall: 'waterfall',
  fort: 'fort',
  beach: 'beach',
  viewpoint: 'hills',
  spiritual: 'temple',
  city: 'city',
  food: 'food',
  stay: 'stay',
  wildlife: 'forest',
  camping: 'camping',
  lake: 'lake',
  caves: 'caves',
  adventure: 'adventure',
  sunset: 'sunset',
}

const SCENES = {
  mountains: `<rect width="120" height="80" fill="#d3ede2"/><circle cx="30" cy="24" r="10" fill="#ffe08a"/>
    <path d="M0 80 40 34l24 30 18-20 38 36z" fill="#a9dcc4"/><path d="M52 80 84 40l36 40z" fill="#63b58f"/>
    <path d="M0 80 34 44l26 36z" fill="#3f9c76"/><path d="M40 34l7 9-7 5-6-5z" fill="#f4fbf7"/><path d="M84 40l6 8-6 4-5-4z" fill="#f4fbf7"/>`,
  hills: `<rect width="120" height="80" fill="#d9efe6"/><circle cx="90" cy="24" r="11" fill="#ffe08a"/>
    <path d="M0 60q30-16 60 0t60 0v20H0z" fill="#8ccfb0"/><path d="M0 68q34-12 60 2t60-2v12H0z" fill="#57ab86"/>`,
  forest: `<rect width="120" height="80" fill="#dff2e6"/><circle cx="98" cy="20" r="8" fill="#ffe08a"/>
    <rect y="60" width="120" height="20" fill="#6fbf95"/>
    <g><path d="M16 62 26 40 36 62z" fill="#2f8a5f"/><path d="M20 62 26 48 32 62z" fill="#256e4b"/><rect x="24" y="62" width="4" height="6" fill="#6b4a2b"/></g>
    <g><path d="M48 64 60 34 72 64z" fill="#317f56"/><path d="M52 64 60 44 68 64z" fill="#245c3f"/><rect x="58" y="64" width="4" height="7" fill="#6b4a2b"/></g>
    <g><path d="M84 62 94 40 104 62z" fill="#2f8a5f"/><rect x="92" y="62" width="4" height="6" fill="#6b4a2b"/></g>`,
  waterfall: `<rect width="120" height="80" fill="#cfe9ef"/>
    <path d="M0 0h46v80H0z" fill="#5e7d6b"/><path d="M74 0h46v80H74z" fill="#587560"/>
    <path d="M0 0h46v80H0z" fill="#4a6a58" opacity="0.4"/>
    <rect x="46" width="28" height="70" fill="#eaf6fb"/>
    <g stroke="#cfe6ef" stroke-width="1.4"><line x1="52" y1="6" x2="52" y2="66"/><line x1="60" y1="4" x2="60" y2="66"/><line x1="68" y1="6" x2="68" y2="66"/></g>
    <rect y="66" width="120" height="14" fill="#3fb4ac"/><path d="M46 66q14 6 28 0" fill="none" stroke="#eaf6fb" stroke-width="3"/>`,
  fort: `<rect width="120" height="80" fill="#f1e3c8"/><circle cx="98" cy="20" r="9" fill="#ffcf7a"/>
    <path d="M0 60h120v20H0z" fill="#8f7b52"/>
    <rect x="14" y="34" width="92" height="26" fill="#b39468"/>
    <g fill="#b39468"><rect x="14" y="26" width="10" height="10"/><rect x="30" y="26" width="10" height="10"/><rect x="46" y="26" width="10" height="10"/><rect x="64" y="26" width="10" height="10"/><rect x="80" y="26" width="10" height="10"/><rect x="96" y="26" width="10" height="10"/></g>
    <rect x="8" y="30" width="16" height="30" fill="#9c815a"/><rect x="96" y="30" width="16" height="30" fill="#9c815a"/>
    <path d="M52 60v-14a8 8 0 0 1 16 0v14z" fill="#5f4a2e"/>`,
  temple: `<rect width="120" height="80" fill="#fbe6cc"/><circle cx="24" cy="22" r="9" fill="#ffcf7a"/>
    <rect y="66" width="120" height="14" fill="#e6cfa8"/>
    <rect x="44" y="42" width="32" height="24" fill="#d98a3d"/>
    <path d="M44 42q16-34 32 0z" fill="#c26f2b"/>
    <circle cx="60" cy="12" r="3.2" fill="#f2c14e"/><rect x="59" y="14" width="2" height="6" fill="#f2c14e"/>
    <rect x="56" y="52" width="8" height="14" fill="#8a4f22"/>`,
  city: `<rect width="120" height="80" fill="#dbe9f2"/><circle cx="94" cy="24" r="10" fill="#ffe08a"/>
    <g fill="#5f7186"><rect x="10" y="40" width="18" height="40"/><rect x="34" y="28" width="16" height="52"/><rect x="56" y="46" width="16" height="34"/><rect x="78" y="34" width="18" height="46"/><rect x="100" y="50" width="14" height="30"/></g>
    <g fill="#ffd27a"><rect x="38" y="34" width="3" height="4"/><rect x="44" y="34" width="3" height="4"/><rect x="38" y="42" width="3" height="4"/><rect x="44" y="42" width="3" height="4"/><rect x="82" y="40" width="3" height="4"/><rect x="88" y="40" width="3" height="4"/><rect x="82" y="48" width="3" height="4"/></g>`,
  food: `<rect width="120" height="80" fill="#f3e3d2"/><path d="M0 30h120v8H0z" fill="#c65b4e"/>
    <path d="M0 38h120l-6 10H6z" fill="#e0e6e2"/><g fill="#c65b4e"><rect x="6" y="38" width="10" height="10"/><rect x="26" y="38" width="10" height="10"/><rect x="46" y="38" width="10" height="10"/><rect x="66" y="38" width="10" height="10"/><rect x="86" y="38" width="10" height="10"/><rect x="106" y="38" width="8" height="10"/></g>
    <rect y="48" width="120" height="32" fill="#efe6da"/>
    <circle cx="60" cy="64" r="13" fill="#fff"/><circle cx="60" cy="64" r="8" fill="#d8b25f"/>
    <rect x="40" y="57" width="2" height="14" fill="#9a8467"/><rect x="78" y="57" width="2" height="14" fill="#9a8467"/>`,
  stay: `<rect width="120" height="80" fill="#dfeaf2"/><circle cx="24" cy="20" r="8" fill="#ffe08a"/>
    <rect x="28" y="24" width="64" height="56" fill="#6b7f92"/><rect x="28" y="24" width="64" height="8" fill="#516378"/>
    <g fill="#ffd27a"><rect x="36" y="38" width="8" height="8"/><rect x="52" y="38" width="8" height="8"/><rect x="68" y="38" width="8" height="8"/><rect x="36" y="52" width="8" height="8"/><rect x="52" y="52" width="8" height="8"/><rect x="68" y="52" width="8" height="8"/></g>
    <rect x="54" y="66" width="12" height="14" fill="#3f4d5c"/>`,
  camping: `<rect width="120" height="80" fill="#33507a"/><circle cx="94" cy="20" r="8" fill="#f6ecc0"/>
    <g fill="#fff" opacity="0.8"><circle cx="22" cy="16" r="1"/><circle cx="44" cy="10" r="1"/><circle cx="66" cy="18" r="1"/><circle cx="108" cy="30" r="1"/></g>
    <rect y="64" width="120" height="16" fill="#2c3d2a"/>
    <path d="M20 60 30 40 40 60z" fill="#33795a"/><rect x="28" y="46" width="4" height="14" fill="#5a3d24"/>
    <path d="M52 66 72 40 92 66z" fill="#e07a5f"/><path d="M72 40 72 66" stroke="#b85842" stroke-width="3"/><path d="M66 66 72 54 78 66z" fill="#8f3f30"/>`,
  lake: `<rect width="120" height="80" fill="#dbeef0"/><circle cx="92" cy="20" r="9" fill="#ffe08a"/>
    <path d="M0 48 30 22 54 48z" fill="#8fbfd6"/><path d="M36 48 74 16 112 48z" fill="#5f97b8"/>
    <path d="M30 22l6 8-6 4-5-4z" fill="#eef6fb"/><path d="M74 16l7 9-7 5-6-5z" fill="#eef6fb"/>
    <rect y="48" width="120" height="32" fill="#4cc0cf"/><g stroke="#bfeef2" stroke-width="1.4" opacity="0.7"><line x1="18" y1="58" x2="40" y2="58"/><line x1="70" y1="64" x2="98" y2="64"/></g>`,
  caves: `<rect width="120" height="80" fill="#c3b39a"/><rect y="70" width="120" height="10" fill="#8a7a63"/>
    <path d="M26 80Q26 38 60 38t34 42z" fill="#2a2632"/>
    <g fill="#3a3542"><path d="M46 38l3 9 3-9z"/><path d="M60 38l3 12 3-12z"/><path d="M72 39l2 8 3-8z"/></g>
    <circle cx="60" cy="66" r="5" fill="#5b5468"/>`,
  adventure: `<rect width="120" height="80" fill="#cfeaf5"/>
    <g fill="#fff" opacity="0.85"><ellipse cx="24" cy="24" rx="12" ry="6"/><ellipse cx="98" cy="18" rx="10" ry="5"/></g>
    <path d="M60 8c-14 0-20 15-20 24 0 8 8 14 20 26 12-12 20-18 20-26 0-9-6-24-20-24z" fill="#ec4899"/>
    <path d="M60 8c-5 0-8 15-8 24 0 8 3 16 8 26 5-10 8-18 8-26 0-9-3-24-8-24z" fill="#f9a8d4" opacity="0.7"/>
    <path d="M52 46l8 12 8-12" fill="none" stroke="#a83a6f" stroke-width="1.5"/>
    <rect x="55" y="58" width="10" height="8" fill="#8a5a2b"/><rect y="70" width="120" height="10" fill="#7fc7a0"/>`,
  sunset: `<rect width="120" height="80" fill="#ff9e6d"/><rect width="120" height="34" fill="#ffbe86"/>
    <rect width="120" height="16" fill="#ffd9a0"/>
    <circle cx="60" cy="42" r="17" fill="#ffe08a"/><circle cx="60" cy="42" r="26" fill="#ffe08a" opacity="0.25"/>
    <rect y="54" width="120" height="26" fill="#c85a54"/>
    <g stroke="#ffcf9c" stroke-width="2" opacity="0.8"><line x1="52" y1="60" x2="68" y2="60"/><line x1="48" y1="66" x2="72" y2="66"/><line x1="52" y1="72" x2="68" y2="72"/></g>`,
  beach: `<rect width="120" height="80" fill="#bfe6ef"/><circle cx="92" cy="22" r="12" fill="#ffd166"/>
    <path d="M0 50h120v30H0z" fill="#57c4bd"/><path d="M0 58q30 8 60 0t60 0v22H0z" fill="#f0e0bd"/>
    <path d="M20 58q4-16 2-24 6 6 10 5-8 2-8 19z" fill="#2f8a7c"/><path d="M0 50q30 7 60 0t60 0v6q-30 7-60 0T0 56z" fill="#3fb4ac"/>`,
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
