import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Course } from '../lib/types'

export function CourseList() {
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true

    supabase
      .from('courses')
      .select('id, code, title, program, credits')
      .order('code')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setError("Couldn't load the course list. Try refreshing.")
          return
        }
        setCourses(data)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (!courses) return []
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
    )
  }, [courses, query])

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
      {filtered.length === 0 ? (
        <p className="empty-note">No courses match “{query}”.</p>
      ) : (
        <ul className="course-list">
          {filtered.map((course) => (
            <li key={course.id}>
              <Link to={`/course/${course.code}`} className="course-row">
                <span className="code">{course.code}</span>
                <span className="title">{course.title}</span>
                {course.credits !== null && (
                  <span className="credits">{course.credits} cr</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
