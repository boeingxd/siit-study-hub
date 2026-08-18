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
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
