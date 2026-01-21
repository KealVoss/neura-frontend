'use client'

import { useState } from 'react'

interface CategoryScore {
  category_id: string
  name: string
  max_points: number
  points_awarded: number
  metrics: string[]
}

interface Driver {
  metric_id: string
  label: string
  impact_points: number
  why_it_matters: string
  recommended_action: string
}

interface SubScore {
  metric_id: string
  name: string
  max_points: number
  points_awarded: number
  status: 'ok' | 'missing' | 'estimated'
  value: number | null
  formula: string
  inputs_used: string[]
}

interface HealthScoreData {
  schema_version: string
  generated_at: string
  scorecard: {
    raw_score: number
    confidence: 'high' | 'medium' | 'low'
    confidence_cap: number
    final_score: number
    grade: 'A' | 'B' | 'C' | 'D'
  }
  category_scores: {
    A: CategoryScore
    B: CategoryScore
    C: CategoryScore
    D: CategoryScore
    E: CategoryScore
  }
  subscores: Record<string, SubScore>
  drivers: {
    top_positive: Driver[]
    top_negative: Driver[]
  }
  data_quality: {
    signals: Array<{
      signal_id: string
      severity: 'info' | 'warning' | 'critical'
      message: string
    }>
    warnings: string[]
  }
  key_metrics?: {
    current_cash: number
    monthly_burn: number
    runway_months: number | null
    data_period_days: number
    period_label: string
  }
  why_this_matters?: string
  assumptions?: string[]
}

interface HealthScoreCardProps {
  data: HealthScoreData | null
  isLoading?: boolean
  onRefresh?: () => void
}

