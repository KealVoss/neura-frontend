'use client'

import { Skeleton } from './Skeleton'

export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-6">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-9 w-48 rounded-lg" />
        </div>

        <div className="space-y-8">
          {/* Account Section Skeleton */}
          <section>
            <Skeleton className="mb-4 h-3.5 w-32 rounded" />
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
              <Skeleton className="mb-2 h-4 w-40 rounded" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
          </section>

          {/* Integration Section Skeleton */}
          <section>
            <Skeleton className="mb-4 h-3.5 w-40 rounded" />
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
          </section>

          {/* Support Section Skeleton */}
          <section>
            <Skeleton className="mb-4 h-3.5 w-32 rounded" />
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
              <Skeleton className="mb-2 h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
