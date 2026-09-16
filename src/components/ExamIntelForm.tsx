import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { ExamIntelRow } from '../lib/types'

const EXAM_TYPES = ['midterm', 'final', 'quiz'] as const
const FORMATS = ['MCQ', 'Written', 'Coding', 'Oral'] as const
const AIDS = [
  { value: 'none', label: 'None' },
  { value: 'one_sheet', label: 'One sheet' },
  { value: 'open_book', label: 'Open book' },
  { value: 'calculator', label: 'Calculator' },
] as const

interface ExamIntelFormProps {
  courseId: string
  authorId: string
  initial?: ExamIntelRow
  onSubmitted: () => void
  onCancel: () => void
}

export function ExamIntelForm({
  courseId,
  authorId,
  initial,
  onSubmitted,
  onCancel,
}: ExamIntelFormProps) {
  const [examType, setExamType] = useState<string>(initial?.exam_type ?? 'midterm')
  const [semester, setSemester] = useState(initial?.semester ?? '')
  const [instructor, setInstructor] = useState(initial?.instructor ?? '')
  const [formats, setFormats] = useState<string[]>(initial?.format ?? [])
  const [topics, setTopics] = useState(initial?.topics.join(', ') ?? '')
  const [allowedAids, setAllowedAids] = useState(initial?.allowed_aids ?? 'none')
  const [duration, setDuration] = useState(initial?.duration_min?.toString() ?? '')
  const [timePressure, setTimePressure] = useState(initial?.time_pressure ?? 3)
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 3)
  const [advice, setAdvice] = useState(initial?.advice ?? '')
  const [creditByName, setCreditByName] = useState(initial?.credit_by_name ?? false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleFormat(f: string) {
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!semester.trim()) {
      setError('Semester is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const payload = {
      exam_type: examType,
      semester: semester.trim(),
      instructor: instructor.trim() || null,
      format: formats,
      topics: topics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      allowed_aids: allowedAids,
      duration_min: duration ? Number(duration) : null,
      time_pressure: timePressure,
      difficulty,
      advice: advice.trim() || null,
      credit_by_name: creditByName,
    }

    const { data, error: writeError } = initial
      ? await supabase.from('exam_intel').update(payload).eq('id', initial.id).select('id')
      : await supabase
          .from('exam_intel')
          .insert({ ...payload, course_id: courseId, author_id: authorId })
          .select('id')

    setSubmitting(false)
    // Under RLS, an update that matches no row visible to this policy
    // still returns success with zero rows — check the returned row count
    // rather than trusting the absence of an error.
    if (writeError || !data || data.length === 0) {
      setError(
        initial
          ? "Couldn't save your changes. Please try again."
          : "Couldn't save this report. Please try again.",
      )
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
          <label htmlFor="exam-type">Exam type</label>
          <select id="exam-type" value={examType} onChange={(e) => setExamType(e.target.value)}>
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="semester">Semester</label>
          <input
            id="semester"
            placeholder="e.g. 2026/1"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="instructor">Instructor (optional)</label>
        <input id="instructor" value={instructor} onChange={(e) => setInstructor(e.target.value)} />
      </div>

      <div className="field">
        <label>Format</label>
        <div className="checkbox-row">
          {FORMATS.map((f) => (
            <label key={f} className="checkbox-chip">
              <input
                type="checkbox"
                checked={formats.includes(f)}
                onChange={() => toggleFormat(f)}
              />
              {f}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="topics">Topics covered (comma-separated)</label>
        <input
          id="topics"
          placeholder="e.g. recursion, sorting, trees"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="aids">Allowed aids</label>
          <select id="aids" value={allowedAids} onChange={(e) => setAllowedAids(e.target.value)}>
            {AIDS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="duration">Duration, min (optional)</label>
          <input
            id="duration"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="pressure">Time pressure (1–5)</label>
          <input
            id="pressure"
            type="number"
            min={1}
            max={5}
            value={timePressure}
            onChange={(e) => setTimePressure(Number(e.target.value))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="difficulty">Difficulty (1–5)</label>
          <input
            id="difficulty"
            type="number"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="advice">Advice for future students (optional)</label>
        <textarea id="advice" rows={3} value={advice} onChange={(e) => setAdvice(e.target.value)} />
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
