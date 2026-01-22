'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  
  const isAnyLoading = emailLoading || googleLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError('Please fill out this field.')
      return
    }
    if (!emailRegex.test(email)) {
      setEmailError('Must be a valid email address')
      return
    }
    if (!password) {
      setPasswordError('Please fill out this field.')
      return
    }

    setEmailLoading(true)

    try {
      await signIn(email, password)
      // Redirect happens in signIn, so we don't need to set loading to false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setEmailLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setGoogleLoading(true)

    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
      setGoogleLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setError('Facebook sign-in is not yet implemented')
  }

  const handleAppleSignIn = async () => {
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setError('Apple sign-in is not yet implemented')
  }


  return (
    // FIX 1: Removed 'items-center'. We use 'justify-center' for vertical centering only.
    // We added 'flex-col' to ensure the vertical alignment works.
    <div className="flex min-h-screen w-full flex-col justify-center bg-bg-primary px-4 py-12">
      
      {/* FIX 2: Added 'mx-auto' to center horizontally. 
         Added 'min-w-[320px]' to force it to never collapse below phone width. */}
      <div className="mx-auto w-full max-w-lg min-w-[320px] space-y-6">
        
        {/* Neura Logo */}
        <div className="flex justify-center">
          <img
            src="/logo.svg"
            alt="Neura"
            width={38}
            height={38}
            className="flex-shrink-0"
          />
        </div>
        
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-display-md text-text-primary-900 font-bold">
            Log in to your account
          </h1>
          <p className="text-md text-text-secondary-700">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <div className="rounded-md bg-bg-success-secondary p-2 text-sm text-text-primary-900">
            {message}
          </div>
        )}

        {/* General Error */}
        {error && (
          <div className="rounded-md bg-bg-error-secondary p-2 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-text-primary-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError(null)
              }}
              className={`w-full rounded-md border ${
                emailError ? 'border-red-500' : 'border-border-secondary'
              } bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
              placeholder="Enter your email"
            />
            {emailError && (
              <p className="text-sm text-red-500">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-text-primary-900">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
                className={`w-full rounded-md border ${
                  passwordError ? 'border-red-500' : 'border-border-secondary'
                } bg-bg-primary px-3 py-2 pr-10 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-quaternary-500 hover:text-text-primary-900"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-500">
                {passwordError}
              </p>
            )}
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border-secondary text-fg-brand-primary-600 focus:ring-fg-brand-primary-600"
              />
              <span className="text-sm text-text-primary-900">Remember for 30 days</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-text-brand-tertiary-600 hover:underline"
            >
              Forgot password
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAnyLoading}
            className="w-full rounded-xl bg-bg-brand-solid px-3 py-2 text-sm font-bold text-text-white transition-colors hover:bg-fg-brand-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {emailLoading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {emailLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-secondary"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-bg-primary px-2 text-text-quaternary-500">
              or
            </span>
          </div>
        </div>

        {/* Social Sign In Buttons */}
        <div className="space-y-3">
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAnyLoading}
            className="w-full rounded-xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <img
                src="/icons/google.svg"
                alt="Google"
                width={24}
                height={24}
                className="flex-shrink-0"
              />
            )}
            <span>Sign in with Google</span>
          </button>

          {/* Facebook Sign In Button */}
          <button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={isAnyLoading}
            className="w-full rounded-xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <img
              src="/icons/facebook.svg"
              alt="Facebook"
              width={24}
              height={24}
              className="flex-shrink-0"
            />
            <span>Sign in with Facebook</span>
          </button>

          {/* Apple Sign In Button */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={isAnyLoading}
            className="w-full rounded-xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <img
              src="/icons/apple.svg"
              alt="Apple"
              width={19}
              height={22}
              className="flex-shrink-0"
            />
            <span>Sign in with Apple</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-text-quaternary-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-text-brand-tertiary-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-bg-primary">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}