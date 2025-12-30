import { decodeJwt } from '../helpers'

interface TokenPanelProps {
  token: string | undefined
  label: string
  onCopy: (text: string) => void
}

const TOKEN_FIELDS = ['sub', 'given_name', 'family_name', 'email', 'preferred_username', 'exp', 'iat'] as const

export function TokenPanel({ token, label, onCopy }: TokenPanelProps) {
  if (!token) {
    return (
      <div className="bg-card rounded-xl mb-2 overflow-hidden border border-card-border">
        <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 bg-surface-container/50">
          <span className="text-xs md:text-label-lg text-foreground">{label}</span>
          <span className="text-[10px] md:text-label-md text-muted-foreground italic">Not available</span>
        </div>
      </div>
    )
  }

  const decoded = decodeJwt(token)
  const payload = decoded?.payload

  const formatFieldValue = (field: string, value: unknown): string => {
    if (field === 'exp' || field === 'iat') {
      return new Date(Number(value) * 1000).toLocaleString()
    }
    return String(value)
  }

  return (
    <div className="bg-card rounded-xl mb-2 md:mb-3 overflow-hidden border border-card-border">
      <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 bg-surface-container border-b border-border">
        <span className="text-xs md:text-label-lg font-semibold text-foreground">{label}</span>
        <button
          className="h-6 md:h-7 px-2.5 md:px-3 rounded-full text-[10px] md:text-label-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => onCopy(token)}
        >
          Copy
        </button>
      </div>

      <pre className="bg-surface-container/70 p-2.5 md:p-3 rounded-lg text-[8px] md:text-[10px] text-foreground/60 overflow-auto max-h-[60px] md:max-h-[100px] mx-3 my-2 md:mx-4 md:my-3 break-all whitespace-pre-wrap font-mono border border-border/50">
        {token}
      </pre>

      {decoded && payload && (
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 md:gap-y-1.5 py-2">
            {TOKEN_FIELDS.map((field) =>
              field in payload ? (
                <>
                  <span key={`${field}-label`} className="text-foreground/50 text-[10px] md:text-xs font-medium">{field}</span>
                  <span key={`${field}-value`} className="text-foreground text-[10px] md:text-xs break-all font-mono">
                    {formatFieldValue(field, payload[field])}
                  </span>
                </>
              ) : null
            )}
          </div>

          <div className="mt-3 md:mt-4">
            <div className="text-[10px] md:text-xs text-foreground/50 mb-2 font-semibold uppercase tracking-wide">Payload</div>
            <pre className="bg-surface-container p-2.5 md:p-3 rounded-lg text-[9px] md:text-[11px] text-foreground/80 overflow-auto max-h-[120px] md:max-h-[200px] font-mono border border-border/50">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>

          <div className="mt-3 md:mt-4">
            <div className="text-[10px] md:text-xs text-foreground/50 mb-2 font-semibold uppercase tracking-wide">Header</div>
            <pre className="bg-surface-container p-2.5 md:p-3 rounded-lg text-[9px] md:text-[11px] text-foreground/80 overflow-auto max-h-[120px] md:max-h-[200px] font-mono border border-border/50">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
