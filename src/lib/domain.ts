// Mirrors the check in the Supabase migration (enforce_siit_email /
// jwt_is_siit_email). This copy is UX only — a fast, friendly rejection
// before ever calling the network. It enforces nothing: the database
// trigger and RLS policies are the real gate. See CLAUDE.md.
const SIIT_EMAIL_RE = /^[^@]+@g\.siit\.tu\.ac\.th$/i

export function isSiitEmail(email: string): boolean {
  return SIIT_EMAIL_RE.test(email.trim())
}