const gradeConfig = {
  A: {
    label: 'Healthy',
    description: 'Your business is performing excellently with strong cash flow and low risks.',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    textClass: 'text-green-600 dark:text-green-400',
  },
  B: {
    label: 'Healthy',
    description: 'Your business is performing well with stable cash flow and manageable risks. A few items need attention but nothing urgent.',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    textClass: 'text-green-600 dark:text-green-400',
  },
  C: {
    label: 'At Risk',
    description: 'Your business needs attention. Cash flow challenges and some risks require monitoring.',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  D: {
    label: 'Critical',
    description: 'Your business requires immediate attention. Significant cash flow and risk concerns.',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    textClass: 'text-red-600 dark:text-red-400',
  },
}

const confidenceConfig = {
  high: { label: 'High confidence' },
  medium: { label: 'Medium confidence' },
  low: { label: 'Low confidence' },
}

// Helper to get trend arrow for a score (relative to max)
function getTrendIcon(score: number, max: number) {
  const percentage = (score / max) * 100
  if (percentage >= 70) {
    return (
      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  } else if (percentage >= 50) {
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    )
  } else {
    return (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    )
  }
}

// Calculate runway months from score (fallback only)
function getRunwayMonths(score: number): number {
  if (score >= 80) return 6
  if (score >= 60) return 4
  if (score >= 40) return 2
  return 1
}

export default function HealthScoreCard({ data, isLoading, onRefresh }: HealthScoreCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Loading skeleton matching Figma layout
  if (isLoading) {
    return (
      <div className="bg-bg-primary rounded-xl border border-border-secondary p-6 animate-pulse">
        {/* Badges skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 bg-bg-secondary rounded-full w-16"></div>
          <div className="h-6 bg-bg-secondary rounded-full w-32"></div>
        </div>
        {/* Title skeleton */}
        <div className="h-7 bg-bg-secondary rounded w-48 mb-4"></div>
        {/* Score box skeleton */}
        <div className="border-l-4 border-l-bg-secondary bg-bg-secondary-subtle rounded-lg p-5 mb-4">
          <div className="h-12 bg-bg-secondary rounded w-24 mb-3"></div>
          <div className="h-4 bg-bg-secondary rounded w-full mb-4"></div>
          <div className="flex gap-8 mb-4">
            <div className="flex-1">
              <div className="h-3 bg-bg-secondary rounded w-20 mb-2"></div>
              <div className="h-6 bg-bg-secondary rounded w-12"></div>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-bg-secondary rounded w-16 mb-2"></div>
              <div className="h-6 bg-bg-secondary rounded w-12"></div>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-bg-secondary rounded w-18 mb-2"></div>
              <div className="h-6 bg-bg-secondary rounded w-12"></div>
            </div>
          </div>
          <div className="h-4 bg-bg-secondary rounded w-3/4"></div>
        </div>
        {/* Footer skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-bg-secondary rounded w-40"></div>
          <div className="h-9 bg-bg-secondary rounded w-28"></div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!data) {
    return (
      <div className="bg-bg-primary rounded-xl border border-border-secondary p-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-utility-gray-200 text-text-quaternary-500">
            --
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-border-secondary text-text-quaternary-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No data
          </span>
        </div>
        {/* Title */}
        <h2 className="text-xl font-semibold text-text-primary-900 mb-4">
          Business Health Score
        </h2>
        <div className="text-center py-8">
          <p className="text-text-quaternary-500 mb-4">
            No health score data available yet.
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-bg-brand-solid text-text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer"
            >
              Calculate Health Score
            </button>
          )}
        </div>
      </div>
    )
  }

  const { scorecard, category_scores, drivers, data_quality } = data
  const grade = gradeConfig[scorecard?.grade] ?? gradeConfig.D
  const confidence = confidenceConfig[scorecard?.confidence] ?? confidenceConfig.low

  // Type-safe category_scores with proper typing
  const typedCategoryScores: HealthScoreData['category_scores'] = category_scores ?? {
    A: { category_id: '', name: '', max_points: 1, points_awarded: 0, metrics: [] },
    B: { category_id: '', name: '', max_points: 1, points_awarded: 0, metrics: [] },
    C: { category_id: '', name: '', max_points: 1, points_awarded: 0, metrics: [] },
    D: { category_id: '', name: '', max_points: 1, points_awarded: 0, metrics: [] },
    E: { category_id: '', name: '', max_points: 1, points_awarded: 0, metrics: [] },
  }

  // Use actual runway_months from key_metrics if available, otherwise estimate from score
  const runwayMonths = data.key_metrics?.runway_months ?? getRunwayMonths(scorecard.final_score)

  // Get AI-generated descriptive text (backend provides this)
  const categoryAMetrics = typedCategoryScores.A?.metrics || []
  const whyThisMatters = data.why_this_matters || ""
  const assumptions = data.assumptions || []

  // Extract key metrics for the 3-box display (Cash, Revenue, Expenses from categories)
  // Default values handle case when health score hasn't been calculated yet
  const defaultScore: CategoryScore = { category_id: '', name: '', max_points: 1, points_awarded: 0, metrics: [] }
  const cashScore = typedCategoryScores.A ?? defaultScore
  const profitabilityScore = typedCategoryScores.B ?? defaultScore
  const liquidityScore = typedCategoryScores.D ?? defaultScore

  return (
    <>


      <div className="bg-bg-primary rounded-xl border border-brand-solid p-6">

        {/* Large Score Display */}
        <div className="mb-4">
          <span className={`text-5xl font-bold ${grade.textClass}`}>
            {Math.round(scorecard.final_score)}
          </span>
          <span className="text-xl text-text-quaternary-500 ml-1">/100</span>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary-700 mb-8 max-w-2xl">
          {grade.description}
        </p>

        {/* Three Metric Boxes - Wrapped in background */}
        <div className="bg-bg-secondary-subtle dark:bg-bg-secondary rounded-lg p-6 mb-8 flex justify-center gap-12">
          <div className="text-center">
            <div className="text-xs text-text-quaternary-500 mb-1">Cash position</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-semibold text-text-primary-900">
                {Math.round((cashScore.points_awarded / cashScore.max_points) * 100)}
              </span>
              {getTrendIcon(cashScore.points_awarded, cashScore.max_points)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-quaternary-500 mb-1">Revenue</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-semibold text-text-primary-900">
                {Math.round((profitabilityScore.points_awarded / profitabilityScore.max_points) * 100)}
              </span>
              {getTrendIcon(profitabilityScore.points_awarded, profitabilityScore.max_points)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-quaternary-500 mb-1">Expenses</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-semibold text-text-primary-900">
                {Math.round((liquidityScore.points_awarded / liquidityScore.max_points) * 100)}
              </span>
              {getTrendIcon(liquidityScore.points_awarded, liquidityScore.max_points)}
            </div>
          </div>
        </div>

        {/* Runway Summary with Separator */}
        <div className="border-t border-border-secondary pt-6 mb-2">
          <p className="text-sm text-text-secondary-700">
            At your current burn rate, you have approximately {runwayMonths} months of runway remaining.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-text-quaternary-500">
            <span>Updated daily</span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-4 py-2 bg-bg-brand-solid text-text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer"
          >
            View details
            <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      </div>

      {/* Expanded Details Section - Separated from main card */}
      {
        showDetails && (
          <div className="mt-8">

            {/* WHAT WE'RE SEEING - Card Style */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary-500 mb-3 px-1">
                WHAT WE'RE SEEING
              </h3>
              <div className="bg-bg-primary rounded-xl border border-border-secondary p-6 shadow-sm">
                <ul className="space-y-3">
                  {categoryAMetrics.length > 0 ? (
                    categoryAMetrics.map((metric: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary-700">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500"></span>
                        <span>{metric}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-text-quaternary-500">No descriptive data available</li>
                  )}
                </ul>
              </div>
            </div>

            {/* WHY THIS MATTERS NOW - Card Style */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary-500 mb-3 px-1">
                WHY THIS MATTERS NOW
              </h3>
              <div className="bg-bg-primary rounded-xl border border-border-secondary p-6 shadow-sm">
                {whyThisMatters ? (
                  <p className="text-sm text-text-secondary-700 leading-relaxed">{whyThisMatters}</p>
                ) : (
                  <p className="text-sm text-text-quaternary-500">No contextual explanation available</p>
                )}
              </div>
            </div>

            {/* WHAT TO DO NEXT - Card Style */}
            {drivers.top_negative.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary-500 mb-3 px-1">
                  WHAT TO DO NEXT
                </h3>
                <div className="bg-bg-primary rounded-xl border border-border-secondary p-6 shadow-sm">
                  <ol className="space-y-4">
                    {drivers.top_negative.slice(0, 3).map((driver, index) => (
                      <li key={driver.metric_id} className="flex items-start gap-3 text-sm text-text-secondary-700">
                        <span className="flex-shrink-0 w-6 h-6 rounded bg-teal-50 text-teal-700 text-xs font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="mt-0.5">{driver.recommended_action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* KEY NUMBERS */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary-500 mb-3 px-1">
                KEY NUMBERS
              </h3>
              <div className="bg-bg-primary rounded-xl border border-border-secondary p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Cash */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-quaternary-500 mb-1">
                      <span className="text-text-quaternary-400">$</span> Current cash
                    </div>
                    <div className="text-2xl font-bold text-teal-500">
                      ${Math.abs(data.key_metrics?.current_cash ?? 0).toLocaleString()}
                    </div>
                  </div>
                  {/* Monthly Burn */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-quaternary-500 mb-1">
                      <span className="text-text-quaternary-400">$</span> Monthly burn
                    </div>
                    <div className="text-2xl font-bold text-teal-500">
                      ${Math.abs(data.key_metrics?.monthly_burn ?? 0).toLocaleString()}
                    </div>
                  </div>
                  {/* Data Period */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-quaternary-500 mb-1">
                      <svg className="w-3.5 h-3.5 text-text-quaternary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Data period
                    </div>
                    <div className="text-2xl font-bold text-teal-500">
                      {data.key_metrics?.data_period_days ? `${data.key_metrics.data_period_days} days` : '90 days'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How we worked this out (Collapsible Footer) */}
            <details className="group mt-8">
              <summary className="flex items-center text-teal-700 font-medium cursor-pointer list-none select-none">
                <svg className="w-5 h-5 mr-2 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                How we worked this out
              </summary>

              <div className="mt-4 p-6 bg-utility-gray-50 rounded-xl border border-border-secondary">
                {/* FORMULA */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary-500 mb-2">FORMULA</h4>
                  <div className="inline-block bg-white border border-border-secondary rounded-md px-3 py-1.5 text-sm text-text-secondary-700 font-medium shadow-sm">
                    Runway = Current Cash ÷ Average Monthly Outflows
                  </div>
                </div>

                {/* INPUTS USED */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary-500 mb-2">INPUTS USED</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Bank transactions (90 days)",
                      "Outstanding invoices",
                      "Recurring expenses",
                      "Payroll schedule"
                    ].map((input, i) => (
                      <span key={i} className="bg-white border border-border-secondary rounded-md px-3 py-1 text-sm text-text-secondary-700 shadow-sm">
                        {input}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ASSUMPTIONS */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary-500 mb-2">ASSUMPTIONS</h4>
                  <ul className="space-y-2">
                    {assumptions.length > 0 ? (
                      assumptions.map((assumption: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500"></span>
                          <span>{assumption}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-text-quaternary-500">No assumptions specified</li>
                    )}
                  </ul>
                </div>
              </div>
            </details>

            {/* Conditional Warning Banner */}
            {data_quality.warnings.length > 0 && (
              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-800">
                  {data_quality.warnings[0]}
                </p>
              </div>
            )}

          </div>
        )}
    </>
  )
}

