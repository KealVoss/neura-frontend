'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/Skeleton'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center space-y-4">
        <h1 className="text-display-md text-text-primary-900 mb-lg">
          Neura
        </h1>
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
    </div>
  )
}
