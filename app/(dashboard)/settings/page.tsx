'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/lib/api/client'
import { useSettingsStore } from '@/stores/settingsStore'
import { SettingsSkeleton } from '@/components/SettingsSkeleton'
import XeroConnectModal from '@/components/XeroConnectModal'
import AIProviderSettings, { AIProviderConfig } from '@/components/AIProviderSettings'

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

export default function SettingsPage() {
  const { user, signOut, isAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    settings,
    isLoading,
    error: storeError,
    fetchSettings,
    updateOrgName,
    aiConfig,
    aiLoading,
    fetchAIConfig,
    updateAIConfig,
  } = useSettingsStore()
  const [error, setError] = useState<string | null>(null)
  const [showXeroModal, setShowXeroModal] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [savingOrgName, setSavingOrgName] = useState(false)

  // Sync org name with settings
  useEffect(() => {
    if (settings?.organization_name) {
      setOrgName(settings.organization_name)
    }
  }, [settings?.organization_name])

  const handleSaveOrgName = async () => {
    if (!orgName.trim() || orgName === settings?.organization_name) return
    setSavingOrgName(true)
    const success = await updateOrgName(orgName.trim())
    if (!success) setError('Failed to update organization name')
    setSavingOrgName(false)
  }

  useEffect(() => {
    // Check for error in URL params (from OAuth callback)
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
      // Clean up URL by removing error parameter
      const newUrl = window.location.pathname
      router.replace(newUrl)
    }
  }, [searchParams, router])

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        // Fetch both settings and AI config in parallel if admin
        const promises: Promise<any>[] = [fetchSettings()]

        if (isAdmin) {
          promises.push(fetchAIConfig())
        }

        try {
          await Promise.all(promises)
        } catch (error) {
          console.error('Error loading settings:', error)
        }
      }

      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]) // fetchSettings and fetchAIConfig are stable refs from Zustand

  // Combine store error with local error
  useEffect(() => {
    if (storeError) {
      setError(storeError)
    }
  }, [storeError])

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      setError(null)
      await apiRequest('/integrations/xero/disconnect', {
        method: 'POST',
      })
      // Refresh settings after disconnect using store
      await fetchSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Xero')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleConnect = () => {
    setError(null)
    setShowXeroModal(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (dateOnly.getTime() === today.getTime()) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase()}`
    } else {
      // Other date - show full date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  // Show skeleton if either store is loading OR AI config is loading (for admins)
  if (isLoading || (isAdmin && aiLoading)) {
    return <SettingsSkeleton />
  }

  if (!user) {
    return null // Middleware will redirect
  }

  const xeroIntegration = settings?.xero_integration
  const lastSyncedAt = xeroIntegration?.last_synced_at || settings?.last_sync_time

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-6">
        {/* Back to overview */}
        <Link
          href="/overview"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-quaternary-500 hover:text-text-primary-900 transition-colors cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to overview
        </Link>

        {/* Settings Title */}
        <h1 className="mb-8 text-display-md text-text-primary-900 font-bold">
          Settings
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-bg-error-secondary p-3 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        {/* Two Column Layout - Left: Settings, Right: AI Provider (admin only) */}
        <div className={`flex flex-col gap-8 ${isAdmin ? 'md:flex-row' : ''}`}>
          {/* Left Column - Main Settings */}
          <div className={`space-y-8 ${isAdmin ? 'md:flex-1' : 'w-full'}`}>
            {/* ORGANIZATION Section */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                ORGANIZATION
              </h2>
              <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <label htmlFor="orgName" className="text-sm font-medium text-text-primary-900">
                    Organization name
                  </label>
                  <div className="flex flex-1 gap-2 md:max-w-[400px]">
                    <input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="flex-1 rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-brand-solid focus:outline-none focus:ring-1 focus:ring-brand-solid"
                    />
                    <button
                      onClick={handleSaveOrgName}
                      disabled={savingOrgName || !orgName.trim() || orgName === settings?.organization_name}
                      className="rounded-md bg-brand-solid px-4 py-2 text-sm font-medium text-text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingOrgName ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ACCOUNT Section */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                ACCOUNT
              </h2>
              <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <label htmlFor="email" className="text-sm font-medium text-text-primary-900">
                    Email
                  </label>
                  <div className="relative flex-1 md:max-w-[400px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <svg className="h-4 w-4 text-text-quaternary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={settings?.email || user.email || ''}
                      readOnly
                      className="w-full rounded-md border border-border-secondary bg-bg-primary pl-9 pr-3 py-2 text-sm text-text-primary-900"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 5.3 INTEGRATION Section */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                INTEGRATION
              </h2>
              <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
                {/* Top Section: Xero Logo, Status, and Actions */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    {/* Xero Logo - Blue circle with white text */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#13B5E3] text-[10px] font-semibold leading-none text-white">
                      xero
                    </div>
                    {xeroIntegration?.is_connected && (
                      <>
                        <div className="flex items-center gap-1.5 rounded-full border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary-subtle px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#079455]"></span>
                          <span className="text-xs text-text-primary-900">Connected</span>
                        </div>
                        {xeroIntegration.xero_org_name && (
                          <span className="text-sm text-text-secondary-700">{xeroIntegration.xero_org_name}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:ml-auto">
                    {xeroIntegration?.is_connected ? (
                      <>
                        <button
                          onClick={handleConnect}
                          disabled={disconnecting}
                          className="flex items-center gap-2 text-sm font-medium text-text-brand-tertiary-600 hover:underline whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reconnect
                        </button>
                        <button
                          onClick={handleDisconnect}
                          disabled={disconnecting}
                          className="flex items-center gap-2 whitespace-nowrap rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary-subtle px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {disconnecting && (
                            <svg
                              className="h-4 w-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          )}
                          {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 whitespace-nowrap rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary-subtle px-3 py-1.5 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary cursor-pointer"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Divider and Last Synced Info */}
                {xeroIntegration?.is_connected && lastSyncedAt && (
                  <>
                    <div className="my-4 border-t border-border-secondary"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-quaternary-500">Last synced</span>
                      <span className="text-sm font-medium text-text-brand-tertiary-600">
                        {formatDate(lastSyncedAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 5.6 SUPPORT Section */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                SUPPORT
              </h2>
              <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <span className="text-sm font-medium text-text-primary-900">Help & support</span>
                  <a
                    href={settings?.support_link || 'mailto:support@getneura.co'}
                    className="flex items-center gap-2 text-sm font-medium text-text-brand-tertiary-600 hover:underline cursor-pointer md:ml-auto"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Contact us
                  </a>
                </div>
              </div>
            </section>

            {/* 5.7 Log Out Button */}
            <section>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 rounded-md bg-[#d92d20] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b91c1c] cursor-pointer"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Log out</span>
              </button>
            </section>
          </div>

          {/* Right Column - AI Provider (Admin Only) */}
          {isAdmin && (
            <div className="md:w-[400px] md:shrink-0 md:sticky md:top-6 md:self-start">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-primary-900">
                AI PROVIDER
              </h2>
              <AIProviderSettings
                initialConfig={aiConfig}
                isLoading={aiLoading}
                onConfigUpdate={updateAIConfig}
              />
            </div>
          )}
        </div>

        {/* Bottom Status Bar / Footer */}
        {xeroIntegration?.is_connected && (
          <div className="mt-12 flex items-center justify-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#079455]"></span>
            <span className="text-[#079455]">Connected to Xero</span>
            <span className="text-[#079455]">•</span>
            <span className="text-text-quaternary-500">Read-only</span>
            {lastSyncedAt && (
              <>
                <span className="text-[#079455]">•</span>
                <span className="text-text-quaternary-500">Synced {formatDate(lastSyncedAt)}</span>
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
