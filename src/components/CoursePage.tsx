import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Course } from '../lib/types'
import { BackArrowIcon } from './icons'
import { ExamIntelForm } from './ExamIntelForm'

interface ExamIntelRow {
  id: string
  exam_type: string
  semester: string
  difficulty: number
  time_pressure: number
}

interface MaterialRow {
  id: string
  title: string
  type: string
  semester: string | null
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
      .select('id, exam_type, semester, difficulty, time_pressure')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setExamIntel(data ?? []))
  }, [])

  useEffect(() => {
    if (!course) return
    let active = true

    refetchExamIntel(course.id)

    supabase
      .from('materials')
      .select('id, title, type, semester')
      .eq('course_id', course.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) setMaterials(data ?? [])
      })

    return () => {
      active = false
    }
  }, [course, refetchExamIntel])

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
              )}
            </>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div className="tab-panel" role="tabpanel">
          {materials === null ? (
            <span className="loading-dot">Loading…</span>
          ) : materials.length === 0 ? (
            <div className="empty-state">
              <p>
                No materials yet for {course.code}. Uploading notes and
                summaries is coming soon.
              </p>
            </div>
          ) : (
            <ul className="course-list">
              {materials.map((row) => (
                <li key={row.id} className="course-row">
                  <span className="title">{row.title}</span>
                  <span className="credits">{row.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
