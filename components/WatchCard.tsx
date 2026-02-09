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

// Helper to format value with color coding (light: orange; dark: #F79009 per Figma Key numbers)
function formatKeyNumber(label: string, value: string | number): { formatted: string; colorClass: string } {
  const lowerLabel = label.toLowerCase()

  const orangeClass = 'text-[#F79009] dark:text-[#F79009]'

  // Money values
  if (typeof value === 'number' || (typeof value === 'string' && value.includes('$'))) {
    const numValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''))
    if (!isNaN(numValue)) {
      const formatted = typeof value === 'string' ? value : `${numValue < 0 ? '-' : ''}$${Math.abs(numValue).toLocaleString()}`
      return { formatted, colorClass: orangeClass }
    }
  }

  // Days/negative values
  if (lowerLabel.includes('day') || lowerLabel.includes('until')) {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''))
    if (!isNaN(numValue) && numValue < 0) {
      return { formatted: String(value), colorClass: 'text-red-500 dark:text-red-400' }
    }
    return { formatted: String(value), colorClass: orangeClass }
  }

  return { formatted: String(value), colorClass: orangeClass }
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
    <div
      className="relative rounded-tl-2xl rounded-bl-2xl rounded-tr-lg rounded-br-lg border border-border-secondary bg-bg-warning-card p-4 border-l-[3px] border-l-[#F79009]
        dark:rounded-2xl dark:border dark:border-[#F79009] dark:border-l-2 dark:bg-[#4E1D09] dark:shadow-[0px_1px_2px_-1px_#FDB022]"
    >
      {/* Timeframe badge - absolutely positioned top right; dark: lg Pill Warning */}
      {timeframe && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-bg-warning-tag border border-bg-warning-input px-2.5 py-0.5 text-xs font-medium text-[#9a3412]
          dark:border-0 dark:bg-[#F79009] dark:px-3 dark:py-1 dark:text-sm dark:text-white">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>~{typeof timeframe.value === 'number' ? timeframe.value : timeframe.value} days</span>
        </span>
      )}

      <div className="pr-24">
        {/* Badges Row - WATCH (sm Warning) + Confidence (sm Gray, icon leading) */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-[#F79009] px-2.5 py-0.5 text-xs font-semibold text-white uppercase">
            WATCH
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border-primary bg-bg-confidence px-2.5 py-0.5 text-xs font-medium text-text-secondary-700
            dark:border-[#742C0C] dark:bg-[#2a2a2a] dark:text-[#F7F7F7]">
            <svg className="w-3.5 h-3.5 text-text-brand-tertiary-600 dark:text-[#94979C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {insight.confidence_level === 'high' ? 'High' : insight.confidence_level === 'medium' ? 'Medium' : 'Low'} confidence
          </span>
        </div>

        {/* Title - dark: #F7F7F7 Text lg/Semibold; optional info-circle next to "days" */}
        <h3 className="mb-1 break-words text-base font-semibold text-text-primary-900 dark:text-lg dark:text-[#F7F7F7]">
          {insight.title}
          {timeframe && (
            <span className="ml-1 inline-flex align-middle" title="Timeframe detail">
              <svg className="h-4 w-4 text-text-quaternary-500 dark:text-[#F7F7F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )}
        </h3>

        {/* Financial Detail Badge - dark: lg Pill Warning (orange bg, white text) */}
        {financialDetail && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-warning-tag border border-bg-warning-input px-2.5 py-0.5 text-xs font-medium text-[#9a3412]
              dark:border-0 dark:bg-[#F79009] dark:px-3 dark:py-1 dark:text-sm dark:text-white">
              <span>$</span>
              <span>{typeof financialDetail.value === 'number'
                ? `${financialDetail.value >= 0 ? '+' : '-'}$${Math.abs(financialDetail.value).toLocaleString()} vs average`
                : `${financialDetail.value} vs average`}
              </span>
            </span>
          </div>
        )}

        {/* Summary - dark: #F7F7F7 Text sm/Regular */}
        <p className="mb-3 break-words text-sm leading-relaxed text-text-secondary-700 dark:text-[#F7F7F7]">{insight.summary}</p>

        {/* Suggested Action Box - light: bg #FEF0C7; dark: bg #792E0D, border #93370D */}
        {suggestedAction && (
          <div className="mb-6 rounded-md border p-3 bg-[#FEF0C7] border-[#F79009]/40 dark:border-[#93370D] dark:bg-[#792E0D]">
            <p className="text-xs font-semibold text-[#F89C20] mb-1 dark:text-[#F79009]">Suggested action</p>
            <p className="text-sm text-[#F89C20] dark:text-[#F79009]">{suggestedAction}</p>
          </div>
        )}

        {/* First horizontal line + spacing (after suggested action); color from CSS var (dark #742C0C) */}
        <div className="border-t pt-6 watch-card-divider-line">
          {/* Bottom Row - How we worked this out #F79009; Resolve Secondary */}
          <div className="flex h-5 items-center justify-between">
          <button
            onClick={onExpand}
            className="flex items-center gap-1 text-sm font-semibold text-[#F79009] hover:underline cursor-pointer dark:font-normal"
          >
            {/* Light: right-pointing chevron, rotates 90 when expanded */}
            <svg className={`h-4 w-4 transition-transform dark:hidden ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {/* Dark: chevron-down (Figma 12), rotates 180 when expanded */}
            <svg className={`h-4 w-4 transition-transform hidden dark:block ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            How we worked this out
          </button>
          <button
            onClick={onResolve}
            disabled={isLoading}
            className="rounded-md border border-border-primary bg-bg-primary px-4 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
              dark:border-[#742C0C] dark:bg-[#2a2a2a] dark:text-[#F7F7F7] dark:hover:bg-[#1f1f1f]"
          >
            {isLoading ? 'Resolving...' : 'Resolve'}
          </button>
          </div>
        </div>
      </div>

      {/* Second horizontal line + expanded content - same width as first line (pr-24); Frame 51 dark */}
      {isExpanded && (
        <div className="mt-8 space-y-4 border-t pt-6 pr-24 watch-card-divider-line dark:rounded-b-2xl dark:bg-[#4E1D09]">
          {/* WHAT WE'RE SEEING - Overline #F7F7F7; Ellipse 4x4 #F79009; Text xs/Regular #F7F7F7 */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900 dark:text-[#F7F7F7]">
              WHAT WE'RE SEEING
            </h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary-700 dark:text-xs dark:text-[#F7F7F7]">
              {insight.why_it_matters.split('\n').filter(line => line.trim()).map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#F89D25] dark:mt-2 dark:h-1 dark:w-1 dark:bg-[#F79009]" />
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RECOMMENDED ACTIONS */}
          {insight.recommended_actions.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900 dark:text-[#F7F7F7]">
                RECOMMENDED ACTIONS
              </h4>
              <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary-700 dark:text-xs dark:text-[#F7F7F7]">
                {insight.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#F89D25] dark:mt-2 dark:bg-[#F79009]" />
                    <span className="break-words">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* INPUTS USED - dark: Badge sm Pill color Warning (orange bg, white text) */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-primary-900 dark:text-[#F7F7F7]">
              INPUTS USED
            </h4>
            <div className="flex flex-wrap gap-2">
              {inputsUsed.map((input, i) => (
                <span
                  key={i}
                  className="rounded-full border px-3 py-1 text-xs font-medium watch-inputs-used-pill bg-transparent text-[#F79009]
                    dark:bg-[#F79009] dark:px-2.5 dark:py-0.5"
                  style={{ color: 'var(--watch-inputs-used-text, #F79009)' }}
                >
                  {input}
                </span>
              ))}
            </div>
          </div>

          {/* KEY NUMBERS - labels same color as footer (var: light quaternary, dark #F7F7F7); values #F79009 */}
          {insight.supporting_numbers.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide watch-card-footer-text" style={{ color: 'var(--watch-footer-text)' }}>
                KEY NUMBERS
              </h4>
              <div className="flex flex-wrap gap-8">
                {insight.supporting_numbers.map((num, i) => {
                  const { formatted, colorClass } = formatKeyNumber(num.label, num.value)
                  return (
                    <div key={i}>
                      <div className="text-xs watch-card-footer-text" style={{ color: 'var(--watch-footer-text)' }}>{num.label}</div>
                      <div className={`text-2xl font-bold ${colorClass} dark:text-lg dark:font-semibold`}>{formatted}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Data Notes Warning - dark mode styling */}
          {insight.data_notes && (
            <div className="rounded-md bg-[#fef3c7] border border-[#fbbf24] p-3 dark:bg-[#78350f]/20 dark:border-[#742C0C]">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 shrink-0 text-[#d97706] dark:text-[#fbbf24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-[#92400e] dark:text-[#fbbf24]">{insight.data_notes}</p>
              </div>
            </div>
          )}

          {/* Footer - Line border from var (dark #742C0C); text color from var (dark #F7F7F7); spacing between "Based on..." and "Updated..." */}
          <div className="flex h-5 items-center justify-between border-t pt-4 text-xs watch-card-divider-line watch-card-footer-text dark:text-sm" style={{ color: 'var(--watch-footer-text)' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Based on last 90 days</span>
              {calculatedAt && (
                <span className="ml-3">• Updated {formatDateWithAt(calculatedAt).toLowerCase()}</span>
              )}
              <span className="h-1 w-1 rounded-full bg-transparent dark:bg-[#94979C]" aria-hidden />
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--watch-footer-text)' }}>Helpful?</span>
              <button
                onClick={() => onFeedback(true)}
                className="rounded p-1.5 text-text-quaternary-500 hover:text-text-brand-tertiary-600 hover:bg-bg-secondary transition-colors cursor-pointer dark:hover:bg-[#2a2a2a] dark:hover:text-[#F7F7F7]"
                title="Yes, helpful"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button
                onClick={() => onFeedback(false)}
                className="rounded p-1.5 text-text-quaternary-500 hover:text-red-500 hover:bg-bg-secondary transition-colors cursor-pointer dark:hover:bg-[#2a2a2a] dark:hover:text-red-400"
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
