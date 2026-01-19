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
  },
  B: {
    label: 'Healthy',
    description: 'Your business is performing well with stable cash flow and manageable risks. A few items need attention but nothing urgent.',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  C: {
    label: 'At Risk',
    description: 'Your business needs attention. Cash flow challenges and some risks require monitoring.',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  D: {
    label: 'Critical',
    description: 'Your business requires immediate attention. Significant cash flow and risk concerns.',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

const confidenceConfig = {
  high: { label: 'High confidence', icon: '●' },
  medium: { label: 'Medium confidence', icon: '●' },
  low: { label: 'Low confidence', icon: '●' },
}

// Helper to get trend arrow for a score (relative to max)
function getTrendIcon(score: number, max: number) {
  const percentage = (score / max) * 100
  if (percentage >= 70) {
    return <span className="text-green-500">↗</span>
  } else if (percentage >= 50) {
    return <span className="text-gray-500">→</span>
  } else {
    return <span className="text-amber-500">↘</span>
  }
}

export default function HealthScoreCard({ data, isLoading, onRefresh }: HealthScoreCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Loading skeleton matching Figma layout
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
        </div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex-1 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex-1 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Business Health Score
          </span>
        </div>
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No health score data available yet.
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              Calculate Health Score
            </button>
          )}
        </div>
      </div>
    )
  }

  const { scorecard, category_scores, drivers, data_quality } = data
  const grade = gradeConfig[scorecard.grade]
  const confidence = confidenceConfig[scorecard.confidence]

  // Extract key metrics for the 3-box display (Cash, Revenue, Expenses from categories)
  const cashScore = category_scores.A // Cash & Runway
  const profitabilityScore = category_scores.B // Profitability (Revenue indicator)
  const liquidityScore = category_scores.D // Working Capital (Expenses indicator)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header - matches Figma 1.2 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Business Health Score
          </span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${grade.badgeClass}`}>
          {grade.label}
        </span>
      </div>

      {/* Large Score Display - matches Figma */}
      <div className="mb-3">
        <span className="text-5xl font-bold text-gray-900 dark:text-white">
          {Math.round(scorecard.final_score)}
        </span>
        <span className="text-xl text-gray-400 dark:text-gray-500 ml-1">/100</span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {grade.description}
      </p>

      {/* Three Metric Boxes - matches Figma 1.3 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cash position</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              {Math.round((cashScore.points_awarded / cashScore.max_points) * 100)}
            </span>
            {getTrendIcon(cashScore.points_awarded, cashScore.max_points)}
          </div>
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Revenue</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              {Math.round((profitabilityScore.points_awarded / profitabilityScore.max_points) * 100)}
            </span>
            {getTrendIcon(profitabilityScore.points_awarded, profitabilityScore.max_points)}
          </div>
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              {Math.round((liquidityScore.points_awarded / liquidityScore.max_points) * 100)}
            </span>
            {getTrendIcon(liquidityScore.points_awarded, liquidityScore.max_points)}
          </div>
        </div>
      </div>

      {/* Footer - matches Figma */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Updated daily</span>
          <span className="flex items-center gap-1">
            <span className="text-amber-500">{confidence.icon}</span>
            {confidence.label}
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          View details
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Expanded Details Section */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Category Breakdown */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Category Breakdown
          </h3>
          <div className="space-y-3 mb-6">
            {Object.entries(category_scores).map(([key, cat]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-44 truncate">
                  {cat.name}
                </span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${(cat.points_awarded / cat.max_points) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-14 text-right">
                  {Math.round(cat.points_awarded)}/{cat.max_points}
                </span>
              </div>
            ))}
          </div>

          {/* Key Drivers */}
          {(drivers.top_positive.length > 0 || drivers.top_negative.length > 0) && (
            <>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Key Drivers
              </h3>
              <div className="space-y-2 mb-6">
                {drivers.top_negative.slice(0, 3).map((driver) => (
                  <div
                    key={driver.metric_id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-red-500">↓</span>
                    <span className="text-gray-700 dark:text-gray-300">{driver.label}</span>
                    <span className="text-gray-400 text-xs">
                      ({Math.round(driver.impact_points)} pts)
                    </span>
                  </div>
                ))}
                {drivers.top_positive.slice(0, 3).map((driver) => (
                  <div
                    key={driver.metric_id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-green-500">↑</span>
                    <span className="text-gray-700 dark:text-gray-300">{driver.label}</span>
                    <span className="text-gray-400 text-xs">
                      ({Math.round(driver.impact_points)} pts)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Data Quality Warnings */}
          {data_quality.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {data_quality.warnings[0]}
                </p>
              </div>
            </div>
          )}

          {/* Detailed Driver Actions */}
          {drivers.top_negative.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                What to fix first
              </h3>
              <div className="space-y-3">
                {drivers.top_negative.slice(0, 3).map((driver) => (
                  <div
                    key={driver.metric_id}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-500 font-medium text-sm">{driver.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {driver.why_it_matters}
                    </p>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase">
                        Action:
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {driver.recommended_action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
