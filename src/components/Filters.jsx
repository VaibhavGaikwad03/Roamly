import { CATEGORIES } from '../lib/categories.js'

// Status + category filtering, plus a live text filter over saved places.
export default function Filters({
  status,
  onStatusChange,
  activeCategories,
  onToggleCategory,
  onClearCategories,
  search,
  onSearchChange,
  counts,
}) {
  return (
    <div className="filters">
      <div className="segmented">
        {[
          ['all', 'All', counts.all],
          ['want', 'Want', counts.want],
          ['visited', 'Visited', counts.visited],
        ].map(([value, label, n]) => (
          <button
            key={value}
            className={status === value ? 'active' : ''}
            onClick={() => onStatusChange(value)}
          >
            {label} · {n}
          </button>
        ))}
      </div>

      <div className="search">
        <svg
          className="search__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Filter your saved places…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Filter saved places by name"
        />
      </div>

      <div className="chips">
        {CATEGORIES.map((c) => {
          const active = activeCategories.includes(c.id)
          return (
            <button
              key={c.id}
              className={`chip ${active ? 'active' : ''}`}
              style={
                active
                  ? { borderColor: c.color, background: `${c.color}1f`, color: 'var(--ink)' }
                  : undefined
              }
              onClick={() => onToggleCategory(c.id)}
              aria-pressed={active}
            >
              <span>{c.icon}</span> {c.label}
            </button>
          )
        })}
        {activeCategories.length > 0 && (
          <button className="chip chip--clear" onClick={onClearCategories}>
            Clear ✕
          </button>
        )}
      </div>
    </div>
  )
}
