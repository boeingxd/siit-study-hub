import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { MaterialRow } from '../lib/types'
import { safeFileName } from '../lib/moderation'

const TYPES = [
  { value: 'summary', label: 'Summary' },
  { value: 'cheat_sheet', label: 'Cheat sheet' },
  { value: 'notes', label: 'Notes' },
  { value: 'worked_problems', label: 'Worked problems' },
] as const

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/markdown']

interface MaterialsFormProps {
  courseId: string
  authorId: string
  initial?: MaterialRow
  onSubmitted: () => void
  onCancel: () => void
}

export function MaterialsForm({
  courseId,
  authorId,
  initial,
  onSubmitted,
  onCancel,
}: MaterialsFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState<string>(initial?.type ?? 'notes')
  const [semester, setSemester] = useState(initial?.semester ?? '')
  const [instructor, setInstructor] = useState(initial?.instructor ?? '')
  const [bodyMd, setBodyMd] = useState(initial?.body_md ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [removeExistingFile, setRemoveExistingFile] = useState(false)
  const [creditByName, setCreditByName] = useState(initial?.credit_by_name ?? false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingFileName = initial?.file_path?.split('/').pop() ?? null

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    if (picked && !ALLOWED_MIME.includes(picked.type)) {
      setError('That file type isn\'t supported — use PDF, PNG, JPEG, TXT, or Markdown.')
      e.target.value = ''
      setFile(null)
      return
    }
    if (picked && picked.size > 10 * 1024 * 1024) {
      setError('File is too large — 10 MB max.')
      e.target.value = ''
      setFile(null)
      return
    }
    setError(null)
    setFile(picked)
    if (picked) setRemoveExistingFile(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    const willHaveFile = file || (existingFileName && !removeExistingFile)
    if (!bodyMd.trim() && !willHaveFile) {
      setError('Add notes before removing the file — a material needs one or the other.')
      return
    }

    setSubmitting(true)
    setError(null)

    let newFilePath: string | null = null
    if (file) {
      const path = `${authorId}/${Date.now()}-${safeFileName(file.name)}`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, file)
      if (uploadError) {
        setSubmitting(false)
        setError("Couldn't upload the file. Please try again.")
        return
      }
      newFilePath = path
    }

    const payload = {
      title: title.trim(),
      type,
      semester: semester.trim() || null,
      instructor: instructor.trim() || null,
      body_md: bodyMd.trim() || null,
      credit_by_name: creditByName,
    }

    if (initial) {
      const finalFilePath = file ? newFilePath : removeExistingFile ? null : initial.file_path
      const oldPath = initial.file_path

      const { data, error: writeError } = await supabase
        .from('materials')
        .update({ ...payload, file_path: finalFilePath })
        .eq('id', initial.id)
        .select('id')

      setSubmitting(false)
      // Under RLS, an update matching no row visible to this policy still
      // returns success with zero rows — check the row count, not just error.
      if (writeError || !data || data.length === 0) {
        if (newFilePath) await supabase.storage.from('materials').remove([newFilePath])
        setError("Couldn't save your changes. Please try again.")
        return
      }

      // Only remove the old blob once the row no longer points at it — never
      // delete-then-update, or a failure in between leaves the row pointing
      // at nothing.
      if (oldPath && oldPath !== finalFilePath) {
        await supabase.storage.from('materials').remove([oldPath])
      }
      onSubmitted()
      return
    }

    const { data, error: insertError } = await supabase
      .from('materials')
      .insert({ ...payload, course_id: courseId, author_id: authorId, file_path: newFilePath })
      .select('id')

    setSubmitting(false)
    if (insertError || !data || data.length === 0) {
      // Compensating delete: the upload above already succeeded, so without
      // this the file would be stranded in the bucket with nothing ever
      // referencing it. Best-effort — if this also fails the orphan remains.
      if (newFilePath) await supabase.storage.from('materials').remove([newFilePath])
      setError("Couldn't save this material. Please try again.")
      return
    }
    onSubmitted()
  }

  return (
    <form className="intel-form" onSubmit={handleSubmit}>
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="mat-title">Title</label>
          <input
            id="mat-title"
            placeholder="e.g. Midterm cheat sheet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="mat-type">Type</label>
          <select id="mat-type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="mat-semester">Semester (optional)</label>
          <input
            id="mat-semester"
            placeholder="e.g. 2026/1"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="mat-instructor">Instructor (optional)</label>
          <input
            id="mat-instructor"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="mat-body">Notes (optional if you attach a file)</label>
        <textarea
          id="mat-body"
          rows={5}
          placeholder="Write your notes, or summarize what's in the attached file…"
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="mat-file">Attach a file (optional — PDF, PNG, JPEG, TXT, MD, 10 MB max)</label>
        {existingFileName && !file && !removeExistingFile && (
          <span className="hint">
            Current file: {existingFileName} —{' '}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRemoveExistingFile(true)}
            >
              Remove
            </button>
          </span>
        )}
        {removeExistingFile && !file && <span className="hint">File will be removed on save.</span>}
        <input id="mat-file" type="file" accept={ALLOWED_MIME.join(',')} onChange={handleFileChange} />
        {file && <span className="hint">{file.name}</span>}
      </div>

      <label className="checkbox-chip">
        <input
          type="checkbox"
          checked={creditByName}
          onChange={(e) => setCreditByName(e.target.checked)}
        />
        Credit me by name
      </label>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Submit'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
