export const REPORT_PRESETS = [
  { value: 'not_authored', label: "Not student-authored — copied from a book, slides, or another site" },
  { value: 'official_exam', label: 'An official exam paper or answer key' },
  { value: 'misleading', label: 'Inaccurate or misleading' },
  { value: 'attacks_person', label: 'Names or attacks a specific person' },
  { value: 'spam', label: 'Spam or off-topic' },
] as const

const PRESET_LABELS: Record<string, string> = Object.fromEntries(
  REPORT_PRESETS.map((p) => [p.value, p.label]),
)

export function formatReason(presetValue: string, detail: string): string {
  const label = PRESET_LABELS[presetValue] ?? presetValue
  const trimmedDetail = detail.trim()
  return trimmedDetail ? `${label} — ${trimmedDetail}` : label
}

// Storage keys are built as `${authorId}/${safeFileName(file.name)}`; an
// unsanitized filename (spaces, unicode, very long names) causes real
// trouble with storage keys and signed URLs even though it isn't a
// privilege issue (the uid path prefix still holds either way).
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''

  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  const safeExt = ext
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '')
    .slice(0, 10)

  return (safeBase || 'file') + safeExt
}
