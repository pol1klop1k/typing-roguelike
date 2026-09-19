import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'border-term text-term hover:bg-term hover:text-term-bg focus-visible:bg-term focus-visible:text-term-bg',
  ghost:
    'border-term-line text-term-muted hover:border-term-dim hover:text-term focus-visible:border-term-dim focus-visible:text-term',
}

export function TerminalButton({ variant = 'primary', className = '', ...props }: TerminalButtonProps) {
  return (
    <button
      type="button"
      className={`glow-soft cursor-pointer border px-5 py-2 text-sm tracking-[0.2em] uppercase transition-colors outline-none focus-visible:ring-1 focus-visible:ring-term disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
