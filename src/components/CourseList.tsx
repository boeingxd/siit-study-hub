import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { CourseWithCounts } from '../lib/types'
import { SupportBanner } from './SupportBanner'

function contentTotal(c: CourseWithCounts) {
  return (c.intelCount ?? 0) + (c.materialsCount ?? 0)
}

function contentLabel(c: CourseWithCounts) {
  if (c.intelCount === null || c.materialsCount === null) return null
  if (contentTotal(c) === 0) return 'No content yet'
  const parts: string[] = []
  if (c.intelCount > 0) parts.push(`${c.intelCount} intel`)
  if (c.materialsCount > 0) parts.push(`${c.materialsCount} material${c.materialsCount === 1 ? '' : 's'}`)
  return parts.join(' · ')
}

export function CourseList() {
  const [courses, setCourses] = useState<CourseWithCounts[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [onlyWithContent, setOnlyWithContent] = useState(false)

  useEffect(() => {
    let active = true

    const columns = 'id, code, title, program, credits'

    async function load() {
      // Embedded counts only include live rows (removed_at is null). If that
      // richer query ever fails, fall back to the plain list so the page
      // still works — counts are a nicety, not a requirement.
      const withCounts = await supabase
        .from('courses')
        .select(`${columns}, exam_intel(count), materials(count)`)
        .is('exam_intel.removed_at', null)
        .is('materials.removed_at', null)
        .order('code')
      if (!active) return
      if (!withCounts.error && withCounts.data) {
        setCourses(
          withCounts.data.map(({ exam_intel, materials, ...course }) => ({
            ...course,
            intelCount: exam_intel?.[0]?.count ?? 0,
            materialsCount: materials?.[0]?.count ?? 0,
          })),
        )
        return
      }

      const plain = await supabase.from('courses').select(columns).order('code')
      if (!active) return
      if (plain.error || !plain.data) {
        setError("Couldn't load the course list. Try refreshing.")
        return
      }
      setCourses(
        plain.data.map((course) => ({ ...course, intelCount: null, materialsCount: null })),
      )
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (!courses) return []
    const q = query.trim().toLowerCase()
    const matches = courses.filter(
      (c) =>
        (!q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) &&
        (!onlyWithContent || contentTotal(c) > 0),
    )
    // Courses with content first; Array.sort is stable, so code order holds
    // within each group.
    return [...matches].sort(
      (a, b) => Number(contentTotal(b) > 0) - Number(contentTotal(a) > 0),
    )
  }, [courses, query, onlyWithContent])

  if (error) {
    return <p className="empty-note">{error}</p>
  }

  if (!courses) {
    return <span className="loading-dot">Loading…</span>
  }

  return (
    <div>
      <input
        type="search"
        className="search-field"
        placeholder="Search by course code or title"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search courses"
      />
      <label className="checkbox-chip filter-chip">
        <input
          type="checkbox"
          checked={onlyWithContent}
          onChange={(e) => setOnlyWithContent(e.target.checked)}
        />
        Only courses with content
      </label>
      {filtered.length === 0 ? (
        <p className="empty-note">
          {query.trim() ? `No courses match “${query}”.` : 'No courses have content yet.'}
        </p>
      ) : (
        <ul className="course-list">
          {filtered.map((course) => (
            <li key={course.id}>
              <Link to={`/course/${course.code}`} className="course-row">
                <span className="code">{course.code}</span>
                <span className="title">{course.title}</span>
                {contentLabel(course) && (
                  <span
                    className={`content-status${contentTotal(course) === 0 ? ' empty' : ''}`}
                  >
                    {contentLabel(course)}
                  </span>
                )}
                {course.credits !== null && (
                  <span className="credits">{course.credits} cr</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <SupportBanner />
    </div>
  )
}
