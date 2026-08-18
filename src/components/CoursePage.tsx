import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Course } from '../lib/types'
import { BackArrowIcon } from './icons'
import { ExamIntelForm } from './ExamIntelForm'
import { MaterialsForm } from './MaterialsForm'

interface ExamIntelRow {
  id: string
  exam_type: string
  semester: string
  difficulty: number
  time_pressure: number
  topics: string[]
}

interface MaterialRow {
  id: string
  title: string
  type: string
  semester: string | null
  file_path: string | null
}

type Tab = 'exam_intel' | 'materials'

interface CoursePageProps {
  authorId: string
}

export function CoursePage({ authorId }: CoursePageProps) {
  const { code } = useParams<{ code: string }>()
  const [course, setCourse] = useState<Course | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('exam_intel')
  const [examIntel, setExamIntel] = useState<ExamIntelRow[] | null>(null)
  const [materials, setMaterials] = useState<MaterialRow[] | null>(null)
  const [showIntelForm, setShowIntelForm] = useState(false)
  const [showMaterialsForm, setShowMaterialsForm] = useState(false)

  useEffect(() => {
    if (!code) return
    let active = true
    setCourse(undefined)

    supabase
      .from('courses')
      .select('id, code, title, program, credits')
      .eq('code', code.toUpperCase())
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCourse(data)
      })

    return () => {
      active = false
    }
  }, [code])

  const refetchExamIntel = useCallback((courseId: string) => {
    return supabase
      .from('exam_intel')
      .select('id, exam_type, semester, difficulty, time_pressure, topics')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setExamIntel(data ?? []))
  }, [])

  const refetchMaterials = useCallback((courseId: string) => {
    return supabase
      .from('materials')
      .select('id, title, type, semester, file_path')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMaterials(data ?? []))
  }, [])

  useEffect(() => {
    if (!course) return
    refetchExamIntel(course.id)
    refetchMaterials(course.id)
  }, [course, refetchExamIntel, refetchMaterials])

  async function viewFile(filePath: string) {
    // The materials bucket is private — a plain URL won't work. A signed
    // URL is a short-lived, authenticated exception carved out for this
    // one file, generated on demand rather than stored anywhere.
    const { data, error } = await supabase.storage
      .from('materials')
      .createSignedUrl(filePath, 60)
    if (error || !data) {
      window.alert("Couldn't open this file. Please try again.")
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const summary = useMemo(() => {
    if (!examIntel || examIntel.length === 0) return null
    const n = examIntel.length
    const avgDifficulty = examIntel.reduce((sum, r) => sum + r.difficulty, 0) / n
    const avgPressure = examIntel.reduce((sum, r) => sum + r.time_pressure, 0) / n

    const topicCounts = new Map<string, number>()
    for (const row of examIntel) {
      for (const topic of row.topics ?? []) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1)
      }
    }
    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic)

    return { n, avgDifficulty, avgPressure, topTopics }
  }, [examIntel])

  if (course === undefined) {
    return <span className="loading-dot">Loading…</span>
  }

  if (course === null) {
    return (
      <div>
        <Link to="/" className="back-link">
          <BackArrowIcon />
          Back to courses
        </Link>
        <p className="empty-note">
          No course found for “{code}”. Check the code and try again.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/" className="back-link">
        <BackArrowIcon />
        Back to courses
      </Link>
      <div className="course-header">
        <div className="code">{course.code}</div>
        <h1>{course.title}</h1>
        <div className="meta">
          {course.program}
          {course.credits !== null && ` · ${course.credits} credits`}
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'exam_intel'}
          className="tab"
          onClick={() => setTab('exam_intel')}
        >
          Exam Intel
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'materials'}
          className="tab"
          onClick={() => setTab('materials')}
        >
          Materials
        </button>
      </div>

      {tab === 'exam_intel' && (
        <div className="tab-panel" role="tabpanel">
          {showIntelForm ? (
            <ExamIntelForm
              courseId={course.id}
              authorId={authorId}
              onCancel={() => setShowIntelForm(false)}
              onSubmitted={() => {
                setShowIntelForm(false)
                refetchExamIntel(course.id)
              }}
            />
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginBottom: 'var(--space-4)' }}
                onClick={() => setShowIntelForm(true)}
              >
                + Add exam intel
              </button>
              {examIntel === null ? (
                <span className="loading-dot">Loading…</span>
              ) : examIntel.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No exam intel yet for {course.code}. Be the first to report
                    the format, coverage, and difficulty.
                  </p>
                </div>
              ) : (
                <>
                  {summary && (
                    <p className="intel-summary">
                      {summary.n} report{summary.n === 1 ? '' : 's'} · avg
                      difficulty {summary.avgDifficulty.toFixed(1)}/5 · avg
                      pressure {summary.avgPressure.toFixed(1)}/5
                      {summary.topTopics.length > 0 &&
                        ` · most cited: ${summary.topTopics.join(', ')}`}
                    </p>
                  )}
                  <ul className="course-list">
                    {examIntel.map((row) => (
                      <li key={row.id} className="course-row">
                        <span className="title">
                          {row.exam_type} · {row.semester}
                        </span>
                        <span className="credits">
                          difficulty {row.difficulty}/5 · pressure {row.time_pressure}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div className="tab-panel" role="tabpanel">
          {showMaterialsForm ? (
            <MaterialsForm
              courseId={course.id}
              authorId={authorId}
              onCancel={() => setShowMaterialsForm(false)}
              onSubmitted={() => {
                setShowMaterialsForm(false)
                refetchMaterials(course.id)
              }}
            />
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginBottom: 'var(--space-4)' }}
                onClick={() => setShowMaterialsForm(true)}
              >
                + Add materials
              </button>
              {materials === null ? (
                <span className="loading-dot">Loading…</span>
              ) : materials.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No materials yet for {course.code}. Be the first to share
                    notes, a summary, or a cheat sheet.
                  </p>
                </div>
              ) : (
                <ul className="course-list">
                  {materials.map((row) =>
                    row.file_path ? (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="course-row"
                          onClick={() => viewFile(row.file_path!)}
                        >
                          <span className="title">{row.title}</span>
                          <span className="credits">{row.type} · view file</span>
                        </button>
                      </li>
                    ) : (
                      <li key={row.id} className="course-row">
                        <span className="title">{row.title}</span>
                        <span className="credits">{row.type}</span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
