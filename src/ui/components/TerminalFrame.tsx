import type { ReactNode } from 'react'

interface TerminalFrameProps {
  title: string
  right?: ReactNode
  children: ReactNode
}

/** Корпус монитора: развёртка, виньетка, дрожание люминофора и рамка. */
export function TerminalFrame({ title, right, children }: TerminalFrameProps) {
  return (
    <div className="scanlines vignette relative h-full w-full overflow-hidden bg-term-bg">
      <div className="flicker relative z-20 flex h-full items-center justify-center p-3 sm:p-6">
        <div className="flex h-full max-h-[48rem] w-full max-w-5xl flex-col border border-term-line bg-term-panel/70 shadow-[0_0_80px_rgba(92,255,157,0.07)]">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-term-line px-4 py-2 text-[0.7rem] tracking-[0.25em] text-term-muted uppercase">
            <span className="glow-soft truncate">{title}</span>
            {right ? <span className="shrink-0">{right}</span> : null}
          </header>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  )
}
