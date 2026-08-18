import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

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
  onSubmitted: () => void
  onCancel: () => void
}

export function MaterialsForm({ courseId, authorId, onSubmitted, onCancel }: MaterialsFormProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('notes')
  const [semester, setSemester] = useState('')
  const [instructor, setInstructor] = useState('')
  const [bodyMd, setBodyMd] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [creditByName, setCreditByName] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!bodyMd.trim() && !file) {
      setError('Add notes below, attach a file, or both.')
      return
    }

    setSubmitting(true)
    setError(null)

    let filePath: string | null = null
    if (file) {
      const path = `${authorId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, file)
      if (uploadError) {
        setSubmitting(false)
        setError("Couldn't upload the file. Please try again.")
        return
      }
      filePath = path
    }

    const { error: insertError } = await supabase.from('materials').insert({
      course_id: courseId,
      author_id: authorId,
      title: title.trim(),
      type,
      semester: semester.trim() || null,
      instructor: instructor.trim() || null,
      body_md: bodyMd.trim() || null,
      file_path: filePath,
      credit_by_name: creditByName,
    })

    setSubmitting(false)
    if (insertError) {
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
          {submitting ? 'Saving…' : 'Submit'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
