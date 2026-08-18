import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useAuth } from './hooks/useAuth'
import type { Profile } from './hooks/useAuth'
import { SignIn } from './components/SignIn'
import { Onboarding } from './components/Onboarding'
import { CourseList } from './components/CourseList'
import { CoursePage } from './components/CoursePage'

function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <div className="brand">SIIT Study Hub</div>
      {children}
    </div>
  )
}

function AppShell({
  profile,
  onSignOut,
}: {
  profile: Profile
  onSignOut: () => void
}) {
  return (
    <div className="shell">
      <header className="shell-header">
        <div className="brand">SIIT Study Hub</div>
        <div className="who">
          <span className="handle">@{profile.handle}</span>
          <button type="button" className="btn-secondary" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="shell-main">
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route path="/course/:code" element={<CoursePage authorId={profile.id} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const { session, profile, loading, refreshProfile, signOut } = useAuth()

  if (loading) {
    return (
      <CenteredCard>
        <span className="loading-dot" aria-live="polite">
          Loading…
        </span>
      </CenteredCard>
    )
  }

  if (!session) {
    return (
      <CenteredCard>
        <SignIn />
      </CenteredCard>
    )
  }

  if (profile === undefined) {
    return (
      <CenteredCard>
        <span className="loading-dot" aria-live="polite">
          Loading…
        </span>
      </CenteredCard>
    )
  }

  if (profile === null) {
    return (
      <CenteredCard>
        <Onboarding userId={session.user.id} onCreated={refreshProfile} />
      </CenteredCard>
    )
  }

  return <AppShell profile={profile} onSignOut={signOut} />
}

export default App
