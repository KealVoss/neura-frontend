'use client'

import { useEffect, useState } from 'react'
import { useAdminStore, OrganizationSummary, FeedbackItem } from '@/stores/adminStore'
import { Skeleton } from '@/components/Skeleton'

// Tab type
type TabId = 'organizations' | 'feedback'

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    IDLE: 'bg-utility-gray-200 text-text-secondary-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED: 'bg-bg-success-secondary text-icon-success',
    FAILED: 'bg-bg-error-secondary text-icon-error',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.IDLE}`}>
      {status}
    </span>
  )
}

// Stat card component
function StatCard({ label, value, subtext }: { label: string; value: number | string; subtext?: string }) {
  return (
    <div className="rounded-xl border border-border-secondary bg-bg-secondary p-4">
      <p className="text-sm text-text-quaternary-500">{label}</p>
      <p className="text-2xl font-semibold text-text-primary-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-icon-error mt-1">{subtext}</p>}
    </div>
  )
}

// Organization row
function OrganizationRow({ org }: { org: OrganizationSummary }) {
  const formattedDate = org.created_at
    ? new Date(org.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '-'

  const lastSync = org.last_sync_at
    ? new Date(org.last_sync_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

  return (
    <tr className="border-b border-border-secondary hover:bg-bg-secondary transition-colors">
      <td className="py-3 px-4">
        <div>
          <p className="text-sm font-medium text-text-primary-900">{org.name}</p>
          <p className="text-xs text-text-quaternary-500">{org.user_email}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={org.sync_status} />
        {org.sync_status === 'FAILED' && org.last_sync_error && (
          <p className="text-xs text-icon-error mt-1 truncate max-w-[200px]" title={org.last_sync_error}>
            {org.last_sync_error}
          </p>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={`text-sm ${org.has_xero_connection ? 'text-icon-success' : 'text-text-quaternary-500'}`}>
          {org.has_xero_connection ? 'Connected' : 'Not connected'}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-text-secondary-700">{lastSync}</td>
      <td className="py-3 px-4 text-sm text-text-quaternary-500">{formattedDate}</td>
    </tr>
  )
}

// Feedback row with expandable details
function FeedbackRow({ feedback }: { feedback: FeedbackItem }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const formattedDate = new Date(feedback.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      <tr 
        className="border-b border-border-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {/* Expand/collapse indicator */}
            <svg 
              className={`h-4 w-4 text-text-quaternary-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-text-primary-900 truncate max-w-[280px]">
                {feedback.insight_title}
              </p>
              <p className="text-xs text-text-quaternary-500">{feedback.insight_type}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
            feedback.is_helpful 
              ? 'bg-bg-success-secondary text-icon-success' 
              : 'bg-bg-error-secondary text-icon-error'
          }`}>
            {feedback.is_helpful ? (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
              </svg>
            )}
            {feedback.is_helpful ? 'Helpful' : 'Not Helpful'}
          </span>
        </td>
        <td className="py-3 px-4">
          {feedback.comment ? (
            <p className="text-sm text-text-secondary-700 truncate max-w-[220px]">
              {feedback.comment}
            </p>
          ) : (
            <span className="text-sm text-text-quaternary-500 italic">No comment</span>
          )}
        </td>
        <td className="py-3 px-4 text-sm text-text-quaternary-500">{formattedDate}</td>
      </tr>
      
      {/* Expanded details row */}
      {isExpanded && (
        <tr className="bg-bg-secondary">
          <td colSpan={4} className="px-4 py-4">
            <div className="ml-6 space-y-4">
              {/* Full Insight Title */}
              <div>
                <h4 className="text-xs font-semibold text-text-quaternary-500 uppercase tracking-wide mb-1">
                  Insight Title
                </h4>
                <p className="text-sm text-text-primary-900">{feedback.insight_title}</p>
              </div>
              
              {/* Insight Type */}
              <div>
                <h4 className="text-xs font-semibold text-text-quaternary-500 uppercase tracking-wide mb-1">
                  Insight Type
                </h4>
                <p className="text-sm text-text-primary-900">{feedback.insight_type}</p>
              </div>
              
              {/* Full Comment */}
              <div>
                <h4 className="text-xs font-semibold text-text-quaternary-500 uppercase tracking-wide mb-1">
                  User Comment
                </h4>
                {feedback.comment ? (
                  <p className="text-sm text-text-secondary-700 whitespace-pre-wrap bg-bg-primary rounded-lg p-3 border border-border-secondary">
                    {feedback.comment}
                  </p>
                ) : (
                  <p className="text-sm text-text-quaternary-500 italic">No comment provided</p>
                )}
              </div>
              
              {/* Metadata */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-border-secondary">
                <div>
                  <h4 className="text-xs font-semibold text-text-quaternary-500 uppercase tracking-wide mb-1">
                    Insight ID
                  </h4>
                  <p className="text-xs text-text-tertiary-600 font-mono">{feedback.insight_id}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-quaternary-500 uppercase tracking-wide mb-1">
                    Organization ID
                  </h4>
                  <p className="text-xs text-text-tertiary-600 font-mono">{feedback.organization_id}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-quaternary-500 uppercase tracking-wide mb-1">
                    Submitted
                  </h4>
                  <p className="text-xs text-text-tertiary-600">{formattedDate}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// Feedback summary stats
function FeedbackSummaryStats() {
  const { feedbackSummary, isFeedbackLoading } = useAdminStore()

  if (isFeedbackLoading || !feedbackSummary) {
    return null
  }

  const { overall_stats } = feedbackSummary

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Feedback" value={overall_stats.total_feedback} />
      <StatCard label="Helpful" value={overall_stats.helpful_count} />
      <StatCard label="Not Helpful" value={overall_stats.not_helpful_count} />
      <StatCard label="Helpful Rate" value={`${overall_stats.helpful_percentage}%`} />
    </div>
  )
}

// Main admin dashboard
export default function AdminDashboardPage() {
  const {
    dashboard,
    isDashboardLoading,
    dashboardError,
    feedbackList,
    feedbackTotal,
    isFeedbackListLoading,
    feedbackListError,
    fetchDashboard,
    fetchFeedbackSummary,
    fetchFeedbackList,
  } = useAdminStore()

  const [activeTab, setActiveTab] = useState<TabId>('organizations')
  const [feedbackPage, setFeedbackPage] = useState(1)
  const feedbackLimit = 20

  useEffect(() => {
    fetchDashboard()
    fetchFeedbackSummary()
  }, [fetchDashboard, fetchFeedbackSummary])

  // Fetch feedback list when switching to feedback tab or changing page
  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchFeedbackList(feedbackLimit, (feedbackPage - 1) * feedbackLimit)
    }
  }, [activeTab, feedbackPage, fetchFeedbackList])

  const totalFeedbackPages = Math.ceil(feedbackTotal / feedbackLimit)

  if (isDashboardLoading && !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (dashboardError && !dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-icon-error mb-4">{dashboardError}</p>
        <button
          onClick={() => fetchDashboard()}
          className="px-4 py-2 bg-brand-solid text-text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const { stats, organizations } = dashboard

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display-xs font-bold text-text-primary-900">Admin Dashboard</h1>
        <p className="text-text-quaternary-500 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Organizations" value={stats.total_organizations} />
        <StatCard label="Xero Connected" value={stats.active_xero_connections} />
        <StatCard label="Syncs Running" value={stats.syncs_in_progress} />
        <StatCard 
          label="Failed Syncs" 
          value={stats.failed_syncs}
          subtext={stats.failed_syncs > 0 ? 'Needs attention' : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border-secondary">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'organizations'
                ? 'border-brand-solid text-brand-600'
                : 'border-transparent text-text-quaternary-500 hover:text-text-secondary-700'
            }`}
          >
            Organizations
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'feedback'
                ? 'border-brand-solid text-brand-600'
                : 'border-transparent text-text-quaternary-500 hover:text-text-secondary-700'
            }`}
          >
            Feedback
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'organizations' && (
        <div className="rounded-xl border border-border-secondary bg-bg-primary overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Organization</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Sync Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Xero</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Last Sync</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <OrganizationRow key={org.id} org={org} />
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-quaternary-500">
                      No organizations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Feedback Summary Stats */}
          <FeedbackSummaryStats />

          {/* Feedback List */}
          <div className="rounded-xl border border-border-secondary bg-bg-primary overflow-hidden">
            <div className="px-4 py-3 border-b border-border-secondary">
              <h3 className="text-sm font-medium text-text-primary-900">
                All Feedback ({feedbackTotal})
              </h3>
            </div>
            
            {isFeedbackListLoading ? (
              <div className="p-8">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : feedbackListError ? (
              <div className="p-8 text-center">
                <p className="text-icon-error">{feedbackListError}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-bg-secondary">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            Insight
                            <span className="text-text-tertiary-600 normal-case font-normal">(click to expand)</span>
                          </span>
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Rating</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Comment</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-text-quaternary-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackList.map((feedback) => (
                        <FeedbackRow key={feedback.id} feedback={feedback} />
                      ))}
                      {feedbackList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-text-quaternary-500">
                            No feedback collected yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalFeedbackPages > 1 && (
                  <div className="px-4 py-3 border-t border-border-secondary flex items-center justify-between">
                    <p className="text-sm text-text-quaternary-500">
                      Page {feedbackPage} of {totalFeedbackPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFeedbackPage(p => Math.max(1, p - 1))}
                        disabled={feedbackPage === 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-border-secondary text-text-secondary-700 hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setFeedbackPage(p => Math.min(totalFeedbackPages, p + 1))}
                        disabled={feedbackPage === totalFeedbackPages}
                        className="px-3 py-1.5 text-sm rounded-lg border border-border-secondary text-text-secondary-700 hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
