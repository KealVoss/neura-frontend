'use client'

import { Skeleton } from './Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-[800px] px-4 py-6 md:px-8 md:py-6">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-3 h-9 w-64 rounded-lg" />
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>

        <div className="space-y-8">
          {/* Business Health Score Card Skeleton */}
          <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-6">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-3.5 w-48 rounded" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>
            <div className="mb-4 flex items-baseline gap-3">
              <Skeleton className="h-14 w-20 rounded-lg" />
              <Skeleton className="h-5 w-10 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mb-2 h-4 w-full rounded" />
            <Skeleton className="mb-6 h-4 w-3/4 rounded" />
            
            {/* Score Breakdown Skeleton */}
            <div className="mb-4 grid grid-cols-3 gap-4 border-t border-border-secondary pt-4">
              <div>
                <Skeleton className="mb-2 h-3.5 w-24 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
              <div>
                <Skeleton className="mb-2 h-3.5 w-20 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
              <div>
                <Skeleton className="mb-2 h-3.5 w-20 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-1 rounded-full" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>

          {/* What needs your attention Skeleton */}
          <div>
            <Skeleton className="mb-4 h-3.5 w-56 rounded" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="mb-2 h-4 w-3/4 rounded" />
                  <Skeleton className="mb-3 h-4 w-full rounded" />
                  <Skeleton className="h-3.5 w-40 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
