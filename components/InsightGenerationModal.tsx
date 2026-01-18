'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api/client'

interface SyncStatusResponse {
  sync_status: 'IDLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  sync_step: 'CONNECTING' | 'IMPORTING' | 'CALCULATING' | 'GENERATING_INSIGHTS' | 'COMPLETED' | null
  last_sync_error: string | null
  updated_at: string | null
}

interface InsightGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

type StepStatus = 'completed' | 'active' | 'pending'

export default function InsightGenerationModal({
  isOpen,
  onClose,
  onComplete,
}: InsightGenerationModalProps) {
  // Start with optimistic state - show "Connecting" immediately
  const [status, setStatus] = useState<SyncStatusResponse | null>(() => ({
    sync_status: 'IN_PROGRESS',
    sync_step: 'CONNECTING',
    last_sync_error: null,
    updated_at: new Date().toISOString(),
  }))
  const [notifyWhenReady, setNotifyWhenReady] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      // Reset to optimistic state when modal closes
      setStatus({
        sync_status: 'IN_PROGRESS',
        sync_step: 'CONNECTING',
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      })
      setPollCount(0)
      return
    }

    let pollInterval: NodeJS.Timeout | null = null
    let pollCounter = 0

    const pollStatus = async () => {
      try {
        const response = await apiRequest<SyncStatusResponse>('/api/insights/status')
        setStatus(response)
        pollCounter++

        // Stop polling if completed or failed
        if (response.sync_status === 'COMPLETED') {
          if (pollInterval) clearInterval(pollInterval)
          // Small delay before closing to show completion state
          setTimeout(() => {
            onComplete()
            if (notifyWhenReady) {
              // Show browser notification if permission granted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Insights Ready', {
                  body: 'Your financial insights are now available.',
                  icon: '/favicon.ico',
                })
              }
            }
          }, 1500)
        } else if (response.sync_status === 'FAILED') {
          if (pollInterval) clearInterval(pollInterval)
        } else {
          // Continue polling with adaptive interval
          // First 3 polls: 2 seconds, then 10 seconds
          const interval = pollCounter < 3 ? 2000 : 10000
          
          if (pollInterval) clearInterval(pollInterval)
          pollInterval = setTimeout(pollStatus, interval)
        }
      } catch (err) {
        // Continue polling on error
        console.error('Failed to fetch status:', err)
        pollCounter++
        const interval = pollCounter < 3 ? 2000 : 10000
        if (pollInterval) clearInterval(pollInterval)
        pollInterval = setTimeout(pollStatus, interval)
      }
    }

    // Poll immediately, then schedule next poll
    pollStatus()

    return () => {
      if (pollInterval) clearTimeout(pollInterval)
    }
  }, [isOpen, onComplete, notifyWhenReady])

  if (!isOpen) return null

  const getStepStatus = (stepNumber: number): StepStatus => {
    if (!status) return 'pending'

    const stepMap: Record<string, number> = {
      CONNECTING: 1,
      IMPORTING: 2,
      CALCULATING: 3,
      GENERATING_INSIGHTS: 4,
      COMPLETED: 4,
    }

    const currentStep = stepMap[status.sync_step || ''] || 0

    // If status is IN_PROGRESS and we're on step 1 (CONNECTING), show as active
    // This handles the optimistic initial state
    if (status.sync_status === 'IN_PROGRESS' && currentStep === 0 && stepNumber === 1) {
      return 'active'
    }

    if (stepNumber < currentStep || status.sync_status === 'COMPLETED') {
      return 'completed'
    }
    if (stepNumber === currentStep && status.sync_status === 'IN_PROGRESS') {
      return 'active'
    }
    return 'pending'
  }

  const getStepDetail = (stepNumber: number): string => {
    if (!status) return ''

    const stepStatus = getStepStatus(stepNumber)
    if (stepStatus === 'completed') {
      if (stepNumber === 1) return 'Connection established'
      if (stepNumber === 2) return 'Data imported successfully'
      if (stepNumber === 3) return 'Calculations complete'
      if (stepNumber === 4) return 'Insights generated'
    }
    if (stepStatus === 'active') {
      if (stepNumber === 1) return 'Establishing connection...'
      if (stepNumber === 2) return 'Importing transactions...'
      if (stepNumber === 3) return 'Analyzing cash flow patterns...'
      if (stepNumber === 4) return 'Generating insights...'
    }
    return ''
  }

  const step1Status = getStepStatus(1)
  const step2Status = getStepStatus(2)
  const step3Status = getStepStatus(3)
  const step4Status = getStepStatus(4)

  const handleNotifyClick = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      setNotifyWhenReady(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={status?.sync_status === 'COMPLETED' || status?.sync_status === 'FAILED' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-[600px] max-w-[90vw] rounded-lg bg-bg-secondary-subtle dark:bg-bg-secondary p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary-900">Setting up your insights</h2>
          <p className="mt-1 text-sm text-text-secondary-700">
            This can take a few minutes on first connect.
          </p>
        </div>

        {/* Error State */}
        {status?.sync_status === 'FAILED' && (
          <div className="mb-6 rounded-md bg-bg-error-secondary p-4">
            <p className="text-sm font-medium text-text-primary-900">Generation failed</p>
            <p className="mt-1 text-sm text-text-secondary-700">
              {status.last_sync_error || 'An error occurred while generating insights.'}
            </p>
          </div>
        )}

        {/* Steps Timeline */}
        <div className="mb-6 space-y-6">
          {/* Step 1: Connecting to Xero */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {step1Status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#079455]">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : step1Status === 'active' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-text-brand-tertiary-600">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-text-brand-tertiary-600" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-text-quaternary-500" />
              )}
              {(step1Status === 'completed' || step2Status !== 'pending') && (
                <div className={`mt-2 h-12 w-0.5 ${step1Status === 'completed' ? 'bg-[#079455]' : 'bg-text-brand-tertiary-600'}`} />
              )}
            </div>
            <div className="flex-1 pb-6">
              <p className="text-sm font-semibold text-text-primary-900">Connecting to Xero</p>
              {step1Status === 'completed' && (
                <p className="mt-1 text-sm text-text-secondary-700">{getStepDetail(1)}</p>
              )}
              {step1Status === 'active' && (
                <p className="mt-1 text-sm text-text-brand-tertiary-600">{getStepDetail(1)}</p>
              )}
            </div>
          </div>

          {/* Step 2: Importing data */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {step2Status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#079455]">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : step2Status === 'active' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-text-brand-tertiary-600">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-text-brand-tertiary-600" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-text-quaternary-500" />
              )}
              {(step2Status === 'completed' || step3Status !== 'pending') && (
                <div className={`mt-2 h-12 w-0.5 ${step2Status === 'completed' ? 'bg-[#079455]' : 'bg-text-brand-tertiary-600'}`} />
              )}
            </div>
            <div className="flex-1 pb-6">
              <p className={`text-sm font-semibold ${step2Status === 'pending' ? 'text-text-quaternary-500' : 'text-text-primary-900'}`}>
                Importing data
              </p>
              {step2Status === 'completed' && (
                <p className="mt-1 text-sm text-text-secondary-700">{getStepDetail(2)}</p>
              )}
              {step2Status === 'active' && (
                <p className="mt-1 text-sm text-text-brand-tertiary-600">{getStepDetail(2)}</p>
              )}
              {step2Status === 'pending' && step1Status === 'completed' && (
                <p className="mt-1 text-sm text-text-quaternary-500">Waiting to start...</p>
              )}
            </div>
          </div>

          {/* Step 3: Calculating runway */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {step3Status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#079455]">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : step3Status === 'active' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-text-brand-tertiary-600">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-text-brand-tertiary-600" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-text-quaternary-500" />
              )}
              {(step3Status === 'completed' || step4Status !== 'pending') && (
                <div className={`mt-2 h-12 w-0.5 ${step3Status === 'completed' ? 'bg-[#079455]' : 'bg-text-brand-tertiary-600'}`} />
              )}
            </div>
            <div className="flex-1 pb-6">
              <p className={`text-sm font-semibold ${step3Status === 'pending' ? 'text-text-quaternary-500' : 'text-text-primary-900'}`}>
                Calculating runway
              </p>
              {step3Status === 'completed' && (
                <p className="mt-1 text-sm text-text-secondary-700">{getStepDetail(3)}</p>
              )}
              {step3Status === 'active' && (
                <p className="mt-1 text-sm text-text-brand-tertiary-600">{getStepDetail(3)}</p>
              )}
              {step3Status === 'pending' && step2Status === 'completed' && (
                <p className="mt-1 text-sm text-text-quaternary-500">Waiting to start...</p>
              )}
            </div>
          </div>

          {/* Step 4: Generating insights */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {step4Status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#079455]">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : step4Status === 'active' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-text-brand-tertiary-600">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-text-brand-tertiary-600" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-text-quaternary-500" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${step4Status === 'pending' ? 'text-text-quaternary-500' : 'text-text-primary-900'}`}>
                Generating insights
              </p>
              {step4Status === 'completed' && (
                <p className="mt-1 text-sm text-text-secondary-700">{getStepDetail(4)}</p>
              )}
              {step4Status === 'active' && (
                <p className="mt-1 text-sm text-text-brand-tertiary-600">{getStepDetail(4)}</p>
              )}
              {step4Status === 'pending' && step3Status === 'completed' && (
                <p className="mt-1 text-sm text-text-quaternary-500">Waiting to start...</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-secondary pt-4">
          <p className="mb-4 text-center text-sm text-text-secondary-700">
            We'll have your insights ready shortly.
          </p>
          <button
            onClick={handleNotifyClick}
            className={`w-full rounded-md px-4 py-3 text-sm font-semibold text-white transition-colors ${
              notifyWhenReady
                ? 'bg-text-brand-tertiary-600/80 cursor-default'
                : 'bg-text-brand-tertiary-600 hover:bg-text-brand-tertiary-700'
            }`}
            disabled={notifyWhenReady || status?.sync_status === 'COMPLETED'}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notifyWhenReady ? 'Notifications enabled' : 'Notify me when ready'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
