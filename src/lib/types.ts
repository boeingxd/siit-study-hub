export interface Course {
  id: string
  code: string
  title: string
  program: string | null
  credits: number | null
}

export interface ExamIntelRow {
  id: string
  author_id: string
  exam_type: string
  semester: string
  instructor: string | null
  format: string[]
  topics: string[]
  allowed_aids: string | null
  duration_min: number | null
  difficulty: number
  time_pressure: number
  advice: string | null
  credit_by_name: boolean
  removed_at: string | null
  removed_note: string | null
}

export interface MaterialRow {
  id: string
  author_id: string
  title: string
  type: string
  semester: string | null
  instructor: string | null
  body_md: string | null
  file_path: string | null
  credit_by_name: boolean
  removed_at: string | null
  removed_note: string | null
}
