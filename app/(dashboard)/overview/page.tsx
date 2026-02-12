'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { apiRequest } from '@/lib/api/client'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOverviewStore, OverviewData, Insight } from '@/stores/overviewStore'
import { useHealthScoreStore } from '@/stores/healthScoreStore'
import XeroConnectModal from '@/components/XeroConnectModal'
import InsightGenerationModal from '@/components/InsightGenerationModal'
import InsightFeedbackModal from '@/components/InsightFeedbackModal'
import { DashboardSkeleton } from '@/components/DashboardSkeleton'
import { DashboardError } from '@/components/DashboardError'
import WatchCard from '@/components/WatchCard'
import OKCard from '@/components/OKCard'
import HealthScoreCard from '@/components/HealthScoreCard'
import { formatDate } from '@/lib/utils/formatDate'

// Types are imported from overviewStore

interface XeroIntegration {
  is_connected: boolean
  status: string
  connected_at: string | null
  last_synced_at: string | null
  needs_reconnect: boolean
}

interface SettingsData {
  email: string
  xero_integration: XeroIntegration
  last_sync_time: string | null
  support_link: string | null
}

export default function OverviewPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [dataQuality, setDataQuality] = useState<'Good' | 'Mixed' | 'Low'>('Good')
  const [showXeroModal, setShowXeroModal] = useState(false)
  const [showInsightModal, setShowInsightModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [triggerTimestamp, setTriggerTimestamp] = useState<number | undefined>(undefined)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; insightId: string; isPositive: boolean }>({
    isOpen: false,
    insightId: '',
    isPositive: true,
  })
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Use Zustand stores (all have built-in caching and request deduplication)
  const { settings, fetchSettings, getXeroConnected } = useSettingsStore()
  const { data, isLoading, error, fetchOverview, updateOverview, updateInsight } = useOverviewStore()
  const {
    data: healthScore,
    isLoading: healthScoreLoading,
    fetchHealthScore
  } = useHealthScoreStore()

  // Fetch data only once when user is available
  // Use user.id as dependency (stable string) instead of user object (new reference each time)
  const userId = user?.id
  useEffect(() => {
    if (userId) {
      // Fetch from stores (all use cache unless stale or page refresh)
      fetchOverview()
      fetchSettings()
      fetchHealthScore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]) // Only re-run when user ID changes, not on every user object update

  // Update data quality when data or healthScore changes
  // Aggregates confidence signals from all sources
  useEffect(() => {
    // Collect all confidence values (normalize to lowercase)
    const confidenceSignals: string[] = []

    // From insights data
    if (data?.cash_runway?.confidence_level) {
      confidenceSignals.push(data.cash_runway.confidence_level.toLowerCase())
    }
    if (data?.cash_pressure?.confidence) {
      confidenceSignals.push(data.cash_pressure.confidence.toLowerCase())
    }

    // From health score (important - this often shows low confidence)
    if (healthScore?.scorecard?.confidence) {
      confidenceSignals.push(healthScore.scorecard.confidence.toLowerCase())
    }

    // Check for data quality warnings in health score
    const hasDataWarnings = (healthScore?.data_quality?.warnings?.length ?? 0) > 0

    // Determine overall quality - worst signal wins
    const hasLowConfidence = confidenceSignals.includes('low') || hasDataWarnings
    const hasMediumConfidence = confidenceSignals.includes('medium')

    if (hasLowConfidence) {
      setDataQuality('Low')
    } else if (hasMediumConfidence) {
      setDataQuality('Mixed')
    } else if (confidenceSignals.length > 0) {
      setDataQuality('Good')
    }
    // If no signals yet, keep default 'Good'
  }, [data, healthScore])

  // Memoize filtered insights - must be before any early returns
  const watchInsights = useMemo(() =>
    data?.insights.filter(i => i.severity === 'high' && !i.is_marked_done).slice(0, 3) || []
    , [data?.insights])

  const okInsights = useMemo(() =>
    data?.insights.filter(i => i.severity === 'medium' && !i.is_marked_done && !i.is_acknowledged) || []
    , [data?.insights])

  const resolvedInsights = useMemo(() =>
    data?.insights.filter(i => i.is_marked_done || i.is_acknowledged).slice(0, 5) || []
    , [data?.insights])

  const handleResolve = async (insightId: string) => {
    if (actionLoadingId) return // Prevent multiple simultaneous actions
    setActionLoadingId(insightId)

    // Optimistic update
    updateInsight(insightId, { is_marked_done: true })
    setExpandedCardId(null)

    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_marked_done: true }),
      })
      showToast('Insight marked as resolved', 'success')
    } catch (err) {
      // Revert on error
      updateInsight(insightId, { is_marked_done: false })
      showToast('Failed to resolve insight', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleGotIt = async (insightId: string) => {
    if (actionLoadingId) return // Prevent multiple simultaneous actions
    setActionLoadingId(insightId)

    // Optimistic update
    updateInsight(insightId, { is_acknowledged: true })

    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_acknowledged: true }),
      })
      showToast('Insight acknowledged', 'success')
    } catch (err) {
      // Revert on error
      updateInsight(insightId, { is_acknowledged: false })
      showToast('Failed to acknowledge insight', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleFeedbackSubmit = async (feedbackText: string) => {
    try {
      const insight = data?.insights.find(i => i.insight_id === feedbackModal.insightId)
      if (!insight) {
        showToast('Insight not found', 'error')
        return
      }

      await apiRequest('/api/feedback/', {
        method: 'POST',
        body: JSON.stringify({
          insight_id: insight.insight_id,
          insight_type: insight.insight_type,
          insight_title: insight.title,
          is_helpful: feedbackModal.isPositive,
          comment: feedbackText || undefined,
        }),
      })

      // Close modal and show success toast
      setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })
      showToast('Thank you for your feedback!', 'success')
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      showToast('Failed to submit feedback. Please try again.', 'error')
    }
  }

  const handleGenerateInsights = async () => {
    try {
      // Ensure settings are loaded
      if (!settings) {
        await fetchSettings()
      }

      // Check Xero connection using store
      const xeroConnected = getXeroConnected()

      if (!xeroConnected) {
        setShowXeroModal(true)
        return
      }

      // Record trigger timestamp BEFORE opening modal (UTC milliseconds)
      const triggeredAt = Date.now()
      setTriggerTimestamp(triggeredAt)

      // Open modal IMMEDIATELY (optimistic UI)
      setShowInsightModal(true)

      // Then trigger the backend process
      await apiRequest('/api/insights/trigger', {
        method: 'POST',
      })
    } catch (err) {
      // Close modal on error
      setShowInsightModal(false)
      setTriggerTimestamp(undefined)
      showToast('Failed to generate insights. Please try again.', 'error')
    }
  }

  const handleInsightGenerationComplete = async () => {
    setShowInsightModal(false)
    setTriggerTimestamp(undefined)
    // Refresh overview data from store (force refresh)
    await fetchOverview(true)
    // Also refresh health score to get latest AI-generated text (force refresh to bypass cache)
    await fetchHealthScore(true)
  }

  const handleReSync = async () => {
    try {
      setSyncing(true)

      // Ensure settings are loaded
      if (!settings) {
        await fetchSettings()
      }

      // Check Xero connection using store
      const xeroConnected = getXeroConnected()

      if (!xeroConnected) {
        setShowXeroModal(true)
        setSyncing(false)
        return
      }

      // Record trigger timestamp BEFORE opening modal (UTC milliseconds)
      const triggeredAt = Date.now()
      setTriggerTimestamp(triggeredAt)

      // Open modal IMMEDIATELY (optimistic UI)
      setShowInsightModal(true)

      // Then trigger the backend process
      await apiRequest('/api/insights/trigger', {
        method: 'POST',
      })
    } catch (err) {
      // Close modal on error
      setShowInsightModal(false)
      setTriggerTimestamp(undefined)
      showToast('Failed to sync. Please try again.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  if (authLoading || isLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return null // Middleware will redirect
  }

  // Show error state if there's an error and no data
  if (error && !data) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <DashboardError
          onRetry={() => fetchOverview(true)}
          supportLink={settings?.support_link || undefined}
        />
      </div>
    )
  }

  // Check if we have no insights
  const hasNoInsights = !data || data.insights.length === 0

  return (
    <div className="min-h-screen bg-bg-primary max-w-[800px] mx-auto py-6">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-display-md text-text-primary-900 font-bold">
                Your business today
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-text-quaternary-500">
                  Last updated: {formatDate(data?.calculated_at || null)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-text-quaternary-500">Data quality:</span>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${dataQuality === 'Good' ? 'bg-[#079455] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                      }`}>
                      Good
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${dataQuality === 'Mixed' ? 'bg-[#f59e0b] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                      }`}>
                      Mixed
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${dataQuality === 'Low' ? 'bg-[#d92d20] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                      }`}>
                      Low
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Re-sync Button */}
            {!hasNoInsights && (
              <button
                onClick={handleReSync}
                disabled={syncing || showInsightModal}
                className="flex items-center gap-2 rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-sync
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-bg-error-secondary p-3 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        {/* Empty State */}
        {hasNoInsights && !isLoading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
            <div className="mx-auto w-full max-w-2xl text-center">
              <div className="mb-6 flex justify-center">
                <svg
                  className="h-16 w-16 text-text-quaternary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="mb-3 text-xl font-semibold text-text-primary-900">
                No insights yet
              </h2>
              <p className="mb-8 text-base text-text-secondary-700">
                Generate insights to get started with your business health analysis.
              </p>
              <button
                onClick={handleGenerateInsights}
                disabled={showInsightModal}
                className="rounded-md bg-bg-brand-solid px-6 py-2.5 text-sm font-semibold text-text-white transition-colors hover:bg-fg-brand-primary-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate insights
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!hasNoInsights && (
          <div className="space-y-8">
            {/* Business Health Score */}
            <section>
              <HealthScoreCard
                data={healthScore}
                isLoading={healthScoreLoading}
                onRefresh={() => fetchHealthScore(true)}
              />
            </section>

            {/* What needs your attention */}
            {watchInsights.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  WHAT NEEDS YOUR ATTENTION
                </h2>
                <div className="space-y-4">
                  {watchInsights.map((insight) => (
                    <WatchCard
                      key={insight.insight_id}
                      insight={insight}
                      isExpanded={expandedCardId === insight.insight_id}
                      onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                      onResolve={() => handleResolve(insight.insight_id)}
                      onFeedback={(isPositive) => setFeedbackModal({ isOpen: true, insightId: insight.insight_id, isPositive })}
                      calculatedAt={data?.calculated_at || null}
                      isLoading={actionLoadingId === insight.insight_id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Also worth knowing */}
            {okInsights.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  ALSO WORTH KNOWING
                </h2>
                <div className="space-y-3">
                  {okInsights.map((insight) => (
                    <OKCard
                      key={insight.insight_id}
                      insight={insight}
                      isExpanded={expandedCardId === insight.insight_id}
                      onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                      onGotIt={() => handleGotIt(insight.insight_id)}
                      isLoading={actionLoadingId === insight.insight_id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Coming up */}
            {data?.upcoming_commitments && data.upcoming_commitments.large_upcoming_bills.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  COMING UP
                </h2>
                <div className="space-y-3">
                  {data.upcoming_commitments.large_upcoming_bills.slice(0, 3).map((bill, i) => (
                    <OKCard
                      key={i}
                      insight={{
                        insight_id: `upcoming-${i}`,
                        insight_type: 'upcoming_commitment',
                        title: `${bill.contact || bill.invoice_number || 'Payment'} due ${new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                        severity: 'medium',
                        confidence_level: 'high',
                        summary: `$${(bill.amount_due ?? 0).toLocaleString()} due soon`,
                        why_it_matters: `This payment is due in the coming days. Ensure sufficient cash is available.`,
                        recommended_actions: ['Review cash position', 'Confirm payment timing'],
                        supporting_numbers: [{ label: 'Amount', value: `$${(bill.amount_due ?? 0).toLocaleString()}` }],
                        generated_at: new Date().toISOString(),
                        is_acknowledged: false,
                        is_marked_done: false,
                      }}
                      isExpanded={expandedCardId === `upcoming-${i}`}
                      onExpand={() => setExpandedCardId(expandedCardId === `upcoming-${i}` ? null : `upcoming-${i}`)}
                      isLoading={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Resolved */}
            {resolvedInsights.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  RESOLVED
                </h2>
                <div className="rounded-tl-2xl rounded-bl-2xl rounded-tr-lg rounded-br-lg border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4 space-y-3">
                  {resolvedInsights.map((insight) => (
                    <div
                      key={insight.insight_id}
                      className="flex items-center gap-3"
                    >
                      {insight.is_marked_done ? (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_472_401)">
                            <path d="M14.6667 7.3904V8.00373C14.6659 9.44135 14.2004 10.8402 13.3396 11.9916C12.4788 13.1431 11.2689 13.9854 9.89028 14.393C8.51166 14.8006 7.03821 14.7517 5.68969 14.2535C4.34116 13.7552 3.18981 12.8345 2.40735 11.6284C1.62488 10.4224 1.25323 8.99578 1.34783 7.56128C1.44242 6.12678 1.99818 4.76129 2.93223 3.66845C3.86628 2.57561 5.12856 1.81399 6.53083 1.49717C7.9331 1.18034 9.40022 1.32529 10.7134 1.9104M14.6667 2.66659L8.00004 9.33992L6.00004 7.33992" stroke="#17B26A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                          <defs>
                            <clipPath id="clip0_472_401">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0 text-text-quaternary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="min-w-0 flex-1 break-words text-sm font-medium text-text-primary-900">{insight.title}</span>
                      <span className="text-xs text-text-quaternary-500">
                        {insight.is_marked_done ? 'Resolved' : 'Acknowledged'}
                      </span>
                      <span className="text-xs text-text-quaternary-500">
                        {new Date(insight.generated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        {settings?.xero_integration?.is_connected && (
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-text-quaternary-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#079455]"></span>
            <span className="text-[#079455]">Connected to Xero</span>
            <span className="text-[#079455]">•</span>
            <span className="text-text-quaternary-500">Read-only</span>
            {data?.calculated_at && (
              <>
                <span className="text-[#079455]">•</span>
                <span className="text-text-quaternary-500">Synced {formatDate(data.calculated_at)}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Xero Connect Modal */}
      <XeroConnectModal
        isOpen={showXeroModal}
        onClose={() => setShowXeroModal(false)}
      />

      {/* Insight Generation Modal */}
      <InsightGenerationModal
        isOpen={showInsightModal}
        onClose={() => {
          setShowInsightModal(false)
          setTriggerTimestamp(undefined)
        }}
        onComplete={handleInsightGenerationComplete}
        triggeredAt={triggerTimestamp}
      />

      {/* Feedback Modal */}
      <InsightFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })}
        onSubmit={handleFeedbackSubmit}
        isPositive={feedbackModal.isPositive}
      />
    </div>
  )
}
