import { useEffect, useState } from 'react'
import { recommendPlaces, planTrip } from '../lib/ai.js'
import { searchPlaces } from '../lib/places.js'
import { getCategory } from '../lib/categories.js'
import { scene } from '../lib/scenes.js'

// A modal for the two "generate something" AI features: recommendations and
// the trip planner. It fetches on open and manages its own loading/error state.
export default function AiModal({ kind, places, onClose, onAddPlace }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recs, setRecs] = useState([])
  const [plan, setPlan] = useState(null)
  const [addedNames, setAddedNames] = useState({}) // name -> 'adding' | 'done'

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        if (kind === 'recommend') {
          const list = await recommendPlaces(places)
          if (!cancelled) setRecs(list)
        } else {
          const result = await planTrip(places)
          if (!cancelled) setPlan(result)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [kind, places])

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function addRecommendation(rec) {
    if (addedNames[rec.name]) return
    setAddedNames((m) => ({ ...m, [rec.name]: 'adding' }))
    try {
      const found = await searchPlaces(rec.name)
      if (found.length === 0) {
        setAddedNames((m) => ({ ...m, [rec.name]: 'fail' }))
        return
      }
      const r = found[0]
      onAddPlace({
        name: r.name,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        category: rec.category || getCategory(rec.category).id,
        status: 'want',
        notes: rec.reason || '',
      })
      setAddedNames((m) => ({ ...m, [rec.name]: 'done' }))
    } catch {
      setAddedNames((m) => ({ ...m, [rec.name]: 'fail' }))
    }
  }

  const title = kind === 'recommend' ? 'Places you might love' : 'Your trip plan'
  const subtitle =
    kind === 'recommend'
      ? 'Suggested from where you’ve been — tap ＋ to add.'
      : 'Built from your want-to-visit list.'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__head">
          <div className="modal__title">
            ✨ {title}
            <small>{subtitle}</small>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal__body">
          {loading && (
            <div className="modal__loading">
              <span className="mini-spinner" />
              {kind === 'recommend' ? 'Finding places for you…' : 'Planning your trip…'}
            </div>
          )}

          {!loading && error && <div className="modal__error">{error}</div>}

          {!loading && !error && kind === 'recommend' && (
            recs.length === 0 ? (
              <p className="ai-setup">No suggestions came back — try again in a moment.</p>
            ) : (
              recs.map((rec, i) => {
                const cat = getCategory(rec.category)
                const state = addedNames[rec.name]
                return (
                  <div className="rec" key={i}>
                    <span
                      className="rec__thumb"
                      dangerouslySetInnerHTML={{ __html: scene(rec.category) }}
                    />
                    <div className="rec__body">
                      <div className="rec__name">
                        {cat.icon} {rec.name}
                      </div>
                      {rec.reason && <div className="rec__reason">{rec.reason}</div>}
                    </div>
                    <button
                      className="btn btn--ghost rec__add"
                      data-added={state === 'done' ? 1 : 0}
                      disabled={state === 'adding' || state === 'done'}
                      onClick={() => addRecommendation(rec)}
                    >
                      {state === 'adding'
                        ? '…'
                        : state === 'done'
                          ? '✓ Added'
                          : state === 'fail'
                            ? 'Retry'
                            : '＋ Add'}
                    </button>
                  </div>
                )
              })
            )
          )}

          {!loading && !error && kind === 'plan' && (
            !plan || !plan.days?.length ? (
              <p className="ai-setup">
                Add a few <b>want-to-visit</b> places first, then I can plan a route.
              </p>
            ) : (
              <div>
                {plan.title && <div className="itin__title">{plan.title}</div>}
                {plan.days.map((day, i) => (
                  <div className="itin-day" key={i}>
                    <div className="itin-day__head">
                      <span className="itin-day__num">{day.day ?? i + 1}</span>
                      <span className="itin-day__theme">{day.theme || `Day ${i + 1}`}</span>
                    </div>
                    {(day.stops || []).map((stop, j) => (
                      <div className="itin-stop" key={j}>
                        <b>{stop.name}</b>
                        {stop.why && <span>— {stop.why}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
