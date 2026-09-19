import { motion } from 'motion/react'
import { BALANCE } from '../../core/balance'
import type { LevelSnapshot } from '../../core/types'

interface LevelHudProps {
  snapshot: LevelSnapshot
}

export function LevelHud({ snapshot }: LevelHudProps) {
  const seconds = snapshot.timeLeftMs / 1000
  const urgent = snapshot.timeLeftMs <= BALANCE.lowTimeWarningMs
  const critical = snapshot.timeLeftMs <= 5_000

  const timeColor = critical ? 'text-term-red' : urgent ? 'text-term-amber' : 'text-term'
  const timeRatio = snapshot.totalTimeMs === 0 ? 0 : snapshot.timeLeftMs / snapshot.totalTimeMs
  const scoreRatio = Math.min(1, snapshot.score / snapshot.targetScore)

  return (
    <div className="grid shrink-0 grid-cols-1 gap-4 border-b border-term-line px-4 py-3 sm:grid-cols-2 sm:gap-8">
      <Gauge label="Время">
        <motion.span
          className={`glow text-3xl tabular-nums ${timeColor}`}
          animate={critical ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={critical ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
        >
          {seconds.toFixed(1)}
        </motion.span>
        <Bar ratio={timeRatio} className={critical ? 'bg-term-red' : urgent ? 'bg-term-amber' : 'bg-term'} />
      </Gauge>

      <Gauge
        label="Счёт"
        aside={
          <span className="text-term-muted">
            цель <span className="text-term-bright">{snapshot.targetScore.toLocaleString('ru-RU')}</span>
          </span>
        }
      >
        <motion.span
          key={snapshot.score}
          className="glow text-3xl tabular-nums text-term-bright"
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          {snapshot.score.toLocaleString('ru-RU')}
        </motion.span>
        <Bar ratio={scoreRatio} className="bg-term-bright" />
      </Gauge>

      <div className="col-span-full flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs tracking-widest uppercase">
        <Readout label="Множитель">
          <motion.span
            key={snapshot.mult}
            className="glow text-lg text-term-amber"
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 16 }}
          >
            x{snapshot.mult.toFixed(1)}
          </motion.span>
        </Readout>
        <Readout label="Комбо">
          <span className="text-lg text-term">{snapshot.combo}</span>
        </Readout>
        <Readout label="Ошибок">
          <span className={`text-lg ${snapshot.errors > 0 ? 'text-term-red' : 'text-term-dim'}`}>
            {snapshot.errors}
          </span>
        </Readout>
        <Readout label="В слове">
          <span className="text-lg text-term-muted">{snapshot.wordChips}</span>
        </Readout>
      </div>
    </div>
  )
}

function Gauge({
  label,
  aside,
  children,
}: {
  label: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-[0.7rem] tracking-[0.25em] text-term-muted uppercase">
        <span>{label}</span>
        {aside}
      </div>
      <div className="flex items-baseline gap-3">{children}</div>
    </div>
  )
}

function Bar({ ratio, className }: { ratio: number; className: string }) {
  return (
    <div className="h-2 flex-1 border border-term-line bg-term-bg">
      <motion.div
        className={`h-full ${className}`}
        animate={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      />
    </div>
  )
}

function Readout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-term-muted">{label}</span>
      {children}
    </span>
  )
}
