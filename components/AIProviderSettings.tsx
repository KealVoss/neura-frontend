'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/lib/api/client'
import { useToast } from '@/context/ToastContext'
import { Skeleton } from './Skeleton'

export interface AIProviderConfig {
    active_provider: string
    validation_status: string
    last_tested_at: string | null
    available_providers: string[]
    has_key_configured: boolean
    temperature: number
    top_p: number
    model: string | null
}

interface AIProviderSettingsProps {
    initialConfig?: AIProviderConfig | null
    isLoading?: boolean
    onConfigUpdate?: (config: AIProviderConfig) => void
}

interface TestConnectionResponse {
    valid: boolean
    message: string
    tested_at: string | null
}

// Known models for each provider
const PROVIDER_MODELS: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-5'],
    anthropic: ['claude-sonnet-4-20250514', 'claude-sonnet-4-5-20250929', 'claude-opus-4-5-20251101', 'claude-haiku-4-5-20251001'],
    gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview', 'gemini-3-pro-previe'],
}

const PROVIDER_LABELS: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Claude (Anthropic)',
    gemini: 'Gemini (Google)',
}

export default function AIProviderSettings({ initialConfig, isLoading = false, onConfigUpdate }: AIProviderSettingsProps) {
    const { showToast } = useToast()
    const [config, setConfig] = useState<AIProviderConfig | null>(initialConfig || null)
    const [loading, setLoading] = useState(!initialConfig && !isLoading)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [provider, setProvider] = useState('anthropic')
    const [apiKey, setApiKey] = useState('')
    const [model, setModel] = useState('')
    const [customModel, setCustomModel] = useState(false)

    // UI state
    const [showApiKey, setShowApiKey] = useState(false)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null)

    // Track if form has unsaved changes
    const isDirty = config ? (
        provider !== config.active_provider ||
        model !== (config.model || '') ||
        apiKey !== '' // API key entered means user wants to save
    ) : false // No config loaded yet = not dirty


    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiRequest<AIProviderConfig>('/settings/ai-provider')
            setConfig(data)
            setProvider(data.active_provider)
            if (data.model) {
                if (PROVIDER_MODELS[data.active_provider]?.includes(data.model)) {
                    setModel(data.model)
                    setCustomModel(false)
                } else {
                    setModel(data.model)
                    setCustomModel(true)
                }
            } else {
                setModel(PROVIDER_MODELS[data.active_provider]?.[0] || '')
                setCustomModel(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load AI config')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!initialConfig && !isLoading) {
            fetchConfig()
        }
    }, [fetchConfig, initialConfig, isLoading])

    // Update local state when props change
    useEffect(() => {
        if (initialConfig) {
            setConfig(initialConfig)
            setProvider(initialConfig.active_provider)

            // Logic to set model matches fetchConfig
            if (initialConfig.model) {
                if (PROVIDER_MODELS[initialConfig.active_provider]?.includes(initialConfig.model)) {
                    setModel(initialConfig.model)
                    setCustomModel(false)
                } else {
                    setModel(initialConfig.model)
                    setCustomModel(true)
                }
            } else {
                setModel(PROVIDER_MODELS[initialConfig.active_provider]?.[0] || '')
                setCustomModel(false)
            }
            setLoading(false)
        }
    }, [initialConfig])

    // Respect loading prop
    useEffect(() => {
        if (isLoading !== undefined) {
            setLoading(isLoading)
        }
    }, [isLoading])

    useEffect(() => {
        if (!customModel) {
            setModel(PROVIDER_MODELS[provider]?.[0] || '')
        }
    }, [provider, customModel])

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setError('API key is required')
            return
        }

        try {
            setSaving(true)
            setError(null)
            setTestResult(null)

            const data = await apiRequest<AIProviderConfig>('/settings/ai-provider', {
                method: 'PUT',
                body: JSON.stringify({
                    provider,
                    api_key: apiKey,
                    model: model || null,
                }),
            })

            setConfig(data)
            setApiKey('')

            // Update parent store optimistically
            if (onConfigUpdate) {
                onConfigUpdate(data)
            }

            // Show success toast (2 second duration)
            showToast('Configuration saved successfully', 'success', 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save AI config')
        } finally {
            setSaving(false)
        }
    }

    const handleTestConnection = async () => {
        try {
            setTesting(true)
            setError(null)
            setTestResult(null)

            const result = await apiRequest<TestConnectionResponse>('/settings/ai-provider/test', {
                method: 'POST',
            })

            setTestResult(result)
            await fetchConfig()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to test connection')
        } finally {
            setTesting(false)
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null
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
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
        }
    }

    // Loading Skeleton
    if (loading) {
        return (
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4 space-y-4">
                {/* Provider Skeleton */}
                <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>

                {/* Model Skeleton */}
                <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>

                {/* API Key Skeleton */}
                <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>

                {/* Actions Skeleton */}
                <div className="flex justify-end gap-3 pt-2">
                    <Skeleton className="h-9 w-32 rounded-md" />
                    <Skeleton className="h-9 w-32 rounded-md" />
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4 space-y-5">
            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-bg-error-secondary p-3 text-sm text-[#d92d20]">
                    {error}
                </div>
            )}

            {/* Provider Selection */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary-700">
                    Provider
                </label>
                <div className="relative">
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-1 focus:ring-text-brand-tertiary-600"
                    >
                        {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-quaternary-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-text-secondary-700">
                        Model
                    </label>
                    <button
                        type="button"
                        onClick={() => {
                            setCustomModel(!customModel)
                            if (!customModel) setModel('')
                            else setModel(PROVIDER_MODELS[provider]?.[0] || '')
                        }}
                        className="text-xs text-text-brand-tertiary-600 hover:underline whitespace-nowrap px-2"
                    >
                        {customModel ? 'Preset' : 'Edit'}
                    </button>
                </div>
                <div className="relative">
                    {customModel ? (
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="e.g. gpt-4-32k"
                            className="w-full rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-1 focus:ring-text-brand-tertiary-600"
                        />
                    ) : (
                        <>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full appearance-none rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-1 focus:ring-text-brand-tertiary-600"
                            >
                                {PROVIDER_MODELS[provider]?.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-quaternary-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary-700">
                    API Key
                </label>
                <div className="relative">
                    {/* Hidden dummy input to confuse autofill */}
                    <input type="text" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} tabIndex={-1} aria-hidden="true" />

                    <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        placeholder={`Enter ${PROVIDER_LABELS[provider]} API Key`}
                        autoComplete="new-password"
                        readOnly
                        className="w-full rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-text-brand-tertiary-600 focus:outline-none focus:ring-1 focus:ring-text-brand-tertiary-600"
                    />
                    <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-text-quaternary-500 hover:text-text-secondary-700"
                    >
                        {showApiKey ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="rounded-md border border-border-secondary px-3 py-2 text-sm font-medium text-text-secondary-700 hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className="rounded-md bg-text-brand-tertiary-600 px-3 py-2 text-sm font-medium text-white hover:bg-text-brand-tertiary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? (
                        'Saving...'
                    ) : (
                        <>
                            {!isDirty && config && (
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                                    <svg className="h-3 w-3 text-[#079455]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Status (Hidden if saved/fresh) */}
            {
                config && !loading && !saving && !testing && !testResult && (
                    <div className="flex items-center gap-2 text-xs text-text-quaternary-500 justify-end">
                        {config.validation_status === 'valid' && (
                            <span className="flex items-center gap-1 text-[#079455]">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Verified
                            </span>
                        )}
                        {config.last_tested_at && (
                            <span>Last tested: {new Date(config.last_tested_at).toLocaleDateString()}</span>
                        )}
                    </div>
                )
            }

            {/* Test Result */}
            {
                testResult && (
                    <div className={`rounded-md p-3 text-sm ${testResult.valid
                        ? 'bg-[#ecfdf3] text-[#079455] dark:bg-[#079455]/10'
                        : 'bg-bg-error-secondary text-[#d92d20]'
                        }`}>
                        {testResult.message}
                    </div>
                )
            }
        </div >
    )
}
