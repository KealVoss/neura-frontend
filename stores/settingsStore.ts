import { create } from 'zustand'

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

interface SettingsStore {
  settings: SettingsData | null
  isLoading: boolean
  lastFetched: number | null
  error: string | null
  
  // Actions
  fetchSettings: () => Promise<void>
  getXeroConnected: () => boolean
  updateSettings: (settings: SettingsData) => void
  clearSettings: () => void
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  lastFetched: null,
  error: null,

  fetchSettings: async () => {
    const state = get()
    
    // Return cached data if still valid
    if (state.settings && state.lastFetched) {
      const age = Date.now() - state.lastFetched
      if (age < CACHE_TTL) {
        return // Use cached data
      }
    }

    // Don't fetch if already loading
    if (state.isLoading) {
      return
    }

    set({ isLoading: true, error: null })

    try {
      const { apiRequest } = await import('@/lib/api/client')
      const data = await apiRequest<SettingsData>('/settings/')
      set({
        settings: data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      })
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to load settings',
      })
    }
  },

  getXeroConnected: () => {
    const state = get()
    return state.settings?.xero_integration?.is_connected ?? false
  },

  updateSettings: (settings: SettingsData) => {
    set({
      settings,
      lastFetched: Date.now(),
      error: null,
    })
  },

  clearSettings: () => {
    set({
      settings: null,
      lastFetched: null,
      error: null,
    })
  },
}))
