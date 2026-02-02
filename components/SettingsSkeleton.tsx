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

        <div className="flex flex-col gap-8 md:flex-row">
          {/* Left Column - Main Settings */}
          <div className="space-y-8 md:flex-1">
            {/* Organization Section Skeleton */}
            <section>
              <Skeleton className="mb-4 h-3.5 w-32 rounded" />
              <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-40 rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-48 rounded-md" />
                    <Skeleton className="h-10 w-16 rounded-md" />
                  </div>
                </div>
              </div>
            </section>

            {/* Account Section Skeleton */}
            <section>
              <Skeleton className="mb-4 h-3.5 w-32 rounded" />
              <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-10 w-64 rounded-md" />
                </div>
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
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
            </section>

            {/* Log out button skeleton */}
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>

          {/* Right Column - AI Provider Skeleton */}
          <div className="md:w-[400px] md:shrink-0">
            <Skeleton className="mb-4 h-3.5 w-32 rounded" />
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4 space-y-4">
              {/* Provider Skeleton */}
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Model Skeleton */}
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* API Key Skeleton */}
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Actions Skeleton */}
              <div className="flex justify-end gap-3 pt-2">
                <Skeleton className="h-9 w-32 rounded-md" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
