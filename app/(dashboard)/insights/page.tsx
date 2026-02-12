'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { apiRequest } from '@/lib/api/client'
import { useInsightsStore } from '@/stores/insightsStore'
import { DashboardSkeleton } from '@/components/DashboardSkeleton'
import InsightFeedbackModal from '@/components/InsightFeedbackModal'
import WatchCard from '@/components/WatchCard'
import OKCard from '@/components/OKCard'

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()

  const {
    insights,
    pagination,
    isLoading,
    currentPage,
    severityFilter,
    statusFilter,
    fetchInsights,
    setPage,
    setSeverityFilter,
    setStatusFilter,
  } = useInsightsStore()

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; insightId: string; isPositive: boolean }>({
    isOpen: false,
    insightId: '',
    isPositive: true,
  })
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Fetch insights once when user is available
  useEffect(() => {
    if (user) {
      fetchInsights()
    }
  }, [user, fetchInsights])

  // Filter by status on frontend (backend doesn't have this filter)
  const filteredInsights = useMemo(() => {
    if (statusFilter === 'active') {
      return insights.filter(i => !i.is_marked_done)
    } else if (statusFilter === 'resolved') {
      return insights.filter(i => i.is_marked_done)
    }
    return insights
  }, [insights, statusFilter])

  const handleResolve = async (insightId: string) => {
    if (actionLoadingId) return
    setActionLoadingId(insightId)
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_marked_done: true }),
      })
      showToast('Insight marked as resolved', 'success')
      fetchInsights()
      setExpandedCardId(null)
    } catch {
      showToast('Failed to resolve insight', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleGotIt = async (insightId: string) => {
    if (actionLoadingId) return
    setActionLoadingId(insightId)
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_acknowledged: true }),
      })
      showToast('Insight acknowledged', 'success')
      fetchInsights()
    } catch {
      showToast('Failed to acknowledge insight', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleFeedbackSubmit = async (feedbackText: string) => {
    try {
      const insight = insights.find(i => i.insight_id === feedbackModal.insightId)
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

      setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })
      showToast('Thank you for your feedback!', 'success')
    } catch {
      showToast('Failed to submit feedback. Please try again.', 'error')
    }
  }

  if (authLoading || isLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-[800px] py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-text-brand-tertiary-600" />
            <h1 className="text-display-md text-text-primary-900 font-bold">All Insights</h1>
          </div>
          <p className="text-sm text-text-quaternary-500 ml-4">
            {pagination.total} {pagination.total === 1 ? 'insight' : 'insights'} total
          </p>
        </div>

        {/* Filters Row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="relative group">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="appearance-none rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary pl-4 pr-10 py-2 text-sm font-medium text-text-primary-900 cursor-pointer hover:border-text-brand-tertiary-600 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-2 focus:ring-text-brand-tertiary-600/20 transition-all"
            >
              <option value="all">All Severities</option>
              <option value="high">High (WATCH)</option>
              <option value="medium">Medium (OK)</option>
              <option value="low">Low</option>
            </select>
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-quaternary-500 pointer-events-none group-hover:text-text-brand-tertiary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary pl-4 pr-10 py-2 text-sm font-medium text-text-primary-900 cursor-pointer hover:border-text-brand-tertiary-600 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-2 focus:ring-text-brand-tertiary-600/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-quaternary-500 pointer-events-none group-hover:text-text-brand-tertiary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Insights List - ordered by recency (most recent first) */}
        {filteredInsights.length === 0 ? (
          <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle p-12 text-center">
            <p className="text-text-secondary-700">No insights found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInsights.map((insight) => (
              insight.severity === 'high' ? (
                <WatchCard
                  key={insight.insight_id}
                  insight={insight}
                  isExpanded={expandedCardId === insight.insight_id}
                  onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                  onResolve={() => handleResolve(insight.insight_id)}
                  onFeedback={(isPositive) => setFeedbackModal({ isOpen: true, insightId: insight.insight_id, isPositive })}
                  calculatedAt={null}
                  isLoading={actionLoadingId === insight.insight_id}
                />
              ) : (
                <OKCard
                  key={insight.insight_id}
                  insight={insight}
                  isExpanded={expandedCardId === insight.insight_id}
                  onExpand={() => setExpandedCardId(expandedCardId === insight.insight_id ? null : insight.insight_id)}
                  onGotIt={() => handleGotIt(insight.insight_id)}
                  isLoading={actionLoadingId === insight.insight_id}
                />
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let pageNum: number
                if (pagination.total_pages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= pagination.total_pages - 2) {
                  pageNum = pagination.total_pages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${pageNum === currentPage
                      ? 'bg-bg-brand-solid text-text-white'
                      : 'border border-border-primary bg-bg-primary text-text-primary-900 hover:bg-bg-secondary'
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pagination.total_pages}
              className="rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Page info */}
        {pagination.total_pages > 1 && (
          <p className="mt-3 text-center text-xs text-text-secondary-700">
            Page {currentPage} of {pagination.total_pages}
          </p>
        )}

        {/* Feedback Modal */}
        <InsightFeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, insightId: '', isPositive: true })}
          onSubmit={handleFeedbackSubmit}
          isPositive={feedbackModal.isPositive}
        />
      </div>
    </div>
  )
}
