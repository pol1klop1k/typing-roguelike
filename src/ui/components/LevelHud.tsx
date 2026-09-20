import { motion } from 'motion/react'
import { BALANCE } from '../../core/balance'
import type { Language, LevelSnapshot } from '../../core/types'
import { comboTier, multTier, nextTierAt } from '../intensity'

interface LevelHudProps {
  snapshot: LevelSnapshot
  language: Language
}

const LABELS = {
  ru: {
    time: 'Время',
    score: 'Счёт',
    target: 'цель',
    mult: 'Множитель',
    combo: 'Комбо',
    errors: 'Ошибок',
    inWord: 'В слове',
  },
  en: {
    time: 'Time',
    score: 'Score',
    target: 'target',
    mult: 'Mult',
    combo: 'Combo',
    errors: 'Errors',
    inWord: 'In word',
  },
} as const

export function LevelHud({ snapshot, language }: LevelHudProps) {
  const labels = LABELS[language]

  const seconds = snapshot.timeLeftMs / 1000
  const urgent = snapshot.timeLeftMs <= BALANCE.lowTimeWarningMs
  const critical = snapshot.timeLeftMs <= 5_000

  const timeColor = critical ? 'text-term-red' : urgent ? 'text-term-amber' : 'text-term'
  const timeRatio = snapshot.totalTimeMs === 0 ? 0 : snapshot.timeLeftMs / snapshot.totalTimeMs
  const scoreRatio = Math.min(1, snapshot.score / snapshot.targetScore)

  const tier = comboTier(snapshot.combo)
  const heat = multTier(snapshot.mult)
  const nextTier = nextTierAt(snapshot.combo)
  const tierProgress =
    nextTier === null ? 1 : (snapshot.combo - tier.min) / (nextTier - tier.min)

  return (
    <div className="grid shrink-0 grid-cols-1 gap-4 border-b border-term-line px-4 py-3 sm:grid-cols-2 sm:gap-8">
      <Gauge label={labels.time}>
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
        label={labels.score}
        aside={
          <span className="text-term-muted">
            {labels.target}{' '}
            <span className="text-term-bright">{snapshot.targetScore.toLocaleString('ru-RU')}</span>
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

      <div className="col-span-full flex flex-wrap items-end gap-x-8 gap-y-3">
        {/* Комбо - главный индикатор серии, поэтому крупнее остальных счётчиков. */}
        <div className="flex min-w-32 flex-col gap-1">
          <div className="text-[0.7rem] tracking-[0.25em] text-term-muted uppercase">
            {labels.combo}
          </div>
          <motion.span
            // Рывок только при смене ступени: дёргать число на каждом
            // символе - значит превратить панель в мигающий шум.
            key={tier.level}
            className={`glow leading-none tabular-nums text-term-bright ${tier.hudSize}`}
            initial={{ scale: 1.5 }}
            animate={
              tier.pulse ? { scale: 1, opacity: [1, 0.6, 1] } : { scale: 1, opacity: 1 }
            }
            transition={
              tier.pulse
                ? { scale: { type: 'spring', stiffness: 400, damping: 14 }, opacity: { duration: 0.9, repeat: Infinity } }
                : { type: 'spring', stiffness: 400, damping: 14 }
            }
          >
            {snapshot.combo}
          </motion.span>
          <div className="h-1 w-28 border border-term-line bg-term-bg">
            <motion.div
              className={`h-full ${tier.level >= 2 ? 'bg-term-bright' : 'bg-term'}`}
              animate={{ width: `${Math.max(0, Math.min(1, tierProgress)) * 100}%` }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Множитель решает счёт, поэтому у него свой блок и своя шкала
            цвета - та же, что у высоты тона в звуке слова. */}
        <div className="flex flex-col gap-1">
          <div className="text-[0.7rem] tracking-[0.25em] text-term-muted uppercase">
            {labels.mult}
          </div>
          <motion.span
            key={snapshot.mult}
            className={`${heat.glow} text-3xl leading-none tabular-nums ${heat.color}`}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 16 }}
          >
            x{snapshot.mult.toFixed(1)}
          </motion.span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs tracking-widest uppercase">
          <Readout label={labels.errors}>
            <span className={`text-lg ${snapshot.errors > 0 ? 'text-term-red' : 'text-term-dim'}`}>
              {snapshot.errors}
            </span>
          </Readout>
          <Readout label={labels.inWord}>
            <span className="text-lg text-term-muted">{snapshot.wordChips}</span>
          </Readout>
        </div>
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
