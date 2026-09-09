// Sidebar entry points for the "generate" AI features. When AI isn't set up it
// invites the user to connect their own key instead. `enabled` reflects whether
// the signed-in account has a Groq key on file (resolved in App).
export default function AiPanel({ enabled, onRecommend, onPlan, onOpenSettings }) {
  return (
    <section className="ai-panel">
      <div className="ai-panel__title">✨ Roamly AI</div>
      {enabled ? (
        <>
          <div className="ai-actions">
            <button className="btn btn--ai" onClick={onRecommend}>
              Suggest places
            </button>
            <button className="btn btn--ghost" onClick={onPlan}>
              Plan a trip
            </button>
          </div>
          <p className="ai-panel__manage">
            Using your Groq key · <button onClick={onOpenSettings}>manage</button>
          </p>
        </>
      ) : (
        <>
          <p className="ai-setup">
            Add your own Groq API key to unlock smart add, place insights,
            recommendations, and trip planning.
          </p>
          <div className="ai-actions" style={{ marginTop: 11 }}>
            <button className="btn btn--ai" onClick={onOpenSettings}>
              ✨ Connect AI
            </button>
          </div>
        </>
      )}
    </section>
  )
}
