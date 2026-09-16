import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Course, ExamIntelRow, MaterialRow } from '../lib/types'
import { BackArrowIcon } from './icons'
import { ExamIntelForm } from './ExamIntelForm'
import { MaterialsForm } from './MaterialsForm'
import { DetailModal } from './DetailModal'
import { ModerationActions } from './ModerationActions'

type Tab = 'exam_intel' | 'materials'

interface CoursePageProps {
  authorId: string
}

const AID_LABELS: Record<string, string> = {
  none: 'None',
  one_sheet: 'One sheet',
  open_book: 'Open book',
  calculator: 'Calculator',
}

const EXAM_INTEL_COLUMNS =
  'id, author_id, exam_type, semester, instructor, format, topics, allowed_aids, duration_min, difficulty, time_pressure, advice, credit_by_name, removed_at, removed_note'

const MATERIALS_COLUMNS =
  'id, author_id, title, type, semester, instructor, body_md, file_path, credit_by_name, removed_at, removed_note'

export function CoursePage({ authorId }: CoursePageProps) {
  const { code } = useParams<{ code: string }>()
  const [course, setCourse] = useState<Course | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('exam_intel')
  const [examIntel, setExamIntel] = useState<ExamIntelRow[] | null>(null)
  const [materials, setMaterials] = useState<MaterialRow[] | null>(null)
  const [showIntelForm, setShowIntelForm] = useState(false)
  const [showMaterialsForm, setShowMaterialsForm] = useState(false)
  const [editingIntel, setEditingIntel] = useState<ExamIntelRow | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null)
  const [selectedIntel, setSelectedIntel] = useState<ExamIntelRow | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRow | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

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
      .select(EXAM_INTEL_COLUMNS)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setExamIntel(data ?? []))
  }, [])

  const refetchMaterials = useCallback((courseId: string) => {
    return supabase
      .from('materials')
      .select(MATERIALS_COLUMNS)
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
    setFileError(null)
    const { data, error } = await supabase.storage
      .from('materials')
      .createSignedUrl(filePath, 60)
    if (error || !data) {
      setFileError("Couldn't open this file. Please try again.")
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  // Removed rows only ever reach this component if RLS already decided we
  // may see them (their own author, or an admin) — split here purely for
  // presentation, not as an access check.
  const liveExamIntel = useMemo(() => examIntel?.filter((r) => !r.removed_at) ?? [], [examIntel])
  const removedExamIntel = useMemo(() => examIntel?.filter((r) => r.removed_at) ?? [], [examIntel])
  const liveMaterials = useMemo(() => materials?.filter((r) => !r.removed_at) ?? [], [materials])
  const removedMaterials = useMemo(() => materials?.filter((r) => r.removed_at) ?? [], [materials])

  const summary = useMemo(() => {
    if (liveExamIntel.length === 0) return null
    const n = liveExamIntel.length
    const avgDifficulty = liveExamIntel.reduce((sum, r) => sum + r.difficulty, 0) / n
    const avgPressure = liveExamIntel.reduce((sum, r) => sum + r.time_pressure, 0) / n

    const topicCounts = new Map<string, number>()
    for (const row of liveExamIntel) {
      for (const topic of row.topics ?? []) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1)
      }
    }
    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic)

    return { n, avgDifficulty, avgPressure, topTopics }
  }, [liveExamIntel])

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

  const intelFormOpen = showIntelForm || editingIntel !== null
  const materialsFormOpen = showMaterialsForm || editingMaterial !== null

  function closeIntelForm() {
    setShowIntelForm(false)
    setEditingIntel(null)
  }

  function closeMaterialsForm() {
    setShowMaterialsForm(false)
    setEditingMaterial(null)
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
          {intelFormOpen ? (
            <ExamIntelForm
              key={editingIntel?.id ?? 'new'}
              courseId={course.id}
              authorId={authorId}
              initial={editingIntel ?? undefined}
              onCancel={closeIntelForm}
              onSubmitted={() => {
                closeIntelForm()
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
              ) : liveExamIntel.length === 0 ? (
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
                    {liveExamIntel.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="course-row"
                          onClick={() => setSelectedIntel(row)}
                        >
                          <span className="title">
                            {row.exam_type} · {row.semester}
                          </span>
                          <span className="credits">
                            difficulty {row.difficulty}/5 · pressure {row.time_pressure}/5
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {removedExamIntel.length > 0 && (
                <>
                  <p className="hint" style={{ marginTop: 'var(--space-5)' }}>
                    Removed — visible only to you
                  </p>
                  <ul className="course-list">
                    {removedExamIntel.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="course-row"
                          onClick={() => setSelectedIntel(row)}
                        >
                          <span className="title">
                            {row.exam_type} · {row.semester}
                          </span>
                          <span className="credits">Removed</span>
                        </button>
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
          {materialsFormOpen ? (
            <MaterialsForm
              key={editingMaterial?.id ?? 'new'}
              courseId={course.id}
              authorId={authorId}
              initial={editingMaterial ?? undefined}
              onCancel={closeMaterialsForm}
              onSubmitted={() => {
                closeMaterialsForm()
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
              ) : liveMaterials.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No materials yet for {course.code}. Be the first to share
                    notes, a summary, or a cheat sheet.
                  </p>
                </div>
              ) : (
                <ul className="course-list">
                  {liveMaterials.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        className="course-row"
                        onClick={() => setSelectedMaterial(row)}
                      >
                        <span className="title">{row.title}</span>
                        <span className="credits">
                          {row.type}
                          {row.file_path ? ' · has file' : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {removedMaterials.length > 0 && (
                <>
                  <p className="hint" style={{ marginTop: 'var(--space-5)' }}>
                    Removed — visible only to you
                  </p>
                  <ul className="course-list">
                    {removedMaterials.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="course-row"
                          onClick={() => setSelectedMaterial(row)}
                        >
                          <span className="title">{row.title}</span>
                          <span className="credits">Removed</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}

      {selectedIntel && (
        <DetailModal
          title={`${selectedIntel.exam_type[0].toUpperCase()}${selectedIntel.exam_type.slice(1)} · ${selectedIntel.semester}`}
          onClose={() => setSelectedIntel(null)}
        >
          <dl className="detail-list">
            <dt>Difficulty</dt>
            <dd>{selectedIntel.difficulty}/5</dd>
            <dt>Time pressure</dt>
            <dd>{selectedIntel.time_pressure}/5</dd>
            {selectedIntel.instructor && (
              <>
                <dt>Instructor</dt>
                <dd>{selectedIntel.instructor}</dd>
              </>
            )}
            {selectedIntel.format.length > 0 && (
              <>
                <dt>Format</dt>
                <dd>{selectedIntel.format.join(', ')}</dd>
              </>
            )}
            {selectedIntel.allowed_aids && (
              <>
                <dt>Allowed aids</dt>
                <dd>{AID_LABELS[selectedIntel.allowed_aids] ?? selectedIntel.allowed_aids}</dd>
              </>
            )}
            {selectedIntel.duration_min && (
              <>
                <dt>Duration</dt>
                <dd>{selectedIntel.duration_min} min</dd>
              </>
            )}
            {selectedIntel.topics.length > 0 && (
              <>
                <dt>Topics</dt>
                <dd>{selectedIntel.topics.join(', ')}</dd>
              </>
            )}
          </dl>
          {selectedIntel.advice && (
            <>
              <h3 className="detail-subhead">Advice</h3>
              <p className="detail-body">{selectedIntel.advice}</p>
            </>
          )}
          <ModerationActions
            targetType="exam_intel"
            targetId={selectedIntel.id}
            authorId={selectedIntel.author_id}
            currentUserId={authorId}
            removedAt={selectedIntel.removed_at}
            removedNote={selectedIntel.removed_note}
            onEdit={() => {
              setEditingIntel(selectedIntel)
              setSelectedIntel(null)
            }}
            onDeleted={() => {
              setSelectedIntel(null)
              refetchExamIntel(course.id)
            }}
          />
        </DetailModal>
      )}

      {selectedMaterial && (
        <DetailModal
          title={selectedMaterial.title}
          onClose={() => {
            setSelectedMaterial(null)
            setFileError(null)
          }}
        >
          <dl className="detail-list">
            <dt>Type</dt>
            <dd>{selectedMaterial.type}</dd>
            {selectedMaterial.semester && (
              <>
                <dt>Semester</dt>
                <dd>{selectedMaterial.semester}</dd>
              </>
            )}
            {selectedMaterial.instructor && (
              <>
                <dt>Instructor</dt>
                <dd>{selectedMaterial.instructor}</dd>
              </>
            )}
          </dl>
          {selectedMaterial.body_md && (
            <p className="detail-body">{selectedMaterial.body_md}</p>
          )}
          {fileError && (
            <span className="error" role="alert">
              {fileError}
            </span>
          )}
          {selectedMaterial.file_path && (
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => viewFile(selectedMaterial.file_path!)}
            >
              View attached file
            </button>
          )}
          <ModerationActions
            targetType="materials"
            targetId={selectedMaterial.id}
            authorId={selectedMaterial.author_id}
            currentUserId={authorId}
            removedAt={selectedMaterial.removed_at}
            removedNote={selectedMaterial.removed_note}
            onEdit={() => {
              setEditingMaterial(selectedMaterial)
              setSelectedMaterial(null)
            }}
            onDeleted={() => {
              setSelectedMaterial(null)
              refetchMaterials(course.id)
            }}
          />
        </DetailModal>
      )}
    </div>
  )
}
