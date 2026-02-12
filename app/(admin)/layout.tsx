'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Navbar from '@/components/Navbar'

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
      <Navbar />
      {/* Main Content */}
      <main className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  )
}
