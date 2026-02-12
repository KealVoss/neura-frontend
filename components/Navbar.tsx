'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useRef } from 'react'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSettingsClick = () => {
    router.push('/settings')
    setMobileMenuOpen(false)
  }

  const handleProfileClick = () => {
    router.push('/settings')
    setMobileMenuOpen(false)
  }

  const handleThemeToggle = () => {
    toggleTheme()
    setMobileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-secondary bg-nav-header-bg">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 md:px-8 md:py-4">
        {/* Left Side - Logo */}
        <Link href="/overview" className="flex items-center gap-3">
          <img
            src="/Logomark.svg"
            alt="Neura"
            width={38}
            height={38}
            className="flex-shrink-0"
          />
          <span className="text-display-xs text-text-primary-900 font-bold">
            Neura
          </span>
        </Link>

        {/* Desktop - Navigation Links */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/overview"
            className="relative flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium transition-all cursor-pointer group"
          >
            {/* Circle with shine/dot icon for Overview */}
            <svg className={`h-4 w-4 ${pathname === '/overview' ? 'text-text-brand-tertiary-600' : 'text-text-primary-900 group-hover:text-text-brand-tertiary-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
              <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" />
            </svg>
            <span className={pathname === '/overview' ? 'text-text-brand-tertiary-600' : 'text-text-primary-900 group-hover:text-text-brand-tertiary-600'}>
              Overview
            </span>
            {/* Gradient underline for active state */}
            {pathname === '/overview' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-text-brand-tertiary-600 to-transparent" />
            )}
          </Link>
          <Link
            href="/insights"
            className="relative flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium transition-all cursor-pointer group"
          >
            {/* Lightbulb icon for Insights */}
            <svg className={`h-4 w-4 ${pathname === '/insights' ? 'text-text-brand-tertiary-600' : 'text-text-primary-900 group-hover:text-text-brand-tertiary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className={pathname === '/insights' ? 'text-text-brand-tertiary-600' : 'text-text-primary-900 group-hover:text-text-brand-tertiary-600'}>
              Insights
            </span>
            {/* Gradient underline for active state */}
            {pathname === '/insights' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-text-brand-tertiary-600 to-transparent" />
            )}
          </Link>
        </div>

        {/* Desktop - Right Side Icons */}
        <div className="hidden items-center gap-md md:flex text-nav-icon">
          <div className="flex items-center">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-white/10 cursor-pointer"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <img src="/moon-02.svg" alt="" width={16.63} height={16.63} className="size-[var(--size-nav-icon)]" />
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-white/10 cursor-pointer"
              aria-label="Settings"
            >
              <img src="/settings-icon.svg" alt="" width={16.63} height={16.63} className="size-[var(--size-nav-icon)]" />
            </Link>
          </div>

          {/* User Profile Icon with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-secondary bg-nav-avatar-bg transition-colors hover:bg-white/10 cursor-pointer"
              aria-label="User menu"
            >
              <img src="/avatar.svg" alt="" width={16.63} height={16.63} className="size-[var(--size-nav-icon)] object-contain" />
            </button>

            {/* User Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border-secondary bg-bg-primary shadow-lg py-1 z-50">
                {/* Admin - only for admins */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      router.push('/admin')
                      setUserDropdownOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary-900 hover:bg-bg-secondary transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin
                  </button>
                )}

                {/* Divider */}
                <div className="my-1 border-t border-border-secondary" />

                {/* Logout */}
                <button
                  onClick={() => {
                    signOut()
                    setUserDropdownOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-bg-secondary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile - Hamburger Menu */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-nav-icon transition-colors hover:bg-white/10 cursor-pointer md:hidden"
          aria-label="Menu"
        >
          {mobileMenuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            >
              {/* Top bar - full length */}
              <line x1="4" y1="6" x2="20" y2="6" />
              {/* Middle bar - shorter, centered (about 2/3 length) */}
              <line x1="6" y1="12" x2="18" y2="12" />
              {/* Bottom bar - full length */}
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border-secondary bg-nav-header-bg md:hidden">
          <div className="mx-auto max-w-[1280px] px-4 py-2">
            {/* Navigation Links */}
            <Link
              href="/overview"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-bg-secondary ${pathname === '/overview'
                ? 'text-text-brand-tertiary-600 bg-bg-secondary font-semibold'
                : 'text-text-primary-900'
                }`}
            >
              {/* Circle with shine icon for Overview */}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" />
              </svg>
              <span>Overview</span>
            </Link>
            <Link
              href="/insights"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-bg-secondary ${pathname === '/insights'
                ? 'text-text-brand-tertiary-600 bg-bg-secondary font-semibold'
                : 'text-text-primary-900'
                }`}
            >
              {/* Lightbulb icon for Insights */}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Insights</span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-bg-secondary ${pathname === '/admin'
                  ? 'text-text-brand-tertiary-600 bg-bg-secondary font-semibold'
                  : 'text-text-primary-900'
                  }`}
              >
                <span>Admin</span>
              </Link>
            )}

            <div className="gap-lg">

              <div className="">
                {/* Dark/Light Mode Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary"
                >
                  <img src="/moon-02.svg" alt="" width={16.63} height={16.63} className="size-[var(--size-nav-icon)] flex-shrink-0" />
                  <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
                </button>

                {/* Settings */}
                <button
                  onClick={handleSettingsClick}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary"
                >
                  <img src="/settings-icon.svg" alt="" width={16.63} height={16.63} className="size-[var(--size-nav-icon)] flex-shrink-0" />
                  <span>Settings</span>
                </button>
              </div>
              {/* User Profile */}
              <button
                onClick={handleProfileClick}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-text-primary-900 transition-colors hover:bg-bg-secondary"
              >
                <img src="/avatar.svg" alt="" width={16.63} height={16.63} className="size-[var(--size-nav-icon)] flex-shrink-0 object-contain" />
                <span>Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
