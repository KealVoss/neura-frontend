'use client'

import { Insight } from '@/stores/overviewStore'
import { formatDateWithAt } from '@/lib/utils/formatDate'

interface WatchCardProps {
  insight: Insight
  isExpanded: boolean
  onExpand: () => void
  onResolve: () => void
  onFeedback: (isPositive: boolean) => void
  calculatedAt: string | null
  isLoading?: boolean
}

// Helper to format value with color coding
function formatKeyNumber(label: string, value: string | number): { formatted: string; colorClass: string } {
  const lowerLabel = label.toLowerCase()
  
  // Money values - dark orange color for WatchCard
  if (typeof value === 'number' || (typeof value === 'string' && value.includes('$'))) {
    const numValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''))
    if (!isNaN(numValue)) {
      const formatted = typeof value === 'string' ? value : `$${Math.abs(numValue).toLocaleString()}`
      return { formatted, colorClass: 'text-[#9a3412]' }
    }
  }
  
  // Days/negative values - dark orange for WatchCard
  if (lowerLabel.includes('day') || lowerLabel.includes('until')) {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''))
    if (!isNaN(numValue) && numValue < 0) {
      return { formatted: String(value), colorClass: 'text-red-500' }
    }
    if (!isNaN(numValue) && numValue <= 14) {
      return { formatted: String(value), colorClass: 'text-[#9a3412]' }
    }
    return { formatted: String(value), colorClass: 'text-[#9a3412]' }
  }
  
  return { formatted: String(value), colorClass: 'text-[#9a3412]' }
}

