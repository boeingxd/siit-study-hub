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
      // Supabase rate-limits repeat OTP requests to the same address
      // (currently 1/minute) — a real, expected condition, not a broken
      // sign-in. Signing out and back in right away hits this every time,
      // so it needs its own message instead of the generic fallback.
      if (signInError.status === 429) {
        setError(
          "You already have a sign-in link on the way — check your email, or wait about a minute before requesting another.",
        )
      } else {
        setError(
          "Couldn't send the link. Double-check your SIIT email and try again.",
        )
      }
      return
    }

    setSentTo(trimmed)
  }

  if (sentTo) {
    return (
      <div className="card confirm">
        <svg
          className="icon"
          width="36"
          height="28"
          viewBox="0 0 36 28"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="1.5"
            y="1.5"
            width="33"
            height="25"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M2.5 3L18 16L33.5 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
