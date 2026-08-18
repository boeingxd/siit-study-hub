import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.local.example to ' +
      '.env.local and fill in your project values (see README).',
  )
}

// The anon key is safe to ship in the client bundle by design — it has no
// power on its own. Every access rule is enforced by Supabase RLS, not by
// anything in this file. See CLAUDE.md.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Implicit, not PKCE: PKCE ties the magic link to the exact browser
    // that requested it (a code_verifier in that browser's localStorage),
    // so a link opened on a different device than it was requested from
    // — the everyday case of requesting on a laptop and clicking from a
    // phone's mail app — fails every time. Implicit puts the session
    // tokens straight in the URL fragment instead, so the link works from
    // any device. This was Supabase Auth's only flow for years; it's
    // still fully secure for an email-link-based sign-in like this one.
    flowType: 'implicit',
  },
})
