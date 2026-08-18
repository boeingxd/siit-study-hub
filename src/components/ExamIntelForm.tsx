import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

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
  onSubmitted: () => void
  onCancel: () => void
}

export function ExamIntelForm({ courseId, authorId, onSubmitted, onCancel }: ExamIntelFormProps) {
  const [examType, setExamType] = useState<string>('midterm')
  const [semester, setSemester] = useState('')
  const [instructor, setInstructor] = useState('')
  const [formats, setFormats] = useState<string[]>([])
  const [topics, setTopics] = useState('')
  const [allowedAids, setAllowedAids] = useState('none')
  const [duration, setDuration] = useState('')
  const [timePressure, setTimePressure] = useState(3)
  const [difficulty, setDifficulty] = useState(3)
  const [advice, setAdvice] = useState('')
  const [creditByName, setCreditByName] = useState(false)
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

    const { error: insertError } = await supabase.from('exam_intel').insert({
      course_id: courseId,
      author_id: authorId,
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
    })

    setSubmitting(false)
    if (insertError) {
      setError("Couldn't save this report. Please try again.")
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
          {submitting ? 'Saving…' : 'Submit'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
