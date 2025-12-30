import { useEffect, useRef } from 'react'
import type { LogEntry } from '../types'
import { LOG_LEVEL_COLORS, LOG_LEVEL_ICONS } from '../constants'
import { cn } from '../helpers'

interface LogPanelProps {
  logs: LogEntry[]
  onClear: () => void
}

export function LogPanel({ logs, onClear }: LogPanelProps) {
  const logListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="bg-card rounded-xl flex flex-col h-full overflow-hidden shadow-sm border border-card-border animate-slide-up">
      <div className="flex justify-between items-center px-3 md:px-4 py-2.5 md:py-3 border-b border-border bg-surface-container">
        <span className="text-xs md:text-sm font-semibold text-foreground">
          Logs
          <span className="ml-1.5 text-foreground/50 font-normal">({logs.length})</span>
        </span>
        <button
          className="h-7 md:h-8 px-3 md:px-4 rounded-full text-[11px] md:text-label-md bg-card text-foreground hover:bg-card/80 transition-all border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-auto py-1 md:py-2" ref={logListRef}>
        {logs.length === 0 ? (
          <div className="p-4 md:p-5 text-center text-muted-foreground text-xs md:text-sm">No logs yet. Try logging in.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs border-b border-border/50 hover:bg-surface-container/50 transition-colors">
              <span className="text-foreground/50 font-mono text-[9px] md:text-[11px] min-w-[55px] md:min-w-[70px] shrink-0 tabular-nums">
                {log.time.toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span className={cn('text-sm min-w-[16px] md:min-w-[18px]', LOG_LEVEL_COLORS[log.level])}>
                {LOG_LEVEL_ICONS[log.level]}
              </span>
              <div className="flex-1 min-w-0">
                <span className={cn('font-semibold break-words', LOG_LEVEL_COLORS[log.level])}>
                  {log.message}
                </span>
                {log.data && <span className="text-foreground/60 ml-2 text-[9px] md:text-[11px]">— {log.data}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
