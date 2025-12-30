import { cn } from '../helpers'

interface ActionsCardProps {
  isAuthenticated: boolean
  isExpired: boolean
  refreshing: boolean
  onLogin: (method: 'redirect' | 'popup') => void
  onLogout: (method: 'redirect' | 'silent' | 'local') => void
  onRefresh: () => void
}

export function ActionsCard({
  isAuthenticated,
  isExpired,
  refreshing,
  onLogin,
  onLogout,
  onRefresh,
}: ActionsCardProps) {
  return (
    <div className="bg-card rounded-xl p-3 md:p-4 shadow-sm border border-card-border animate-slide-up">
      <div className="text-xs md:text-sm font-semibold mb-3 text-foreground">Actions</div>

      {!isAuthenticated ? (
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <Button variant="primary" onClick={() => onLogin('redirect')}>
            Login (Redirect)
          </Button>
          <Button variant="secondary" onClick={() => onLogin('popup')}>
            Login (Popup)
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <Button
            variant={isExpired ? 'success' : 'primary'}
            onClick={onRefresh}
            disabled={refreshing}
            className="col-span-2 md:col-span-1"
          >
            {refreshing ? 'Refreshing...' : isExpired ? 'Refresh (Expired!)' : 'Refresh Token'}
          </Button>
          <Button variant="danger" onClick={() => onLogout('redirect')}>
            Logout
          </Button>
          <Button variant="grey" onClick={() => onLogout('silent')}>
            Silent
          </Button>
          <Button variant="grey" onClick={() => onLogout('local')}>
            Remove
          </Button>
        </div>
      )}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'grey'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  grey: 'bg-surface-container text-foreground hover:bg-surface-container/80',
  danger: 'bg-destructive text-white hover:bg-destructive/90',
  success: 'bg-success text-white hover:bg-success/90',
}

function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode
  variant?: ButtonVariant
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center h-10 md:h-11 px-3 md:px-5 py-2 md:py-3 rounded-full text-xs md:text-label-lg transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        BUTTON_VARIANTS[variant],
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
