import { useState } from 'react'
import { verifyGroqKey } from '../lib/ai.js'
import {
  getGroqKey,
  setGroqKey,
  maskedGroqKey,
  getProfileName,
  setProfileName,
} from '../lib/settings.js'

// Per-user AI setup: the user brings their own Groq key, stored in this
// browser and used to call Groq directly. This is the "connect AI" screen the
// key-separation feature is built around.
export default function SettingsModal({ onClose, onSaved }) {
  const [name, setName] = useState(getProfileName())
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState(null) // { type, msg }
  const [busy, setBusy] = useState(false)
  const hadKey = Boolean(getGroqKey())

  async function save(verify) {
    const trimmed = key.trim()
    setProfileName(name.trim())

    // Saving with an empty field but a key already present just keeps it.
    if (!trimmed && hadKey) {
      onSaved()
      onClose()
      return
    }
    if (!trimmed) {
      setStatus({ type: 'error', msg: 'Enter your Groq API key first.' })
      return
    }

    setBusy(true)
    setStatus(null)
    try {
      if (verify) {
        const r = await verifyGroqKey(trimmed)
        if (!r.ok) {
          setStatus({ type: 'error', msg: r.error })
          return
        }
        if (r.warn) setStatus({ type: 'ok', msg: r.warn })
      }
      setGroqKey(trimmed)
      onSaved()
      if (verify) {
        setStatus({ type: 'ok', msg: 'Key verified and saved.' })
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

          <p className="ai-setup">
            Get a free key at{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
              console.groq.com/keys
            </a>
            . It's stored only on this device and sent straight to Groq — never to
            us. <b>Account login with cross-device sync is planned.</b>
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
