'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAdmin, appUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Redirect non-admin users once we know their role
  useEffect(() => {
    if (!loading && appUser && !isAdmin) {
      router.push('/overview')
    }
  }, [loading, appUser, isAdmin, router])

  // Show loading while auth state is being determined
  if (loading || (user && !appUser)) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-12 w-48" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Admin Navigation Bar */}
      <nav className="border-b border-border-secondary bg-bg-primary">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-lg font-semibold text-text-primary-900">
                Neura Admin
              </Link>
            </div>
            <Link
              href="/overview"
              className="text-sm text-text-quaternary-500 hover:text-text-secondary-700 transition-colors"
            >
              Back to App
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
