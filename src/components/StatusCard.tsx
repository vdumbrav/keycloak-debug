import { cn } from '../helpers'

interface StatusCardProps {
  isAuthenticated: boolean
  email?: string
  timeLeft: { text: string; seconds: number }
}

export function StatusCard({ isAuthenticated, email, timeLeft }: StatusCardProps) {
  const isExpired = timeLeft.text === 'EXPIRED'
  const isExpiringSoon = timeLeft.seconds > 0 && timeLeft.seconds < 120

  return (
    <div className="bg-card rounded-xl shadow-sm border border-card-border animate-slide-up overflow-hidden">
      <div className={cn(
        'px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-between',
        isAuthenticated ? 'bg-success/10' : 'bg-destructive/10'
      )}>
        <span className="text-xs md:text-sm font-semibold text-foreground">Status</span>
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs md:text-sm font-semibold',
          isAuthenticated ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
        )}>
          <span className={cn(
            'w-2 h-2 rounded-full',
            isAuthenticated ? 'bg-success' : 'bg-destructive'
          )} />
          {isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}
        </span>
      </div>
      {(isAuthenticated || email) && (
        <div className="p-3 md:p-4">
          {isAuthenticated && (
            <StatusRow
              label="Expires In"
              value={timeLeft.text || 'N/A'}
              valueClass={cn(
                isExpired && 'text-destructive',
                isExpiringSoon && 'text-warning',
                !isExpired && !isExpiringSoon && 'text-success'
              )}
            />
          )}
          {email && (
            <StatusRow label="User" value={email} />
          )}
        </div>
      )}
    </div>
  )
}

function StatusRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-center gap-2 py-2 border-b border-border last:border-b-0">
      <span className="text-muted-foreground text-xs md:text-sm shrink-0">{label}</span>
      <span className={cn('text-xs md:text-sm font-semibold text-right truncate', valueClass)}>{value}</span>
    </div>
  )
}
