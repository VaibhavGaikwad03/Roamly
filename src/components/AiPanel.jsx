import { aiEnabled } from '../lib/ai.js'

// Sidebar entry points for the "generate" AI features. When AI isn't
// configured it shows a short setup hint instead of the buttons.
export default function AiPanel({ onRecommend, onPlan }) {
  return (
    <section className="ai-panel">
      <div className="ai-panel__title">✨ Roamly AI</div>
      {aiEnabled() ? (
        <div className="ai-actions">
          <button className="btn btn--ai" onClick={onRecommend}>
            Suggest places
          </button>
          <button className="btn btn--ghost" onClick={onPlan}>
            Plan a trip
          </button>
        </div>
      ) : (
        <p className="ai-setup">
          Add a <code>VITE_GROQ_API_KEY</code> to a <code>.env</code> file to enable
          smart add, place insights, recommendations, and trip planning.
        </p>
      )}
    </section>
  )
}
