export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'event'

export interface LogEntry {
  id: number
  time: Date
  level: LogLevel
  message: string
  data?: string
}

export interface OidcSettings {
  authority: string
  clientId: string
  scope: string
  redirectUri: string
}

export interface DecodedJwt {
  header: object
  payload: Record<string, unknown>
}
