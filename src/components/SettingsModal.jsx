import { useState } from 'react'
import { verifyGroqKey, DEFAULT_MODEL } from '../lib/ai.js'
import {
  getGroqKey,
  setGroqKey,
  maskedGroqKey,
  getGroqModel,
  setGroqModel,
  getProfileName,
  setProfileName,
} from '../lib/settings.js'

// A short list of common Groq models. Availability varies by account, so the
// user can also type a custom id; the full list is at
// https://console.groq.com/docs/models
const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B — versatile (default)' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — instant (fastest)' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
  { id: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2' },
  { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill 70B' },
]

export default function SettingsModal({ onClose, onSaved }) {
  const [name, setName] = useState(getProfileName())
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)

  const savedModel = getGroqModel() || DEFAULT_MODEL
  const known = MODELS.some((m) => m.id === savedModel)
  const [modelChoice, setModelChoice] = useState(known ? savedModel : '__custom__')
  const [customModel, setCustomModel] = useState(known ? '' : savedModel)

  const [status, setStatus] = useState(null) // { type, msg }
  const [busy, setBusy] = useState(false)
  const hadKey = Boolean(getGroqKey())

  function resolvedModel() {
    return modelChoice === '__custom__' ? customModel.trim() : modelChoice
  }

  async function save(verify) {
    const trimmed = key.trim()
    const chosenModel = resolvedModel()
    setProfileName(name.trim())
    setGroqModel(chosenModel && chosenModel !== DEFAULT_MODEL ? chosenModel : '')

    const effectiveKey = trimmed || getGroqKey()
    if (!effectiveKey) {
      setStatus({ type: 'error', msg: 'Enter your Groq API key first.' })
      return
    }

    setBusy(true)
    setStatus(null)
    try {
      if (verify) {
        const r = await verifyGroqKey(effectiveKey, chosenModel || DEFAULT_MODEL)
        if (!r.ok) {
          setStatus({ type: 'error', msg: r.error })
          return
        }
        if (r.warn) setStatus({ type: 'ok', msg: r.warn })
      }
      if (trimmed) setGroqKey(trimmed)
      onSaved()
      if (verify) {
        setStatus({ type: 'ok', msg: 'Key and model verified — saved.' })
        setTimeout(onClose, 700)
      } else {
        onClose()
      }
    } finally {
      setBusy(false)
    }
  }

  function clearKey() {
    setGroqKey('')
    setKey('')
    onSaved()
    setStatus({ type: 'ok', msg: 'Key removed from this browser.' })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__head">
          <div className="modal__title">
            ✨ Connect AI
            <small>Bring your own Groq key — it stays in this browser.</small>
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
              {hadKey && (
                <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>
                  · saved ({maskedGroqKey()})
                </span>
              )}
            </span>
            <div className="key-row">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                placeholder={hadKey ? 'Enter a new key to replace it…' : 'gsk_…'}
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
            . Stored only on this device. <b>Account sync is planned.</b>
          </p>

          {status && (
            <p className={status.type === 'error' ? 'form__error' : 'form__ok'}>
              {status.msg}
            </p>
          )}

          <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              {hadKey && (
                <button type="button" className="btn btn--ghost" onClick={clearKey}>
                  Remove key
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => save(false)}
                disabled={busy}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn--ai"
                onClick={() => save(true)}
                disabled={busy}
              >
                {busy ? 'Verifying…' : 'Verify & save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
