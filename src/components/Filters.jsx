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
      <div className="segmented segmented--full">
        {[
          ['all', `All (${counts.all})`],
          ['want', `Want to visit (${counts.want})`],
          ['visited', `Visited (${counts.visited})`],
        ].map(([value, label]) => (
          <button
            key={value}
            className={status === value ? 'active' : ''}
            onClick={() => onStatusChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        type="search"
        className="filters__text"
        placeholder="Filter saved places…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Filter saved places by name"
      />

      <div className="chips">
        {CATEGORIES.map((c) => {
          const active = activeCategories.includes(c.id)
          return (
            <button
              key={c.id}
              className={`chip ${active ? 'chip--active' : ''}`}
              style={active ? { borderColor: c.color, background: `${c.color}1a` } : undefined}
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
