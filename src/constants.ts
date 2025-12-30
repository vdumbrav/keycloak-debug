import type { LogLevel } from './types'

export const OIDC_SETTINGS_KEY = 'oidc_debug_settings'

export const getBaseUrl = () => {
  const { origin, pathname } = window.location
  const base = pathname.replace(/\/(callback)?$/, '') || ''
  return origin + base
}

export const DEFAULT_SETTINGS = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || 'https://auth.jamcard.io/realms/jamcard',
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || 'mobile_app',
  scope: 'openid profile email offline_access',
  redirectUri: `${getBaseUrl()}/callback`,
}

export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
  event: 'text-primary',
  info: 'text-muted-foreground',
}

export const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  success: '✓',
  warning: '⚠',
  error: '✗',
  event: '⚡',
  info: '→',
}
