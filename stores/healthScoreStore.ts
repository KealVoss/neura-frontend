import { create } from 'zustand'

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

export interface HealthScoreData {
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
  business?: {
    business_id: string
    business_name: string
    tenant_provider: string
    tenant_id: string
    currency: string
  }
  periods?: {
    pnl_monthly: {
      start_date: string
      end_date: string
      months: number
    }
    rolling_3m: { end_date: string }
    rolling_6m: { end_date: string }
    balance_sheet_asof: string
  }
}

// Cache TTL in milliseconds (5 minutes - health score doesn't change often)
const CACHE_TTL = 5 * 60 * 1000

// Store pending promise for request deduplication
let pendingFetchPromise: Promise<void> | null = null

interface HealthScoreStore {
  data: HealthScoreData | null
  isLoading: boolean
  lastFetched: number | null
  error: string | null
  
  // Actions
  fetchHealthScore: (forceRefresh?: boolean) => Promise<void>
  clearHealthScore: () => void
}

export const useHealthScoreStore = create<HealthScoreStore>((set, get) => ({
  data: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetchHealthScore: async (forceRefresh = false) => {
    const state = get()
    
    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && state.data && state.lastFetched) {
      const age = Date.now() - state.lastFetched
      if (age < CACHE_TTL) {
        return // Use cached data
      }
    }

    // If a fetch is already in progress, return the existing promise (deduplication)
    if (pendingFetchPromise) {
      return pendingFetchPromise
    }

    set({ isLoading: true, error: null })

    const fetchTask = async () => {
      try {
        const { apiRequest } = await import('@/lib/api/client')
        const data = await apiRequest<HealthScoreData>('/api/insights/health-score')
        set({
          data,
          isLoading: false,
          lastFetched: Date.now(),
          error: null,
        })
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load health score',
        })
      } finally {
        pendingFetchPromise = null
      }
    }

    pendingFetchPromise = fetchTask()
    return pendingFetchPromise
  },

  clearHealthScore: () => {
    set({
      data: null,
      lastFetched: null,
      error: null,
    })
  },
}))
