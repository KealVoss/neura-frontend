'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/lib/api/client'
import XeroConnectModal from '@/components/XeroConnectModal'

interface CashRunwayMetrics {
  current_cash: number
  monthly_burn_rate: number
  runway_months: number | null
  status: string
  confidence_level?: string
}

interface CashPressureMetrics {
  status: string
  confidence: string
}

interface ProfitabilityMetrics {
  revenue?: number
  gross_margin_pct?: number
  net_profit?: number
  risk_level: string
}

interface Insight {
  insight_id: string
  insight_type: string
  title: string
  severity: string
  confidence_level: string
  summary: string
  why_it_matters: string
  recommended_actions: string[]
  supporting_numbers: Array<{ label: string; value: string | number }>
  data_notes?: string
  generated_at: string
  is_acknowledged: boolean
  is_marked_done: boolean
}

interface UpcomingCommitmentsMetrics {
  upcoming_amount: number
  upcoming_count: number
  days_ahead: number
  large_upcoming_bills: Array<{ label: string; amount: number; due_date: string }>
  squeeze_risk: string
}

interface InsightsResponse {
  cash_runway: CashRunwayMetrics | null
  cash_pressure: CashPressureMetrics | null
  profitability: ProfitabilityMetrics | null
  upcoming_commitments: UpcomingCommitmentsMetrics | null
  insights: Insight[]
  calculated_at: string | null
}

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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [dataQuality, setDataQuality] = useState<'Good' | 'Mixed' | 'Low'>('Good')
  const [generating, setGenerating] = useState(false)
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [showXeroModal, setShowXeroModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      const data = await apiRequest<SettingsData>('/settings/')
      setSettings(data)
    } catch (err: any) {
      // Silently fail - settings not critical for dashboard
    }
  }

  // Calculate Business Health Score (0-100)
  const calculateHealthScore = (): number => {
    if (!data) return 0

    let score = 50 // Base score

    // Cash runway contribution (0-30 points)
    if (data.cash_runway) {
      const status = data.cash_runway.status
      if (status === 'healthy') score += 30
      else if (status === 'warning') score += 15
      else if (status === 'critical') score += 5
      else if (status === 'negative') score -= 20
      // infinite (profitable) gets full points
      if (status === 'infinite') score += 30
    }

    // Cash pressure contribution (0-25 points)
    if (data.cash_pressure) {
      const status = data.cash_pressure.status
      if (status === 'GREEN') score += 25
      else if (status === 'AMBER') score += 12
      else if (status === 'RED') score -= 10
    }

    // Profitability contribution (0-25 points)
    if (data.profitability) {
      const risk = data.profitability.risk_level
      if (risk === 'low') score += 25
      else if (risk === 'medium') score += 10
      else if (risk === 'high') score -= 10
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score))
  }

  const healthScore = calculateHealthScore()
  const healthStatus = healthScore >= 60 ? 'Healthy' : healthScore >= 40 ? 'At Risk' : 'Take Action'
  const healthStatusColor = healthScore >= 60 ? '#079455' : healthScore >= 40 ? '#f59e0b' : '#d92d20'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (dateOnly.getTime() === today.getTime()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase()}`
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleResolve = async (insightId: string) => {
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_marked_done: true }),
      })
      // Refresh data
      const response = await apiRequest<InsightsResponse>('/api/insights')
      setData(response)
      setExpandedCardId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to resolve insight')
    }
  }

  const handleGotIt = async (insightId: string) => {
    try {
      await apiRequest(`/api/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_acknowledged: true }),
      })
      // Refresh data
      const response = await apiRequest<InsightsResponse>('/api/insights')
      setData(response)
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge insight')
    }
  }

  const handleGenerateInsights = async () => {
    // Check if Xero is connected first
    const xeroConnected = settings?.xero_integration?.is_connected
    if (!xeroConnected) {
      setShowXeroModal(true)
      return
    }

    try {
      setGenerating(true)
      setError(null)
      await apiRequest('/api/insights/trigger', {
        method: 'POST',
      })
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiRequest<InsightsResponse>('/api/insights/')
          if (response.insights.length > 0) {
            setData(response)
            
            // Update data quality
            const hasLowConfidence = response.cash_runway?.confidence_level === 'Low' || 
                                     response.cash_pressure?.confidence === 'low'
            const hasMediumConfidence = response.cash_runway?.confidence_level === 'Medium' || 
                                        response.cash_pressure?.confidence === 'medium'
            
            if (hasLowConfidence) {
              setDataQuality('Low')
            } else if (hasMediumConfidence) {
              setDataQuality('Mixed')
            } else {
              setDataQuality('Good')
            }
            
            setGenerating(false)
            clearInterval(pollInterval)
          }
        } catch (err) {
          // Continue polling
        }
      }, 2000)
      
      // Stop polling after 60 seconds
      setTimeout(async () => {
        clearInterval(pollInterval)
        setGenerating(false)
        // Refresh data one more time
        try {
          const response = await apiRequest<InsightsResponse>('/api/insights/')
          setData(response)
          
          // Update data quality
          const hasLowConfidence = response.cash_runway?.confidence_level === 'Low' || 
                                   response.cash_pressure?.confidence === 'low'
          const hasMediumConfidence = response.cash_runway?.confidence_level === 'Medium' || 
                                      response.cash_pressure?.confidence === 'medium'
          
          if (hasLowConfidence) {
            setDataQuality('Low')
          } else if (hasMediumConfidence) {
            setDataQuality('Mixed')
          } else {
            setDataQuality('Good')
          }
        } catch (err) {
          // Ignore errors on final refresh
        }
      }, 60000)
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights')
      setGenerating(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest<InsightsResponse>('/api/insights')
      setData(response)
      
      // Determine data quality based on confidence levels
      const hasLowConfidence = response.cash_runway?.confidence_level === 'Low' || 
                               response.cash_pressure?.confidence === 'low'
      const hasMediumConfidence = response.cash_runway?.confidence_level === 'Medium' || 
                                  response.cash_pressure?.confidence === 'medium'
      
      if (hasLowConfidence) {
        setDataQuality('Low')
      } else if (hasMediumConfidence) {
        setDataQuality('Mixed')
      } else {
        setDataQuality('Good')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-md text-text-secondary-700">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Middleware will redirect
  }

  // Check if we have no insights
  const hasNoInsights = !data || data.insights.length === 0

  // Filter insights by severity and status
  const watchInsights = data?.insights.filter(
    i => i.severity === 'high' && !i.is_marked_done
  ).slice(0, 3) || []

  const okInsights = data?.insights.filter(
    i => i.severity === 'medium' && !i.is_marked_done
  ) || []

  const resolvedInsights = data?.insights.filter(
    i => i.is_marked_done
  ).slice(0, 5) || []

  // Calculate breakdown metrics from actual data
  // Cash Position: Based on runway status (higher runway = better score)
  const getCashPositionScore = (): number => {
    if (!data?.cash_runway) return 0
    const status = data.cash_runway.status
    if (status === 'infinite' || status === 'healthy') return 85
    if (status === 'warning') return 65
    if (status === 'critical') return 45
    return 25 // negative
  }

  // Revenue: Based on profitability risk
  const getRevenueScore = (): number => {
    if (!data?.profitability) return 0
    const risk = data.profitability.risk_level
    if (risk === 'low') return 85
    if (risk === 'medium') return 65
    return 45 // high
  }

  // Expenses: Inverse of profitability risk (lower risk = better expense management)
  const getExpensesScore = (): number => {
    if (!data?.profitability) return 0
    const risk = data.profitability.risk_level
    if (risk === 'low') return 80
    if (risk === 'medium') return 60
    return 40 // high
  }

  const cashPositionScore = getCashPositionScore()
  const revenueScore = getRevenueScore()
  const expensesScore = getExpensesScore()

  // Determine trend arrow colors (green = good, orange = warning, gray = neutral)
  const getCashTrend = () => {
    if (!data?.cash_runway) return { icon: '→', color: 'text-text-quaternary-500' }
    const status = data.cash_runway.status
    if (status === 'infinite' || status === 'healthy') return { icon: '↑', color: 'text-[#079455]' }
    if (status === 'warning') return { icon: '→', color: 'text-[#f59e0b]' }
    return { icon: '↓', color: 'text-[#d92d20]' }
  }

  const getRevenueTrend = () => {
    if (!data?.profitability) return { icon: '→', color: 'text-text-quaternary-500' }
    const risk = data.profitability.risk_level
    if (risk === 'low') return { icon: '↑', color: 'text-[#079455]' }
    if (risk === 'medium') return { icon: '→', color: 'text-[#f59e0b]' }
    return { icon: '↓', color: 'text-[#d92d20]' }
  }

  const getExpensesTrend = () => {
    if (!data?.profitability) return { icon: '→', color: 'text-text-quaternary-500' }
    const risk = data.profitability.risk_level
    // Lower risk = better expense management = good outcome
    if (risk === 'low') return { icon: '→', color: 'text-[#079455]' }
    if (risk === 'medium') return { icon: '→', color: 'text-[#f59e0b]' }
    return { icon: '↑', color: 'text-[#d92d20]' } // High risk = expenses going up = bad
  }

  const cashTrend = getCashTrend()
  const revenueTrend = getRevenueTrend()
  const expensesTrend = getExpensesTrend()

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-6">
        {/* Header */}
        <div className="mb-8">
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
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  dataQuality === 'Good' ? 'bg-[#079455] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                }`}>
                  Good
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  dataQuality === 'Mixed' ? 'bg-[#f59e0b] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                }`}>
                  Mixed
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  dataQuality === 'Low' ? 'bg-[#d92d20] text-white' : 'bg-bg-secondary-subtle text-text-quaternary-500'
                }`}>
                  Low
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-bg-error-secondary p-3 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        {/* Empty State */}
        {hasNoInsights && !loading && (
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
                disabled={generating}
                className="rounded-md bg-bg-brand-solid px-6 py-2.5 text-sm font-semibold text-text-white transition-colors hover:bg-fg-brand-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate insights'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!hasNoInsights && (
        <div className="space-y-8">
          {/* Business Health Score Card */}
          <section>
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                  BUSINESS HEALTH SCORE
                </h2>
                <Link
                  href="/dashboard/health-score"
                  className="text-sm font-medium text-text-brand-tertiary-600 hover:underline"
                >
                  View details &gt;
                </Link>
              </div>
              
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-5xl font-bold text-text-brand-tertiary-600">
                  {healthScore}
                </span>
                <span className="text-lg text-text-quaternary-500">/100</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: healthStatusColor }}
                >
                  {healthStatus}
                </span>
              </div>

              <p className="mb-6 text-sm text-text-secondary-700">
                {healthScore >= 60
                  ? 'Your business is performing well with stable cash flow and manageable risks. A few items need attention but nothing urgent.'
                  : healthScore >= 40
                  ? 'Your business shows some areas of concern. Monitor cash flow closely and address key issues promptly.'
                  : 'Your business requires immediate attention. Take action on critical issues to improve financial health.'}
              </p>

              {/* Score Breakdown */}
              <div className="mb-4 grid grid-cols-3 gap-4 border-t border-border-secondary pt-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary-900">Cash position</span>
                    <span className={`text-sm font-semibold ${cashTrend.color}`}>
                      {cashTrend.icon === '↑' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : cashTrend.icon === '↓' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary-900">{Math.round(cashPositionScore)}</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary-900">Revenue</span>
                    <span className={`text-sm font-semibold ${revenueTrend.color}`}>
                      {revenueTrend.icon === '↑' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : revenueTrend.icon === '↓' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary-900">{Math.round(revenueScore)}</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary-900">Expenses</span>
                    <span className={`text-sm font-semibold ${expensesTrend.color}`}>
                      {expensesTrend.icon === '↑' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : expensesTrend.icon === '↓' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary-900">{Math.round(expensesScore)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-text-quaternary-500">
                <span>Updated daily</span>
                <span>•</span>
                <span>Medium confidence</span>
              </div>
            </div>
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
                    calculatedAt={data?.calculated_at || null}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Also worth knowing */}
          {okInsights.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                <span className="h-0.5 w-8 bg-text-brand-tertiary-600"></span>
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
                  />
                ))}
              </div>
            </section>
          )}

          {/* Coming up */}
          {data?.upcoming_commitments && data.upcoming_commitments.large_upcoming_bills.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                <span className="h-0.5 w-8 bg-text-brand-tertiary-600"></span>
                COMING UP
              </h2>
              <div className="space-y-3">
                {data.upcoming_commitments.large_upcoming_bills.slice(0, 3).map((bill, i) => (
                  <OKCard
                    key={i}
                    insight={{
                      insight_id: `upcoming-${i}`,
                      insight_type: 'upcoming_commitment',
                      title: `${bill.label || 'Payment'} due ${new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                      severity: 'medium',
                      confidence_level: 'high',
                      summary: `$${bill.amount.toLocaleString()} due soon`,
                      why_it_matters: `This payment is due in the coming days. Ensure sufficient cash is available.`,
                      recommended_actions: ['Review cash position', 'Confirm payment timing'],
                      supporting_numbers: [{ label: 'Amount', value: `$${bill.amount.toLocaleString()}` }],
                      generated_at: new Date().toISOString(),
                      is_acknowledged: false,
                      is_marked_done: false,
                    }}
                    isExpanded={expandedCardId === `upcoming-${i}`}
                    onExpand={() => setExpandedCardId(expandedCardId === `upcoming-${i}` ? null : `upcoming-${i}`)}
                    onGotIt={() => {}}
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
              <div className="space-y-2">
                {resolvedInsights.map((insight) => (
                  <div
                    key={insight.insight_id}
                    className="flex items-center gap-3 py-2"
                  >
                    <svg className="h-5 w-5 shrink-0 text-text-brand-tertiary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="min-w-0 flex-1 break-words text-sm font-medium text-text-primary-900">{insight.title}</span>
                    <span className="text-xs text-text-quaternary-500">Resolved</span>
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
    </div>
  )
}

// WATCH Card Component
function WatchCard({
  insight,
  isExpanded,
  onExpand,
  onResolve,
  calculatedAt,
}: {
  insight: Insight
  isExpanded: boolean
  onExpand: () => void
  onResolve: () => void
  calculatedAt: string | null
}) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (dateOnly.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase()}`
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Extract timeframe from supporting numbers (e.g., "Days until tight ~12")
  const timeframe = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('day') || n.label.toLowerCase().includes('timeframe')
  )

  return (
    <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#f59e0b] px-2 py-0.5 text-xs font-semibold text-white">
              WATCH
            </span>
            <span className="rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-2 py-0.5 text-xs text-text-primary-900">
              {insight.confidence_level === 'high' ? 'High' : insight.confidence_level === 'medium' ? 'Medium' : 'Low'} confidence
            </span>
          </div>
          <h3 className="mb-1 break-words text-sm font-semibold text-text-primary-900">{insight.title}</h3>
          <p className="mb-3 break-words text-sm leading-relaxed text-text-secondary-700">{insight.summary}</p>
          
          {!isExpanded && (
            <button
              onClick={onExpand}
              className="flex items-center gap-1 text-sm text-text-brand-tertiary-600 hover:underline"
            >
              How we worked this out
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {timeframe && (
            <div className="flex items-center gap-1.5 text-sm text-text-quaternary-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{typeof timeframe.value === 'number' ? `~${timeframe.value} days` : timeframe.value}</span>
            </div>
          )}
          <button
            onClick={onResolve}
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap"
          >
            Resolve
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-border-secondary pt-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              WHAT WE'RE SEEING
            </h4>
            <ul className="space-y-1 text-sm leading-relaxed text-text-secondary-700">
              {insight.why_it_matters.split('\n').map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-primary-900"></span>
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              INPUTS USED
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-border-secondary bg-bg-primary px-2 py-1 text-xs text-text-primary-900">
                Bank transactions (90 days)
              </span>
              <span className="rounded-md border border-border-secondary bg-bg-primary px-2 py-1 text-xs text-text-primary-900">
                Outstanding invoices
              </span>
              <span className="rounded-md border border-border-secondary bg-bg-primary px-2 py-1 text-xs text-text-primary-900">
                Recurring expenses
              </span>
            </div>
          </div>

          {insight.supporting_numbers.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                KEY NUMBERS
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {insight.supporting_numbers.map((num, i) => (
                  <div key={i}>
                    <div className="text-xs text-text-quaternary-500">{num.label}</div>
                    <div className="text-sm font-semibold text-text-primary-900">{num.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border-secondary pt-4 text-xs text-text-quaternary-500">
            <span>Based on last 90 days</span>
            <span>Updated {formatDate(calculatedAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-quaternary-500">Helpful?</span>
            <button className="rounded-md p-1 hover:bg-bg-secondary">
              <svg className="h-4 w-4 text-text-quaternary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v5m7 0l-5 5m5-5l-5-5" />
              </svg>
            </button>
            <button className="rounded-md p-1 hover:bg-bg-secondary">
              <svg className="h-4 w-4 text-text-quaternary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .966-.18 1.32-.51l3.76-3.76c.19-.19.3-.45.3-.71V14a2 2 0 00-2-2h-5m-5 0V5a2 2 0 012-2h4a2 2 0 012 2v5m-5 0l5 5m-5-5l5-5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// OK Card Component
function OKCard({
  insight,
  isExpanded,
  onExpand,
  onGotIt,
}: {
  insight: Insight
  isExpanded: boolean
  onExpand: () => void
  onGotIt: () => void
}) {
  return (
    <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-primary-900">
            OK
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold text-text-primary-900">{insight.title}</h3>
            <p className="break-words text-xs leading-relaxed text-text-quaternary-500">{insight.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onGotIt}
            className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary"
          >
            Got it
          </button>
          <button
            onClick={onExpand}
            className="rounded-md p-1.5 text-text-primary-900 hover:bg-bg-secondary"
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-border-secondary pt-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              WHAT WE'RE SEEING
            </h4>
            <p className="break-words text-sm leading-relaxed text-text-secondary-700">{insight.why_it_matters}</p>
          </div>

          {insight.recommended_actions.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                RECOMMENDED ACTIONS
              </h4>
              <ul className="space-y-1 text-sm leading-relaxed text-text-secondary-700">
                {insight.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-primary-900"></span>
                    <span className="break-words">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
