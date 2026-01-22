'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [organizationError, setOrganizationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  
  const isAnyLoading = emailLoading || googleLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)

    // Validation
    if (!name) {
      setNameError('Please fill out this field.')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError('Please fill out this field.')
      return
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    if (!organizationName) {
      setOrganizationError('Please fill out this field.')
      return
    }
    
    if (!password) {
      setPasswordError('Please fill out this field.')
      return
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    setEmailLoading(true)

    try {
      await signUp(name, email, password, organizationName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
      setEmailLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)
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
    setNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)
    setError('Facebook sign-in is not yet implemented')
  }

  const handleAppleSignIn = async () => {
    setError(null)
    setNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setOrganizationError(null)
    setError('Apple sign-in is not yet implemented')
  }

  return (
    // FIX 1: Removed 'items-center', added 'flex-col justify-center'
    <div className="flex min-h-screen w-full flex-col justify-center bg-bg-primary px-4 py-12">
      
      {/* FIX 2: Added 'mx-auto' and 'min-w-[320px]' */}
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
            Create an account
          </h1>
          <p className="text-md text-text-secondary-700">
            Lorem ipsum dolor sit amet consectetur. Gravida varius fringilla dignissim sed auctor et malesuada ac.
          </p>
        </div>

        {/* General Error */}
        {error && (
          <div className="rounded-md bg-bg-error-secondary p-2 text-sm text-text-primary-900">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <div className="relative">
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(null)
                }}
                className={`w-full rounded-md border ${
                  nameError ? 'border-red-500 pr-10' : 'border-border-secondary'
                } bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
                placeholder="Enter your name"
              />
              {nameError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
              )}
            </div>
            {nameError && (
              <p className="text-sm text-red-500">
                {nameError}
              </p>
            )}
          </div>

          {/* Organization Name Field */}
          <div className="space-y-1">
            <label htmlFor="organization" className="sr-only">
              Organization Name
            </label>
            <div className="relative">
              <input
                id="organization"
                type="text"
                required
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value)
                  setOrganizationError(null)
                }}
                className={`w-full rounded-md border ${
                  organizationError ? 'border-red-500 pr-10' : 'border-border-secondary'
                } bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
                placeholder="Enter your company name"
              />
              {organizationError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
              )}
            </div>
            {organizationError && (
              <p className="text-sm text-red-500">
                {organizationError}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
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
                  emailError ? 'border-red-500 pr-10' : 'border-border-secondary'
                } bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
                placeholder="Enter your email"
              />
              {emailError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
              )}
            </div>
            {emailError && (
              <p className="text-sm text-red-500">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
                className={`w-full rounded-md border ${
                  passwordError ? 'border-red-500 pr-10' : 'border-border-secondary pr-10'
                } bg-bg-primary px-3 py-2 text-sm text-text-primary-900 placeholder:text-text-quaternary-500 focus:border-fg-brand-primary-600 focus:outline-none focus:ring-1 focus:ring-fg-brand-primary-600`}
                placeholder="Enter your password"
              />
              {passwordError ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
              ) : (
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
              )}
            </div>
            {passwordError ? (
              <p className="text-sm text-red-500">
                {passwordError}
              </p>
            ) : (
              <p className="text-xs text-text-quaternary-500">
                Must be at least 8 characters
              </p>
            )}
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
            {emailLoading ? 'Creating account...' : 'Get started'}
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

        {/* Social Sign Up Buttons */}
        <div className="space-y-3">
          {/* Google Sign Up Button */}
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
            <span>Sign up with Google</span>
          </button>

          {/* Facebook Sign Up Button */}
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
            <span>Sign up with Facebook</span>
          </button>

          {/* Apple Sign Up Button */}
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
            <span>Sign up with Apple</span>
          </button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-text-quaternary-500">
          Already have an account?{' '}
          <Link href="/login" className="text-text-brand-tertiary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}