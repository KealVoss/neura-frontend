'use client'

import { Insight } from '@/stores/overviewStore'
import { formatDateWithAt } from '@/lib/utils/formatDate'

interface OKCardProps {
  insight: Insight
  isExpanded: boolean
  onExpand: () => void
  onGotIt: () => void
  isLoading?: boolean
}

export default function OKCard({
  insight,
  isExpanded,
  onExpand,
  onGotIt,
  isLoading = false,
}: OKCardProps) {
  // Extract impact amount and suggested action for supporting line
  // Format: "impact amount · suggested action" - Figma 1.8
  const impactAmount = insight.supporting_numbers.find(n => 
    n.label.toLowerCase().includes('impact') || 
    n.label.toLowerCase().includes('change') ||
    n.label.toLowerCase().includes('difference') ||
    n.label.toLowerCase().includes('vs')
  )
  const suggestedAction = insight.recommended_actions[0] || ''

  return (
    <div className="rounded-tl-2xl rounded-bl-2xl rounded-tr-lg rounded-br-lg border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* OK Badge - Figma 1.8: outlined, not filled */}
          <span className="rounded-full border border-border-primary bg-bg-primary dark:bg-bg-primary px-2.5 py-0.5 text-xs font-medium text-text-secondary-700 shrink-0">
            OK
          </span>
          <div className="min-w-0 flex-1">
            {/* Title + Supporting Line */}
            <h3 className="break-words text-sm font-semibold text-text-primary-900 mb-0.5">{insight.title}</h3>
            {/* Generated Date */}
            <p className="mb-1 text-xs text-text-quaternary-500">
              {formatDateWithAt(insight.generated_at)}
            </p>
            {(impactAmount || suggestedAction) && (
              <p className="break-words text-xs leading-relaxed text-text-quaternary-500">
                {impactAmount && (
                  <span className="text-text-brand-tertiary-600 font-medium">
                    {typeof impactAmount.value === 'number' 
                      ? `${impactAmount.value >= 0 ? '+' : ''}$${Math.abs(impactAmount.value).toLocaleString()}`
                      : impactAmount?.value || ''}
                  </span>
                )}
                {impactAmount && suggestedAction && <span className="text-text-quaternary-500"> · </span>}
                {suggestedAction}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Got it button */}
          <button
            onClick={onGotIt}
            disabled={isLoading}
            className="rounded-md border border-border-primary bg-bg-primary dark:bg-bg-primary px-4 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Got it'}
          </button>
          {/* Chevron for expand */}
          <button
            onClick={onExpand}
            className="rounded-md p-1.5 text-text-primary-900 hover:bg-bg-secondary cursor-pointer"
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

      {/* Expanded Content - Same pattern as WATCH cards per Figma 1.8 */}
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
              <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary-700">
                {insight.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-brand-tertiary-600"></span>
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
