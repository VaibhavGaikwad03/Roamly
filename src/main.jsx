import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Auth from './components/Auth.jsx'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'

// Decides what to show: a setup notice if Supabase isn't configured, a loading
// splash while the session resolves, the auth screen when signed out, else the
// app.
function Root() {
  const { configured, loading, user } = useAuth()

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

  return user ? <App /> : <Auth />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
)
