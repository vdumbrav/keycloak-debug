import { useEffect, useState, useCallback, useRef } from 'react'
import { AuthProvider } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'
import type { OidcSettings, LogLevel, LogEntry } from './types'
import { getBaseUrl } from './constants'
import { getSavedSettings, clearOidcStorage } from './helpers'
import { AuthDebugPanel, SettingsForm } from './components'

export default function App() {
  const [settings, setSettings] = useState<OidcSettings>(getSavedSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [key, setKey] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logIdRef = useRef(0)

  const addLog = useCallback((level: LogLevel, message: string, data?: string) => {
    setLogs(prev => [...prev, {
      id: ++logIdRef.current,
      time: new Date(),
      level,
      message,
      data
    }].slice(-100))
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
    addLog('info', 'Logs cleared')
  }, [addLog])

  const handleSaveSettings = (newSettings: OidcSettings) => {
    clearOidcStorage()
    setSettings(newSettings)
    setShowSettings(false)
    addLog('info', 'Settings updated, reconnecting...', `Authority: ${newSettings.authority}`)
    setKey(prev => prev + 1)
  }

  useEffect(() => {
    addLog('info', 'Debug sandbox initialized', `Authority: ${settings.authority}`)
  }, []) // eslint-disable-line

  const oidcConfig = {
    authority: settings.authority,
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    post_logout_redirect_uri: getBaseUrl(),
    silent_redirect_uri: settings.redirectUri,
    scope: settings.scope,
    automaticSilentRenew: true,
    accessTokenExpiringNotificationTimeInSeconds: 60,
    includeIdTokenInSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.localStorage, prefix: 'oidc.' }),
    revokeTokensOnSignout: true,
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname)
    },
  }

  return (
    <>
      <AuthProvider key={key} {...oidcConfig}>
        <AuthDebugPanel
          settings={settings}
          onOpenSettings={() => setShowSettings(true)}
          logs={logs}
          addLog={addLog}
          clearLogs={clearLogs}
        />
      </AuthProvider>

      {showSettings && (
        <SettingsForm
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}