export default function WatchCard({
  insight,
  isExpanded,
  onExpand,
  onResolve,
  onFeedback,
  calculatedAt,
  isLoading = false,
}: WatchCardProps) {
  // Extract timeframe from supporting numbers (e.g., "Days until tight ~12")
  const timeframe = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('day') || n.label.toLowerCase().includes('timeframe')
  )

  // Extract financial detail badge (e.g., "+$2,400 vs average")
  const financialDetail = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('vs') || 
    n.label.toLowerCase().includes('average') ||
    n.label.toLowerCase().includes('change') ||
    n.label.toLowerCase().includes('difference')
  )

  // Get suggested action from recommended_actions
  const suggestedAction = insight.recommended_actions?.[0] || null

  // Determine INPUTS USED based on insight type and data notes
  const getInputsUsed = (): string[] => {
    const inputs: string[] = []
    const insightType = insight.insight_type.toLowerCase()
    const dataNotes = (insight.data_notes || '').toLowerCase()

    // Always include bank transactions for cash-related insights
    if (insightType.includes('cash') || insightType.includes('runway') || insightType.includes('squeeze')) {
      inputs.push('Bank transactions (90 days)')
    }

    // Add based on insight type
    if (insightType.includes('receivable') || dataNotes.includes('invoice')) {
      inputs.push('Outstanding invoices')
    }
    if (insightType.includes('expense') || insightType.includes('bill') || dataNotes.includes('bill')) {
      inputs.push('Recurring expenses')
    }
    if (insightType.includes('payroll') || dataNotes.includes('payroll')) {
      inputs.push('Payroll schedule')
    }

    // Default inputs if none found
    if (inputs.length === 0) {
      inputs.push('Bank transactions (90 days)', 'Outstanding invoices', 'Recurring expenses')
    }

    return inputs
  }

  const inputsUsed = getInputsUsed()

  return (
    <div className="relative rounded-tl-2xl rounded-bl-2xl rounded-tr-lg rounded-br-lg border border-border-secondary bg-bg-warning-card dark:bg-bg-warning-card p-4 border-l-[3px] border-l-[#F79009]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Badges Row - Figma 1.5 */}
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#F79009] px-2.5 py-0.5 text-xs font-semibold text-white uppercase">
              WATCH
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border-primary bg-bg-confidence dark:bg-bg-confidence px-2.5 py-0.5 text-xs font-medium text-text-secondary-700">
              <svg className="w-3.5 h-3.5 text-text-brand-tertiary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {insight.confidence_level === 'high' ? 'High' : insight.confidence_level === 'medium' ? 'Medium' : 'Low'} confidence
            </span>
          </div>
          
          {/* Title */}
          <h3 className="mb-1 break-words text-base font-semibold text-text-primary-900">{insight.title}</h3>
          
          {/* Generated Date */}
          <p className="mb-2 text-xs text-text-quaternary-500">
            {formatDateWithAt(insight.generated_at)}
          </p>
          
          {/* Financial Detail Badge */}
          {financialDetail && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-bg-warning-tag dark:bg-bg-warning-tag border border-bg-warning-input dark:border-bg-warning-input px-2.5 py-0.5 text-xs font-medium text-[#9a3412] dark:text-text-warning-dark">
                <span>$</span>
                <span>{typeof financialDetail.value === 'number' 
                  ? `${financialDetail.value >= 0 ? '+' : ''}$${Math.abs(financialDetail.value).toLocaleString()} vs average`
                  : `${financialDetail.value} vs average`}
                </span>
              </span>
            </div>
          )}
          
          {/* Summary */}
          <p className="mb-3 break-words text-sm leading-relaxed text-text-secondary-700">{insight.summary}</p>
          
          {/* Suggested Action Box - Figma shows orange/coral box */}
          {suggestedAction && !isExpanded && (
            <div className="mb-3 rounded-md bg-bg-warning-action dark:bg-bg-warning-action border border-bg-warning-input dark:border-bg-warning-input p-3">
              <p className="text-xs font-semibold text-[#9a3412] dark:text-text-warning-dark mb-1">Suggested action</p>
              <p className="text-sm text-[#9a3412] dark:text-[#fdba74]">{suggestedAction}</p>
            </div>
          )}
          
          {/* Expand Link */}
          <button
            onClick={onExpand}
            className="flex items-center gap-1 text-sm text-[#FABE6C] hover:underline cursor-pointer"
          >
            <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            How we worked this out
          </button>
        </div>
        
        {/* Right Side - Timeframe & Actions */}
        <div className="flex flex-col items-end gap-2">
          {timeframe && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-warning-tag dark:bg-bg-warning-tag border border-bg-warning-input dark:border-bg-warning-input px-2.5 py-0.5 text-xs font-medium text-[#9a3412] dark:text-text-warning-dark">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>~{typeof timeframe.value === 'number' ? timeframe.value : timeframe.value} days</span>
            </span>
          )}
          <button
            onClick={onResolve}
            disabled={isLoading}
            className="rounded-md border border-border-primary bg-bg-primary dark:bg-bg-primary px-4 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resolving...' : 'Resolve'}
          </button>
        </div>
      </div>

      {/* Expanded Content - Figma 1.6 */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-border-secondary pt-4">
          {/* WHAT WE'RE SEEING */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              WHAT WE'RE SEEING
            </h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary-700">
              {insight.why_it_matters.split('\n').filter(line => line.trim()).map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F89D25]"></span>
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RECOMMENDED ACTIONS */}
          {insight.recommended_actions.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                RECOMMENDED ACTIONS
              </h4>
              <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary-700">
                {insight.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F89D25]"></span>
                    <span className="break-words">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* INPUTS USED - Figma shows orange background tags */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
              INPUTS USED
            </h4>
            <div className="flex flex-wrap gap-2">
              {inputsUsed.map((input, i) => (
                <span
                  key={i}
                  className="rounded-md border border-bg-warning-input dark:border-bg-warning-input bg-bg-warning-input dark:bg-bg-warning-input px-2.5 py-1 text-xs font-medium text-[#9a3412] dark:text-text-warning-dark"
                >
                  {input}
                </span>
              ))}
            </div>
          </div>

          {/* KEY NUMBERS - Color coded values */}
          {insight.supporting_numbers.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                KEY NUMBERS
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {insight.supporting_numbers.map((num, i) => {
                  const { formatted, colorClass } = formatKeyNumber(num.label, num.value)
                  return (
                    <div key={i}>
                      <div className="text-xs text-text-quaternary-500">{num.label}</div>
                      <div className={`text-sm font-semibold ${colorClass}`}>{formatted}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Data Notes Warning */}
          {insight.data_notes && (
            <div className="rounded-md bg-[#fef3c7] dark:bg-[#78350f]/20 border border-[#fbbf24] dark:border-[#fbbf24]/40 p-3">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 shrink-0 text-[#d97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-[#92400e] dark:text-[#fbbf24]">{insight.data_notes}</p>
              </div>
            </div>
          )}

          {/* Footer - Figma 2.11 style with Helpful? label */}
          <div className="flex items-center justify-between border-t border-border-secondary pt-4 text-xs text-text-quaternary-500">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Based on last 90 days
                {calculatedAt && (
                  <> • Updated {formatDateWithAt(calculatedAt).toLowerCase()}</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary-700">Helpful?</span>
              <button
                onClick={() => onFeedback(true)}
                className="rounded p-1.5 text-text-quaternary-500 hover:text-text-brand-tertiary-600 hover:bg-bg-secondary transition-colors cursor-pointer"
                title="Yes, helpful"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button
                onClick={() => onFeedback(false)}
                className="rounded p-1.5 text-text-quaternary-500 hover:text-red-500 hover:bg-bg-secondary transition-colors cursor-pointer"
                title="Not helpful"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
