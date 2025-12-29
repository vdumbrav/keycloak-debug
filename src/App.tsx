import { useAuth, AuthProvider } from 'react-oidc-context'
import { useEffect, useState, useCallback, useRef } from 'react'
import { WebStorageStateStore } from 'oidc-client-ts'

// Storage key для настроек
const OIDC_SETTINGS_KEY = 'oidc_debug_settings'

// Дефолтные настройки
const getBaseUrl = () => {
  const { origin, pathname } = window.location
  // Убираем trailing слеши и /callback если есть
  const base = pathname.replace(/\/(callback)?$/, '') || ''
  return origin + base
}

const defaultSettings = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || 'https://auth.jamcard.io/realms/jamcard',
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || 'mobile_app',
  scope: 'openid profile email offline_access',
  redirectUri: `${getBaseUrl()}/callback`,
}

// Получить сохраненные настройки
function getSavedSettings() {
  try {
    const saved = localStorage.getItem(OIDC_SETTINGS_KEY)
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch {
    // ignore
  }
  return defaultSettings
}

// Типы логов
type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'event'

interface LogEntry {
  id: number
  time: Date
  level: LogLevel
  message: string
  data?: string
}

// JWT Decoder
function decodeJwt(token: string): { header: object; payload: object } | null {
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

// Форматирование времени до истечения
function formatTimeLeft(expiresAt: number): { text: string; seconds: number } {
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

// Компонент лога
function LogPanel({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const logListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight
    }
  }, [logs])

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'success': return '#4ade80'
      case 'warning': return '#fbbf24'
      case 'error': return '#f87171'
      case 'event': return '#a78bfa'
      default: return '#94a3b8'
    }
  }

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'success': return '✓'
      case 'warning': return '⚠'
      case 'error': return '✗'
      case 'event': return '⚡'
      default: return '→'
    }
  }

  return (
    <div style={styles.logPanel}>
      <div style={styles.logHeader}>
        <span style={styles.logTitle}>Logs ({logs.length})</span>
        <button style={styles.clearBtn} onClick={onClear}>Clear</button>
      </div>
      <div style={styles.logList} ref={logListRef}>
        {logs.length === 0 ? (
          <div style={styles.noLogs}>No logs yet. Try logging in.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={styles.logItem}>
              <span style={styles.logTime}>
                {log.time.toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span style={{ ...styles.logIcon, color: getLevelColor(log.level) }}>
                {getLevelIcon(log.level)}
              </span>
              <span style={{ ...styles.logMessage, color: getLevelColor(log.level) }}>
                {log.message}
              </span>
              {log.data && (
                <span style={styles.logData}>{log.data}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Компонент токена
function TokenPanel({
  token,
  label,
  onCopy
}: {
  token: string | undefined
  label: string
  onCopy: (text: string) => void
}) {
  if (!token) {
    return (
      <div style={styles.tokenCard}>
        <div style={styles.tokenCardHeader}>
          <span style={styles.tokenLabel}>{label}</span>
          <span style={styles.noToken}>Not available</span>
        </div>
      </div>
    )
  }

  const decoded = decodeJwt(token)
  const payload = decoded?.payload as Record<string, unknown> | undefined

  return (
    <div style={styles.tokenCard}>
      <div style={styles.tokenCardHeader}>
        <span style={styles.tokenLabel}>{label}</span>
        <button style={styles.copyBtn} onClick={() => onCopy(token)}>
          Copy
        </button>
      </div>

      {/* Raw Token */}
      <pre style={styles.rawTokenPre}>{token}</pre>

      {/* Decoded */}
      {decoded && payload && (
        <div style={styles.tokenDetails}>
          <div style={styles.tokenFields}>
            {'sub' in payload && (
              <div style={styles.tokenField}>
                <span style={styles.fieldName}>sub:</span>
                <span style={styles.fieldValue}>{String(payload.sub)}</span>
              </div>
            )}
            {'given_name' in payload && (
              <div style={styles.tokenField}>
                <span style={styles.fieldName}>first name:</span>
                <span style={styles.fieldValue}>{String(payload.given_name)}</span>
              </div>
            )}
            {'family_name' in payload && (
              <div style={styles.tokenField}>
                <span style={styles.fieldName}>last name:</span>
                <span style={styles.fieldValue}>{String(payload.family_name)}</span>
              </div>
            )}
            {'email' in payload && (
              <div style={styles.tokenField}>
                <span style={styles.fieldName}>email:</span>
                <span style={styles.fieldValue}>{String(payload.email)}</span>
              </div>
            )}
            {'preferred_username' in payload && (
              <div style={styles.tokenField}>
                <span style={styles.fieldName}>username:</span>
                <span style={styles.fieldValue}>{String(payload.preferred_username)}</span>
              </div>
            )}
            {'exp' in payload && (
              <div style={styles.tokenField}>
                <span style={styles.fieldName}>exp:</span>
                <span style={styles.fieldValue}>
                  {new Date(Number(payload.exp) * 1000).toLocaleString()}
                </span>
              </div>
            )}
            {'iat' in payload && (
              <div style={styles.tokenField}>
                <span style={styles.fieldName}>iat:</span>
                <span style={styles.fieldValue}>
                  {new Date(Number(payload.iat) * 1000).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div style={styles.jsonSection}>
            <div style={styles.jsonLabel}>Payload:</div>
            <pre style={styles.jsonPre}>{JSON.stringify(payload, null, 2)}</pre>
          </div>

          <div style={styles.jsonSection}>
            <div style={styles.jsonLabel}>Header:</div>
            <pre style={styles.jsonPre}>{JSON.stringify(decoded.header, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

// Форма настроек
interface OidcSettings {
  authority: string
  clientId: string
  scope: string
  redirectUri: string
}

function SettingsForm({
  settings,
  onSave,
  onClose
}: {
  settings: OidcSettings
  onSave: (settings: OidcSettings) => void
  onClose: () => void
}) {
  const [form, setForm] = useState(settings)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem(OIDC_SETTINGS_KEY, JSON.stringify(form))
    onSave(form)
  }

  const handleReset = () => {
    localStorage.removeItem(OIDC_SETTINGS_KEY)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('oidc.')) localStorage.removeItem(key)
    })
    setForm(defaultSettings)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>OIDC Settings</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Authority</label>
            <input
              style={styles.input}
              value={form.authority}
              onChange={(e) => setForm({ ...form, authority: e.target.value })}
              placeholder="https://auth.example.com/realms/myrealm"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Client ID</label>
            <input
              style={styles.input}
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Scope</label>
            <input
              style={styles.input}
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Redirect URI</label>
            <input
              style={styles.input}
              value={form.redirectUri}
              onChange={(e) => setForm({ ...form, redirectUri: e.target.value })}
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" style={styles.resetBtn} onClick={handleReset}>Reset</button>
            <button type="submit" style={styles.saveBtn}>Save & Reconnect</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Главный Debug Panel
function AuthDebugPanel({
  settings,
  onOpenSettings,
  logs,
  addLog,
  clearLogs
}: {
  settings: OidcSettings
  onOpenSettings: () => void
  logs: LogEntry[]
  addLog: (level: LogLevel, message: string, data?: string) => void
  clearLogs: () => void
}) {
  const auth = useAuth()
  const [timeLeft, setTimeLeft] = useState<{ text: string; seconds: number }>({ text: '', seconds: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const prevAuthState = useRef<boolean | null>(null)

  // Копирование в буфер
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addLog('success', 'Copied to clipboard')
  }

  // Подписка на OIDC события
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

  // Отслеживание изменения состояния авторизации
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

  // Таймер
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

  // Логирование ошибки
  useEffect(() => {
    if (auth.error) {
      addLog('error', 'Auth error', auth.error.message)
    }
  }, [auth.error, addLog])

  // Действия
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
  const isExpiringSoon = timeLeft.seconds > 0 && timeLeft.seconds < 120

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Keycloak Debug</h1>
          <div style={styles.configInfo}>
            {settings.authority} | {settings.clientId}
          </div>
        </div>
        <div style={styles.headerButtons}>
          {auth.isLoading && (
            <span style={styles.loadingIndicator}>Loading...</span>
          )}
          {auth.isAuthenticated && (
            <button
              style={{
                ...styles.refreshBtn,
                backgroundColor: isExpired ? '#22c55e' : '#3b82f6'
              }}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : isExpired ? 'Refresh!' : 'Refresh'}
            </button>
          )}
          <button style={styles.settingsBtn} onClick={onOpenSettings}>Settings</button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* Left: Status & Actions */}
        <div style={styles.leftPanel}>
          {/* Status Card */}
          <div style={{
            ...styles.statusCard,
            borderColor: auth.isAuthenticated ? '#4ade80' : '#f87171'
          }}>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>Status</span>
              <span style={{
                ...styles.statusValue,
                color: auth.isAuthenticated ? '#4ade80' : '#f87171'
              }}>
                {auth.isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}
              </span>
            </div>

            {auth.isAuthenticated && (
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Expires In</span>
                <span style={{
                  ...styles.statusValue,
                  color: isExpired ? '#f87171' : isExpiringSoon ? '#fbbf24' : '#4ade80'
                }}>
                  {timeLeft.text || 'N/A'}
                </span>
              </div>
            )}

            {auth.user?.profile?.email && (
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>User</span>
                <span style={styles.statusValue}>{auth.user.profile.email as string}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={styles.actionsCard}>
            <div style={styles.actionsTitle}>Actions</div>

            {!auth.isAuthenticated ? (
              <div style={styles.actionButtons}>
                <button style={styles.btnPrimary} onClick={() => handleLogin('redirect')}>
                  Login (Redirect)
                </button>
                <button style={styles.btnSecondary} onClick={() => handleLogin('popup')}>
                  Login (Popup)
                </button>
              </div>
            ) : (
              <div style={styles.actionButtons}>
                <button
                  style={{
                    ...styles.btnPrimary,
                    backgroundColor: isExpired ? '#22c55e' : '#3b82f6'
                  }}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing...' : isExpired ? 'Refresh (Expired!)' : 'Refresh Token'}
                </button>
                <button style={styles.btnDanger} onClick={() => handleLogout('redirect')}>
                  Logout (Redirect)
                </button>
                <button style={styles.btnSecondary} onClick={() => handleLogout('silent')}>
                  Logout (Silent)
                </button>
                <button style={styles.btnSecondary} onClick={() => handleLogout('local')}>
                  Remove Local
                </button>
              </div>
            )}
          </div>

          {/* Tokens */}
          <div style={styles.tokensCard}>
            <div style={styles.actionsTitle}>Tokens</div>
            <TokenPanel
              token={auth.user?.access_token}
              label="Access Token"
              onCopy={copyToClipboard}
            />
            <TokenPanel
              token={auth.user?.id_token}
              label="ID Token"
              onCopy={copyToClipboard}
            />
            <TokenPanel
              token={auth.user?.refresh_token}
              label="Refresh Token"
              onCopy={copyToClipboard}
            />
          </div>
        </div>

        {/* Right: Logs */}
        <div style={styles.rightPanel}>
          <LogPanel logs={logs} onClear={clearLogs} />
        </div>
      </div>
    </div>
  )
}

// Root App
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
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('oidc.')) localStorage.removeItem(k)
    })
    setSettings(newSettings)
    setShowSettings(false)
    addLog('info', 'Settings updated, reconnecting...', `Authority: ${newSettings.authority}`)
    setKey(prev => prev + 1)
  }

  // Initial log
  useEffect(() => {
    addLog('info', 'Debug sandbox initialized', `Authority: ${settings.authority}`)
  }, []) // eslint-disable-line

  const oidcConfig = {
    authority: settings.authority,
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    post_logout_redirect_uri: window.location.origin,
    silent_redirect_uri: `${window.location.origin}/silent-renew`,
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

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #334155',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#f8fafc',
  },
  configInfo: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
  },
  headerButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  loadingIndicator: {
    color: '#fbbf24',
    fontSize: '13px',
    padding: '8px 12px',
    backgroundColor: '#1e293b',
    borderRadius: '6px',
  },
  refreshBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  settingsBtn: {
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 500px',
    gap: '16px',
    height: 'calc(100vh - 100px)',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'auto',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    borderLeft: '4px solid',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #334155',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: '13px',
  },
  statusValue: {
    fontSize: '14px',
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
  },
  actionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#f8fafc',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  btnSecondary: {
    backgroundColor: '#475569',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  btnDanger: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tokensCard: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    flex: 1,
    overflow: 'auto',
  },
  tokenCard: {
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    marginBottom: '8px',
    overflow: 'hidden',
  },
  tokenCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    cursor: 'pointer',
    backgroundColor: '#1e293b',
  },
  tokenLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#e2e8f0',
  },
  noToken: {
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic',
  },
  tokenActions: {
    display: 'flex',
    gap: '8px',
  },
  copyBtn: {
    backgroundColor: '#334155',
    color: '#e2e8f0',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  tokenDetails: {
    padding: '12px',
  },
  tokenFields: {
    marginBottom: '12px',
  },
  tokenField: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    padding: '4px 0',
  },
  fieldName: {
    color: '#64748b',
    minWidth: '80px',
  },
  fieldValue: {
    color: '#e2e8f0',
    wordBreak: 'break-all',
  },
  jsonSection: {
    marginTop: '12px',
  },
  jsonLabel: {
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  jsonPre: {
    backgroundColor: '#020617',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#4ade80',
    overflow: 'auto',
    maxHeight: '200px',
    margin: '8px 0 0 0',
  },
  rawTokenPre: {
    backgroundColor: '#020617',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#94a3b8',
    overflow: 'auto',
    maxHeight: '100px',
    margin: '8px 0 0 0',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
  },
  logPanel: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #334155',
  },
  logTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  clearBtn: {
    backgroundColor: '#334155',
    color: '#e2e8f0',
    border: 'none',
    padding: '4px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  logList: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 0',
  },
  noLogs: {
    padding: '20px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '13px',
  },
  logItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '6px 16px',
    fontSize: '12px',
    borderBottom: '1px solid #1e293b',
  },
  logTime: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: '11px',
    minWidth: '70px',
  },
  logIcon: {
    fontSize: '12px',
    minWidth: '14px',
  },
  logMessage: {
    fontWeight: '500',
  },
  logData: {
    color: '#64748b',
    marginLeft: '4px',
  },
  // Modal
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#f8fafc',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#e2e8f0',
    fontSize: '13px',
  },
  input: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  resetBtn: {
    backgroundColor: '#475569',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  saveBtn: {
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
}
