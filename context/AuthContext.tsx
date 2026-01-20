'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// App user data from our backend (includes role)
interface AppUser {
  id: string
  email: string
  role: string
  organization_id: string | null
  organization_name: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  appUser: AppUser | null  // Our app's user data with role
  loading: boolean
  isAdmin: boolean  // Convenience getter
  signUp: (email: string, password: string, organizationName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Use ref to prevent duplicate fetches (persists immediately, unlike state)
  const fetchingRef = useRef(false)

  // Fetch app user data (with role) from our backend - only once
  const fetchAppUser = async () => {
    if (fetchingRef.current || appUser) return // Already fetching or already have data
    fetchingRef.current = true
    try {
      const { apiRequest } = await import('@/lib/api/client')
      const data = await apiRequest<AppUser>('/auth/me')
      setAppUser(data)
    } catch {
      setAppUser(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Fetch app user data if we have a session
      if (session?.user) {
        fetchAppUser()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_OUT') {
        setAppUser(null)
        fetchingRef.current = false // Reset so it fetches on next login
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Only fetch on actual sign in event, not on page navigation
        fetchingRef.current = false // Reset for new sign in
        fetchAppUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signUp = async (
    email: string,
    password: string,
    organizationName: string
  ) => {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, organizationName }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Sign up failed')
    }

    if (data.session) {
      // Sync session to client localStorage (server has set cookies)
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      window.location.href = '/overview'
    } else {
      // Email confirmation required
      router.push('/login?message=Check your email to confirm your account')
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Sign in failed')
    }

    // Sync session to client localStorage (server has set cookies)
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    window.location.href = '/overview'
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback-handler`,
      },
    })

    if (error) throw error
  }

  const signOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    if (data.session) {
      setSession(data.session)
      setUser(data.session.user)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        appUser,
        loading,
        isAdmin: appUser?.role === 'admin',
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
