import { useEffect, useState } from 'react'
import { verifyGroqKey, DEFAULT_MODEL } from '../lib/ai.js'
import {
  getProfileName,
  setProfileName,
  getAiStatus,
  setAiCredentials,
  clearAiCredentials,
} from '../lib/settings.js'

// A short list of common Groq models. Availability varies by account, so the
// user can also type a custom id; the full list is at
// https://console.groq.com/docs/models
const MODELS = [
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B — fast (default)' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B — most capable' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B — versatile' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — instant' },
  { id: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2' },
  { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill 70B' },
]

export default function SettingsModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [modelChoice, setModelChoice] = useState(DEFAULT_MODEL)
  const [customModel, setCustomModel] = useState('')
  const [status, setStatus] = useState(null) // { type, msg }
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load current profile name + AI status (has a key? which model?).
  useEffect(() => {
    let active = true
    Promise.all([getProfileName(), getAiStatus()]).then(([n, ai]) => {
      if (!active) return
      setName(n || '')
      setHasKey(ai.hasKey)
      const savedModel = ai.model || DEFAULT_MODEL
      const known = MODELS.some((m) => m.id === savedModel)
      setModelChoice(known ? savedModel : '__custom__')
      setCustomModel(known ? '' : savedModel)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  function resolvedModel() {
    return modelChoice === '__custom__' ? customModel.trim() : modelChoice
  }

  async function save(verify) {
    const trimmed = key.trim()
    const chosenModel = resolvedModel()

    if (!trimmed && !hasKey) {
      setStatus({ type: 'error', msg: 'Enter your Groq API key first.' })
      return
    }

    setBusy(true)
    setStatus(null)
    try {
      // We can only verify a key we currently hold in the browser — i.e. a
      // freshly typed one. If none was typed, there's nothing to verify.
      if (verify && trimmed) {
        const r = await verifyGroqKey(trimmed, chosenModel || DEFAULT_MODEL)
        if (!r.ok) {
          setStatus({ type: 'error', msg: r.error })
          return
        }
        if (r.warn) setStatus({ type: 'ok', msg: r.warn })
      }

      await setProfileName(name.trim())
      // Empty key keeps the existing one; model is always updated.
      await setAiCredentials(trimmed, chosenModel === DEFAULT_MODEL ? '' : chosenModel)

      onSaved()
      if (verify && trimmed) {
        setStatus({ type: 'ok', msg: 'Key and model verified — saved to your account.' })
        setTimeout(onClose, 800)
      } else {
        onClose()
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Could not save. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function clearKey() {
    setBusy(true)
    try {
      await clearAiCredentials()
      setHasKey(false)
      setKey('')
      onSaved()
      setStatus({ type: 'ok', msg: 'Key removed from your account.' })
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Could not remove key.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__head">
          <div className="modal__title">
            ✨ Connect AI
            <small>Your Groq key is stored securely on your account — never in the browser.</small>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal__body">
          <label className="field">
            <span>Your name (optional)</span>
            <input
              type="text"
              value={name}
              placeholder="Traveler"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span>
              Groq API key{' '}
              {hasKey && (
                <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>
                  · key on file
                </span>
              )}
            </span>
            <div className="key-row">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                placeholder={hasKey ? 'Enter a new key to replace it…' : 'gsk_…'}
                autoComplete="off"
                spellCheck="false"
                onChange={(e) => setKey(e.target.value)}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShow((s) => !s)}
                title={show ? 'Hide' : 'Show'}
                aria-label={show ? 'Hide key' : 'Show key'}
              >
                {show ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          <label className="field">
            <span>Model</span>
            <select value={modelChoice} onChange={(e) => setModelChoice(e.target.value)}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
          </label>
          {modelChoice === '__custom__' && (
            <label className="field">
              <span>Custom model id</span>
              <input
                type="text"
                value={customModel}
                placeholder="e.g. llama-3.1-70b-versatile"
                autoComplete="off"
                spellCheck="false"
                onChange={(e) => setCustomModel(e.target.value)}
              />
            </label>
          )}

          <p className="ai-setup">
            Free key at{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
              console.groq.com/keys
            </a>
            . If a model returns 404 it isn't enabled for your key — pick another or
            see the{' '}
            <a href="https://console.groq.com/docs/models" target="_blank" rel="noreferrer">
              model list
            </a>
            . Stored server-side and used only for your account's AI requests.
          </p>

          {status && (
            <p className={status.type === 'error' ? 'form__error' : 'form__ok'}>{status.msg}</p>
          )}

          <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              {hasKey && (
                <button type="button" className="btn btn--ghost" onClick={clearKey} disabled={busy}>
                  Remove key
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => save(false)}
                disabled={busy || !loaded}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn--ai"
                onClick={() => save(true)}
                disabled={busy || !loaded}
              >
                {busy ? 'Working…' : 'Verify & save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
