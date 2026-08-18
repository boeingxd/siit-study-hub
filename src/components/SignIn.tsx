import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isSiitEmail } from '../lib/domain'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()

    // UX-only pre-check — the real gate is the Supabase domain trigger + RLS.
    if (!isSiitEmail(trimmed)) {
      setError('Use your SIIT student email — it ends in @g.siit.tu.ac.th.')
      return
    }

    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    })
    setSubmitting(false)

    if (signInError) {
      setError(
        "Couldn't send the link. Double-check your SIIT email and try again.",
      )
      return
    }

    setSentTo(trimmed)
  }

  if (sentTo) {
    return (
      <div className="card confirm">
        <div className="icon" aria-hidden="true">
          ✉️
        </div>
        <h1>Check your email</h1>
        <p>
          We sent a sign-in link to <strong>{sentTo}</strong>. Open it on
          this device to continue.
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setSentTo(null)}
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <h1>Sign in</h1>
      <p className="lede">
        We'll email you a link — no password to remember.
      </p>
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">SIIT email</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="yourname@g.siit.tu.ac.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>
    </div>
  )
}
