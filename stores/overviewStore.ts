import { create } from 'zustand'

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

export interface Insight {
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
  large_upcoming_bills: Array<{ 
    invoice_number: string | null
    contact: string | null
    amount_due: number
    due_date: string 
  }>
  squeeze_risk: string
}

export interface OverviewData {
  cash_runway: CashRunwayMetrics | null
  cash_pressure: CashPressureMetrics | null
  profitability: ProfitabilityMetrics | null
  upcoming_commitments: UpcomingCommitmentsMetrics | null
  insights: Insight[]
  calculated_at: string | null
}

// Cache TTL in milliseconds (20 minutes - data only changes after sync)
const CACHE_TTL = 20 * 60 * 1000

// Store pending promise for request deduplication
let pendingFetchPromise: Promise<void> | null = null

interface OverviewStore {
  data: OverviewData | null
  isLoading: boolean
  lastFetched: number | null
  error: string | null
  
  // Actions
  fetchOverview: (forceRefresh?: boolean) => Promise<void>
  updateOverview: (data: OverviewData) => void
  clearOverview: () => void
}

export const useOverviewStore = create<OverviewStore>((set, get) => ({
  data: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetchOverview: async (forceRefresh = false) => {
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
        const data = await apiRequest<OverviewData>('/api/insights/')
        set({
          data,
          isLoading: false,
          lastFetched: Date.now(),
          error: null,
        })
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load overview data',
        })
      } finally {
        pendingFetchPromise = null
      }
    }

    pendingFetchPromise = fetchTask()
    return pendingFetchPromise
  },

  updateOverview: (data: OverviewData) => {
    set({
      data,
      lastFetched: Date.now(),
      error: null,
    })
  },

  clearOverview: () => {
    set({
      data: null,
      lastFetched: null,
      error: null,
    })
  },
}))
