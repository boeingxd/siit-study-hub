import './App.css'
import { useAuth } from './hooks/useAuth'
import { SignIn } from './components/SignIn'
import { Onboarding } from './components/Onboarding'

function App() {
  const { session, profile, loading, refreshProfile, signOut } = useAuth()

  function renderContent() {
    if (loading) {
      return (
        <span className="loading-dot" aria-live="polite">
          Loading…
        </span>
      )
    }

    if (!session) {
      return <SignIn />
    }

    if (profile === undefined) {
      return (
        <span className="loading-dot" aria-live="polite">
          Loading…
        </span>
      )
    }

    if (profile === null) {
      return <Onboarding userId={session.user.id} onCreated={refreshProfile} />
    }

    return (
      <div className="card">
        <div className="signed-in">
          <p style={{ margin: 0 }}>
            Signed in as <span className="handle">@{profile.handle}</span>
          </p>
          <button type="button" className="btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
        <p>
          Course archive browsing isn't built yet — that's next. You're all
          set for when it lands.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="brand">SIIT Study Hub</div>
      {renderContent()}
    </div>
  )
}

export default App
