import { motion } from 'motion/react'
import { BALANCE } from '../../core/balance'
import type { Language, LevelSnapshot } from '../../core/types'
import { multTier, nextMultTierAt } from '../intensity'
import { CREDIT_GLYPH } from './CreditsMeter'

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
    needed: 'нужно',
    payout: 'Награда',
    combo: 'Комбо',
    errors: 'Ошибок',
    inWord: 'В слове',
  },
  en: {
    time: 'Time',
    score: 'Score',
    target: 'target',
    mult: 'Mult',
    needed: 'needs',
    payout: 'Payout',
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

  const heat = multTier(snapshot.mult)
  const nextTier = nextMultTierAt(snapshot.mult)
  const tierProgress =
    nextTier === null ? 1 : (snapshot.mult - heat.min) / (nextTier - heat.min)

  return (
    <div className="grid shrink-0 grid-cols-1 gap-4 border-b border-term-line px-4 py-3 sm:grid-cols-2 sm:gap-8">
      {/* Требуемая скорость стоит рядом с таймером не случайно: это и есть
          объяснение, почему таймер именно такой. */}
      <Gauge
        label={labels.time}
        aside={
          <span className="text-term-muted">
            {labels.needed}{' '}
            <span className="text-term-bright">{snapshot.requiredWpm} wpm</span>
          </span>
        }
      >
        <motion.span
          className={`glow text-3xl tabular-nums ${timeColor}`}
          animate={critical ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={critical ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
        >
          {seconds.toFixed(1)}
        </motion.span>
        <Bar ratio={timeRatio} className={critical ? 'bg-term-red' : urgent ? 'bg-term-amber' : 'bg-term'} />
        <Payout
          label={labels.payout}
          base={snapshot.rewardBase}
          bonus={snapshot.rewardTimeBonus}
        />
      </Gauge>

      <Gauge
        label={labels.score}
        aside={
          <span className="text-term-muted">
            {labels.target}{' '}
            <span className="text-term-bright">{compactScore(snapshot.targetScore)}</span>
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
          {compactScore(snapshot.score)}
        </motion.span>
        <Bar ratio={scoreRatio} className="bg-term-bright" />
      </Gauge>

      <div className="col-span-full flex flex-wrap items-end gap-x-8 gap-y-3">
        {/* Единственный выделенный показатель. Он решает счёт, его шкала
            цвета совпадает со шкалой высоты тона в звуке слова. */}
        <div className="flex min-w-32 flex-col gap-1">
          <div className="text-[0.7rem] tracking-[0.25em] text-term-muted uppercase">
            {labels.mult}
          </div>
          <motion.span
            // Рывок только при смене ступени: дёргать число на каждом
            // слове - значит превратить панель в мигающий шум.
            key={heat.level}
            className={`${heat.glow} leading-none tabular-nums ${heat.hudSize} ${heat.color}`}
            initial={{ scale: 1.5 }}
            animate={heat.pulse ? { scale: 1, opacity: [1, 0.6, 1] } : { scale: 1, opacity: 1 }}
            transition={
              heat.pulse
                ? { scale: { type: 'spring', stiffness: 400, damping: 14 }, opacity: { duration: 0.9, repeat: Infinity } }
                : { type: 'spring', stiffness: 400, damping: 14 }
            }
          >
            x{snapshot.mult.toFixed(1)}
          </motion.span>
          <div className="h-1 w-28 border border-term-line bg-term-bg">
            <motion.div
              className={`h-full ${heat.level >= 2 ? 'bg-term-hot' : 'bg-term'}`}
              animate={{ width: `${Math.max(0, Math.min(1, tierProgress)) * 100}%` }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Комбо, ошибки и символы в слове - обычные счётчики без оформления. */}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs tracking-widest uppercase">
          <Readout label={labels.combo}>
            <span className="text-lg text-term-muted">{snapshot.combo}</span>
          </Readout>
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

/**
 * Сколько узел заплатит, если взять его сейчас.
 *
 * Стоит вплотную к полосе времени, потому что это её продолжение: надбавка
 * за запас тает вместе с ней и упирается в базовую награду, ниже которой не
 * падает. Показывается ИТОГ, а не надбавка: игрок думает о том, сколько
 * получит, а не о слагаемых.
 *
 * Рывок вешается на надбавку - тогда каждая потерянная монета видна как
 * событие. Молча уменьшающееся число игрок не замечает, а именно оно и есть
 * причина печатать быстрее, чем требует узел.
 */
function Payout({ label, base, bonus }: { label: string; base: number; bonus: number }) {
  return (
    <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
      <span className="hidden text-[0.7rem] tracking-[0.25em] text-term-muted uppercase lg:inline">
        {label}
      </span>
      <motion.span
        key={bonus}
        className={`text-lg tabular-nums ${bonus > 0 ? 'glow-soft text-term-amber' : 'text-term-dim'}`}
        initial={{ scale: 1.35 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 15 }}
      >
        {CREDIT_GLYPH}+{base + bonus}
      </motion.span>
    </span>
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

/**
 * Счёт в поздних актах уходит в миллионы: цель растёт как квадрат требуемой
 * скорости. Разряды целиком туда уже не влезают, да и не нужны - игрок
 * следит за порядком величины и за полосой, а не за единицами.
 */
function compactScore(value: number): string {
  if (value < 100_000) return value.toLocaleString('ru-RU')
  if (value < 1_000_000) return `${Math.round(value / 1_000)}K`
  return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 2 : 1)}M`
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
