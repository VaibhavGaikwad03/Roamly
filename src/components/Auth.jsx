import { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { HERO } from '../lib/scenes.js'

// Full-screen gate shown when nobody is signed in. Toggles between signing in
// and creating an account; both run through the Supabase auth context.
export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null) // { type, msg }

  const isSignup = mode === 'signup'

  async function submit(e) {
    e.preventDefault()
    setStatus(null)
    if (!email.trim() || !password) {
      setStatus({ type: 'error', msg: 'Enter your email and password.' })
      return
    }
    if (isSignup && password.length < 6) {
      setStatus({ type: 'error', msg: 'Password must be at least 6 characters.' })
      return
    }
    setBusy(true)
    try {
      if (isSignup) {
        const { error, needsConfirmation } = await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
        })
        if (error) {
          setStatus({ type: 'error', msg: error.message })
        } else if (needsConfirmation) {
          setStatus({
            type: 'ok',
            msg: 'Check your inbox to confirm your email, then sign in.',
          })
          setMode('signin')
        }
        // On success with a session, the auth listener swaps in the app.
      } else {
        const { error } = await signIn({ email: email.trim(), password })
        if (error) setStatus({ type: 'error', msg: error.message })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__art" aria-hidden="true">
        <div className="auth__scene" dangerouslySetInnerHTML={{ __html: HERO }} />
        <div className="auth__art-copy">
          <div className="auth__logo">
            <span className="brand__mark">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#ffffff"
                />
                <circle cx="12" cy="9" r="2.6" fill="#0f766e" />
              </svg>
            </span>
            <span className="auth__wordmark">Roamly</span>
          </div>
          <h2 className="auth__tagline">
            Every place you’ve loved, and every one you’re longing for — on one map.
          </h2>
        </div>
      </div>

      <div className="auth__panel">
        <form className="auth__card" onSubmit={submit}>
          <h1 className="auth__title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth__sub">
            {isSignup
              ? 'Start your travel atlas — it syncs across your devices.'
              : 'Sign in to pick up where you left off.'}
          </p>

          {isSignup && (
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                placeholder="Traveler"
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {status && (
            <p className={status.type === 'error' ? 'form__error' : 'form__ok'}>{status.msg}</p>
          )}

          <button type="submit" className="btn btn--primary auth__submit" disabled={busy}>
            {busy ? 'Just a moment…' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          <p className="auth__switch">
            {isSignup ? 'Already have an account?' : 'New to Roamly?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'signin' : 'signup')
                setStatus(null)
              }}
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
