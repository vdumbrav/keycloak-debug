import { useEffect, useState, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import type { OidcSettings, LogLevel } from '../types'
import { formatTimeLeft, cn } from '../helpers'
import { LogPanel } from './LogPanel'
import { TokenPanel } from './TokenPanel'
import { StatusCard } from './StatusCard'
import { ActionsCard } from './ActionsCard'

interface AuthDebugPanelProps {
  settings: OidcSettings
  onOpenSettings: () => void
  logs: { id: number; time: Date; level: LogLevel; message: string; data?: string }[]
  addLog: (level: LogLevel, message: string, data?: string) => void
  clearLogs: () => void
}

export function AuthDebugPanel({
  settings,
  onOpenSettings,
  logs,
  addLog,
  clearLogs,
}: AuthDebugPanelProps) {
  const auth = useAuth()
  const [timeLeft, setTimeLeft] = useState<{ text: string; seconds: number }>({ text: '', seconds: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const prevAuthState = useRef<boolean | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addLog('success', 'Copied to clipboard')
  }

  useEffect(() => {
    if (!auth.events) return

    const unsubscribes = [
      auth.events.addAccessTokenExpiring(() => {
        addLog('warning', 'Token expiring soon', 'Auto-refresh will trigger')
      }),
      auth.events.addAccessTokenExpired(() => {
        addLog('error', 'Token expired!', 'Manual refresh required')
      }),
      auth.events.addSilentRenewError((error) => {
        addLog('error', 'Silent renew failed', error?.message)
      }),
      auth.events.addUserLoaded((user) => {
        const exp = user.expires_at ? new Date(user.expires_at * 1000).toLocaleTimeString() : 'N/A'
        addLog('event', 'User loaded', `Expires: ${exp}`)
      }),
      auth.events.addUserUnloaded(() => {
        addLog('event', 'User unloaded')
      }),
      auth.events.addUserSignedIn(() => {
        addLog('success', 'Signed in successfully')
      }),
      auth.events.addUserSignedOut(() => {
        addLog('event', 'Signed out from Keycloak')
      }),
    ]

    return () => unsubscribes.forEach(unsub => unsub())
  }, [auth.events, addLog])

  useEffect(() => {
    if (prevAuthState.current !== null && prevAuthState.current !== auth.isAuthenticated) {
      if (auth.isAuthenticated) {
        addLog('success', 'Authentication state: AUTHENTICATED')
      } else {
        addLog('info', 'Authentication state: NOT AUTHENTICATED')
      }
    }
    prevAuthState.current = auth.isAuthenticated
  }, [auth.isAuthenticated, addLog])

  useEffect(() => {
    if (!auth.user?.expires_at) {
      setTimeLeft({ text: '', seconds: 0 })
      return
    }

    const update = () => setTimeLeft(formatTimeLeft(auth.user!.expires_at!))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [auth.user?.expires_at])

  useEffect(() => {
    if (auth.error) {
      addLog('error', 'Auth error', auth.error.message)
    }
  }, [auth.error, addLog])

  const handleLogin = async (method: 'redirect' | 'popup') => {
    addLog('info', `Starting login (${method})...`)
    try {
      if (method === 'redirect') {
        await auth.signinRedirect()
      } else {
        await auth.signinPopup()
        addLog('success', 'Popup login completed')
      }
    } catch (error) {
      addLog('error', 'Login failed', (error as Error).message)
    }
  }

  const handleLogout = async (method: 'redirect' | 'silent' | 'local') => {
    addLog('info', `Starting logout (${method})...`)
    try {
      if (method === 'redirect') {
        await auth.signoutRedirect()
      } else if (method === 'silent') {
        await auth.signoutSilent()
        addLog('success', 'Silent logout completed')
      } else {
        await auth.removeUser()
        addLog('success', 'Local user removed')
      }
    } catch (error) {
      addLog('error', 'Logout failed', (error as Error).message)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    addLog('info', 'Starting token refresh...')
    try {
      const user = await auth.signinSilent()
      if (user) {
        const exp = user.expires_at ? new Date(user.expires_at * 1000).toLocaleTimeString() : 'N/A'
        addLog('success', 'Token refreshed!', `New expiry: ${exp}`)
      }
    } catch (error) {
      addLog('error', 'Refresh failed', (error as Error).message)
    } finally {
      setRefreshing(false)
    }
  }

  const isExpired = timeLeft.text === 'EXPIRED'

  return (
    <div className="font-sans min-h-screen bg-background text-foreground flex flex-col gap-4">
      <Header
        settings={settings}
        isLoading={auth.isLoading}
        isAuthenticated={auth.isAuthenticated}
        isExpired={isExpired}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onOpenSettings={onOpenSettings}
      />

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_500px] gap-4 px-4 pb-4 flex-1 lg:h-[calc(100vh-120px)]">
        <div className="flex flex-col gap-4 overflow-visible lg:overflow-auto">
          <StatusCard
            isAuthenticated={auth.isAuthenticated}
            email={auth.user?.profile?.email as string | undefined}
            timeLeft={timeLeft}
          />

          <ActionsCard
            isAuthenticated={auth.isAuthenticated}
            isExpired={isExpired}
            refreshing={refreshing}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onRefresh={handleRefresh}
          />

          <div className="bg-card rounded-xl p-3 md:p-4 flex-1 overflow-auto shadow-sm border border-card-border animate-slide-up">
            <div className="text-xs md:text-sm font-semibold mb-2 md:mb-3 text-foreground">Tokens</div>
            <TokenPanel token={auth.user?.access_token} label="Access Token" onCopy={copyToClipboard} />
            <TokenPanel token={auth.user?.id_token} label="ID Token" onCopy={copyToClipboard} />
            <TokenPanel token={auth.user?.refresh_token} label="Refresh Token" onCopy={copyToClipboard} />
          </div>
        </div>

        <div className="flex flex-col h-[400px] lg:h-auto">
          <LogPanel logs={logs} onClear={clearLogs} />
        </div>
      </div>
    </div>
  )
}

function Header({
  settings,
  isLoading,
  isAuthenticated,
  isExpired,
  refreshing,
  onRefresh,
  onOpenSettings,
}: {
  settings: OidcSettings
  isLoading: boolean
  isAuthenticated: boolean
  isExpired: boolean
  refreshing: boolean
  onRefresh: () => void
  onOpenSettings: () => void
}) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 px-4 py-4 border-b border-border bg-card shadow-sm">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 text-title-lg-bold md:text-headline-sm text-foreground">Keycloak Debug</h1>
        <div className="text-body-sm text-foreground/50 mt-1 truncate font-mono">
          {settings.authority}
          <span className="mx-2 text-foreground/30">•</span>
          <span className="text-foreground/70">{settings.clientId}</span>
        </div>
      </div>
      <div className="flex gap-2 items-center flex-wrap shrink-0">
        {isLoading && (
          <span className="inline-flex items-center gap-2 text-foreground text-body-sm px-3 py-2 bg-warning/15 text-warning rounded-full font-medium">
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            Loading...
          </span>
        )}
        {isAuthenticated && (
          <button
            className={cn(
              'h-10 px-4 md:px-5 rounded-full text-label-lg text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50',
              isExpired ? 'bg-success hover:bg-success/90' : 'bg-primary hover:bg-primary/90'
            )}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : isExpired ? 'Refresh!' : 'Refresh'}
          </button>
        )}
        <button
          className="h-10 px-4 md:px-5 rounded-full text-label-lg bg-surface-container text-foreground hover:bg-surface-container/80 transition-all border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={onOpenSettings}
        >
          Settings
        </button>
      </div>
    </div>
  )
}
