import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { REPORT_PRESETS, formatReason } from '../lib/moderation'

type TargetType = 'exam_intel' | 'materials'
type Mode = 'view' | 'confirm-delete' | 'report'

interface ModerationActionsProps {
  targetType: TargetType
  targetId: string
  authorId: string
  currentUserId: string
  removedAt: string | null
  removedNote: string | null
  onEdit: () => void
  onDeleted: () => void
}

export function ModerationActions({
  targetType,
  targetId,
  authorId,
  currentUserId,
  removedAt,
  removedNote,
  onEdit,
  onDeleted,
}: ModerationActionsProps) {
  const [mode, setMode] = useState<Mode>('view')
  const [reportPreset, setReportPreset] = useState<string>(REPORT_PRESETS[0].value)
  const [reportDetail, setReportDetail] = useState('')
  const [reported, setReported] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOwn = authorId === currentUserId

  // Removed content is only ever visible to its own author (or an admin) —
  // RLS already guarantees that, so a non-owner never reaches this branch.
  if (removedAt) {
    return (
      <div className="tombstone">
        <p>Removed by a moderator{removedNote ? `: ${removedNote}` : '.'}</p>
      </div>
    )
  }

  async function handleDelete() {
    setSubmitting(true)
    setError(null)
    const { data, error: deleteError } = await supabase
      .from(targetType)
      .delete()
      .eq('id', targetId)
      .select('id')
    setSubmitting(false)
    if (deleteError || !data || data.length === 0) {
      setError("Couldn't delete this. Please try again.")
      return
    }
    onDeleted()
  }

  async function handleReport(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: reportError } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reporter_id: currentUserId,
      reason: formatReason(reportPreset, reportDetail),
    })
    setSubmitting(false)
    if (reportError) {
      setError(
        reportError.code === '23505'
          ? "You've already reported this."
          : "Couldn't submit your report. Please try again.",
      )
      return
    }
    setReported(true)
    setMode('view')
  }

  if (mode === 'report') {
    return (
      <form onSubmit={handleReport}>
        {error && (
          <span className="error" role="alert">
            {error}
          </span>
        )}
        <p className="hint">
          Report content that isn't student-authored, is an official exam paper or answer
          key, inaccurate, or attacks a specific person.
        </p>
        <div className="field">
          <label>Reason</label>
          <div className="report-reasons">
            {REPORT_PRESETS.map((p) => (
              <label key={p.value} className="checkbox-chip">
                <input
                  type="radio"
                  name="report-reason"
                  checked={reportPreset === p.value}
                  onChange={() => setReportPreset(p.value)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="report-detail">Anything else the moderators should know? (optional)</label>
          <textarea
            id="report-detail"
            rows={2}
            value={reportDetail}
            onChange={(e) => setReportDetail(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode('view')}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  if (mode === 'confirm-delete') {
    return (
      <div className="form-actions">
        {error && (
          <span className="error" role="alert">
            {error}
          </span>
        )}
        <span className="danger-text">Delete this permanently?</span>
        <button type="button" className="btn-primary" onClick={handleDelete} disabled={submitting}>
          {submitting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setMode('view')}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="form-actions">
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
      {isOwn ? (
        <>
          <button type="button" className="btn-secondary" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode('confirm-delete')}>
            Delete
          </button>
        </>
      ) : reported ? (
        <span className="hint">Reported — thanks for flagging this.</span>
      ) : (
        <button type="button" className="btn-secondary" onClick={() => setMode('report')}>
          Report
        </button>
      )}
    </div>
  )
}
