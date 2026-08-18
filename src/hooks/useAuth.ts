import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface Profile {
  id: string
  handle: string
  program: string | null
  year: number | null
  is_admin: boolean
  created_at: string
}

/**
 * Tracks the Supabase session and the signed-in user's profile row.
 *
 * `profile` is `undefined` until the first check completes, `null` once
 * checked and no row exists yet (first sign-in, onboarding not done), or the
 * row itself.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Failed to load profile', error)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setSession(session)
      if (session) {
        fetchProfile(session.user.id).finally(() => {
          if (active) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(undefined)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const refreshProfile = useCallback(() => {
    if (session) return fetchProfile(session.user.id)
  }, [session, fetchProfile])

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  return { session, profile, loading, refreshProfile, signOut }
}
