import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OidcSettings, DecodedJwt } from './types'
import { OIDC_SETTINGS_KEY, DEFAULT_SETTINGS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSavedSettings(): OidcSettings {
  try {
    const saved = localStorage.getItem(OIDC_SETTINGS_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

export function saveSettings(settings: OidcSettings): void {
  localStorage.setItem(OIDC_SETTINGS_KEY, JSON.stringify(settings))
}

export function clearSettings(): void {
  localStorage.removeItem(OIDC_SETTINGS_KEY)
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('oidc.')) localStorage.removeItem(key)
  })
}

export function clearOidcStorage(): void {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('oidc.')) localStorage.removeItem(key)
  })
}

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { header, payload }
  } catch {
    return null
  }
}

export function formatTimeLeft(expiresAt: number): { text: string; seconds: number } {
  const now = Math.floor(Date.now() / 1000)
  const diff = expiresAt - now

  if (diff <= 0) return { text: 'EXPIRED', seconds: 0 }

  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60

  let text = ''
  if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`
  else if (minutes > 0) text = `${minutes}m ${seconds}s`
  else text = `${seconds}s`

  return { text, seconds: diff }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
