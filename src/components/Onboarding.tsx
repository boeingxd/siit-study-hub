import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,32}$/

interface OnboardingProps {
  userId: string
  onCreated: () => void
}

export function Onboarding({ userId, onCreated }: OnboardingProps) {
  const [handle, setHandle] = useState('')
  const [program, setProgram] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedHandle = handle.trim()
    if (!HANDLE_RE.test(trimmedHandle)) {
      setError(
        '3–32 characters: letters, numbers, underscores, and hyphens only.',
      )
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      handle: trimmedHandle,
      program: program.trim() || null,
      year: year ? Number(year) : null,
    })
    setSubmitting(false)

    if (insertError) {
      if (insertError.code === '23505') {
        setError('That handle is taken — try another.')
      } else {
        setError("Couldn't save your profile. Please try again.")
      }
      return
    }

    onCreated()
  }

  return (
    <div className="card">
      <h1>Set up your profile</h1>
      <p className="lede">
        Your handle is what other students see on what you post — pick
        something you don't mind being public.
      </p>
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="handle">Handle</label>
          <input
            id="handle"
            className="mono"
            placeholder="e.g. night_owl_42"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
          />
          <span className="hint">Shown on everything you post.</span>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="program">Program</label>
            <input
              id="program"
              placeholder="e.g. ICT"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              type="number"
              min={1}
              max={8}
              placeholder="3"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
