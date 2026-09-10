import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Auth from './components/Auth.jsx'
import LandingPage from './components/ui/landing-page.tsx'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'

// Signed-out visitors see the marketing landing page first; its CTAs set the
// #signin hash to move on to the auth screen. Signed-in visitors always skip
// straight to the app, regardless of hash.
const wantsSignIn = () => window.location.hash === '#signin'

// Decides what to show: a setup notice if Supabase isn't configured, a loading
// splash while the session resolves, then — when signed out — the landing page
// (or the auth screen once they choose to sign in), else the app.
function Root() {
  const { configured, loading, user } = useAuth()
  const [signIn, setSignIn] = React.useState(wantsSignIn())

  React.useEffect(() => {
    const onHashChange = () => setSignIn(wantsSignIn())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (!configured) {
    return (
      <div className="boot">
        <div className="boot__card">
          <h1>Finish setup</h1>
          <p>
            Roamly needs a Supabase project. Copy <code>.env.example</code> to{' '}
            <code>.env</code> and set <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server. See{' '}
            <code>README.md</code> for the full steps.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="boot">
        <div className="mini-spinner" style={{ width: 26, height: 26 }} />
      </div>
    )
  }

  if (user) return <App />

  // Signed out: landing page first, auth screen once they choose to continue.
  return signIn ? <Auth /> : <LandingPage />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
)
