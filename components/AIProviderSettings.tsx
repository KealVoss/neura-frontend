'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/lib/api/client'

interface AIProviderConfig {
    active_provider: string
    validation_status: string
    last_tested_at: string | null
    available_providers: string[]
    has_key_configured: boolean
    temperature: number
    top_p: number
    model: string | null
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

export default function AIProviderSettings() {
    const [config, setConfig] = useState<AIProviderConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [provider, setProvider] = useState('anthropic')
    const [apiKey, setApiKey] = useState('')
    const [model, setModel] = useState('')
    const [customModel, setCustomModel] = useState(false)
    const [temperature, setTemperature] = useState(0.1)
    const [topP, setTopP] = useState(1.0)

    // UI state
    const [showApiKey, setShowApiKey] = useState(false)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null)

    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiRequest<AIProviderConfig>('/settings/ai-provider')
            setConfig(data)
            setProvider(data.active_provider)
            setTemperature(data.temperature)
            setTopP(data.top_p)
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
        fetchConfig()
    }, [fetchConfig])

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
                    temperature,
                    top_p: topP,
                }),
            })

            setConfig(data)
            setApiKey('')
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

    if (loading) {
        return (
            <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4 animate-pulse">
                <div className="h-6 bg-bg-tertiary rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-bg-tertiary rounded mb-4"></div>
                <div className="h-10 bg-bg-tertiary rounded"></div>
            </div>
        )
    }

    return (
        <div className="rounded-md border border-border-secondary bg-bg-secondary-subtle dark:bg-bg-secondary p-4 space-y-5">
            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-bg-error-secondary p-3 text-sm text-text-primary-900">
                    {error}
                </div>
            )}

            {/* Provider Selection */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-text-primary-900 shrink-0">
                        Provider
                    </label>
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="flex-1 rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-brand-solid focus:outline-none focus:ring-1 focus:ring-brand-solid"
                    >
                        {(config?.available_providers || ['openai', 'anthropic', 'gemini']).map((p) => (
                            <option key={p} value={p}>
                                {PROVIDER_LABELS[p] || p}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="text-xs text-text-quaternary-500">
                    Select which provider Neura uses for AI features.
                </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary-900 block">
                    Model
                </label>
                <div className="flex gap-2">
                    {customModel ? (
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="Enter custom model name"
                            className="flex-1 rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-brand-solid focus:outline-none focus:ring-1 focus:ring-brand-solid"
                        />
                    ) : (
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="flex-1 rounded-md border border-border-secondary bg-bg-primary px-3 py-2 text-sm text-text-primary-900 focus:border-brand-solid focus:outline-none focus:ring-1 focus:ring-brand-solid"
                        >
                            {PROVIDER_MODELS[provider]?.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setCustomModel(!customModel)
                            if (!customModel) {
                                setModel('')
                            } else {
                                setModel(PROVIDER_MODELS[provider]?.[0] || '')
                            }
                        }}
                        className="text-xs text-text-brand-tertiary-600 hover:underline whitespace-nowrap px-2"
                    >
                        {customModel ? 'Preset' : 'Edit'}
                    </button>
                </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary-900 block">
                    API key
                </label>
                <div className="relative">
                    <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={config?.has_key_configured ? '••••••••••••' : 'Enter API key'}
                        className="w-full rounded-md border border-border-secondary bg-bg-primary px-3 py-2 pr-10 text-sm text-text-primary-900 focus:border-brand-solid focus:outline-none focus:ring-1 focus:ring-brand-solid"
                    />
                    <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-quaternary-500 hover:text-text-primary-900"
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

            {/* Temperature */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-primary-900">
                        Temperature
                    </label>
                    <span className="text-sm text-text-quaternary-500">
                        {temperature.toFixed(1)}
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-brand-solid"
                />
            </div>

            {/* Top P */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-primary-900">
                        Top P
                    </label>
                    <span className="text-sm text-text-quaternary-500">
                        {topP.toFixed(2)}
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full accent-brand-solid"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
                <button
                    onClick={handleTestConnection}
                    disabled={testing || !config?.has_key_configured}
                    className="rounded-md border border-border-secondary bg-bg-primary px-4 py-2 text-sm font-medium text-text-primary-900 hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {testing ? 'Testing...' : 'Test connection'}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !apiKey.trim()}
                    className="rounded-md bg-brand-solid px-4 py-2 text-sm font-medium text-text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Status */}
            <div className="flex flex-wrap items-center gap-2 text-sm pt-1">
                <span className="text-text-quaternary-500">Status:</span>
                <span className={
                    config?.validation_status === 'valid'
                        ? 'text-[#079455]'
                        : config?.validation_status === 'invalid'
                            ? 'text-[#d92d20]'
                            : 'text-text-quaternary-500'
                }>
                    {config?.validation_status === 'valid' ? 'Valid' :
                        config?.validation_status === 'invalid' ? 'Invalid' : 'Untested'}
                </span>
                {config?.last_tested_at && (
                    <>
                        <span className="text-text-quaternary-500">•</span>
                        <span className="text-text-quaternary-500">Last tested:</span>
                        <span className="text-text-brand-tertiary-600">
                            {formatDate(config.last_tested_at)}
                        </span>
                    </>
                )}
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`rounded-md p-3 text-sm ${testResult.valid
                    ? 'bg-[#ecfdf3] text-[#079455] dark:bg-[#079455]/10'
                    : 'bg-bg-error-secondary text-[#d92d20]'
                    }`}>
                    {testResult.message}
                </div>
            )}
        </div>
    )
}
