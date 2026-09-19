import { motion } from 'motion/react'
import { useEffect } from 'react'
import { sfx } from '../../audio/sfx'
import { useGameStore } from '../../state/gameStore'
import type { Difficulty, Language, LevelText } from '../../core/types'
import { TerminalButton } from '../components/TerminalButton'
import { TerminalFrame } from '../components/TerminalFrame'

const LABELS = {
  ru: {
    heading: 'Выбери цель',
    sub: 'Чем опаснее узел, тем выше награда. Отменить выбор нельзя.',
    time: 'время',
    target: 'цель',
    length: 'знаков',
    reward: 'награда',
    back: 'Назад',
    hint: '1 / 2 / 3 — выбрать, Esc — назад',
    credits: 'Кредиты',
  },
  en: {
    heading: 'Choose a target',
    sub: 'The more dangerous the node, the bigger the payout. No takebacks.',
    time: 'time',
    target: 'target',
    length: 'chars',
    reward: 'reward',
    back: 'Back',
    hint: '1 / 2 / 3 to choose, Esc to go back',
    credits: 'Credits',
  },
} as const

const DIFFICULTY: Record<Difficulty, { ru: string; en: string; className: string }> = {
  easy: { ru: 'низкий риск', en: 'low risk', className: 'text-term' },
  normal: { ru: 'средний риск', en: 'medium risk', className: 'text-term-amber' },
  hard: { ru: 'высокий риск', en: 'high risk', className: 'text-term-red' },
}

export function TextSelect() {
  const texts = useGameStore((state) => state.texts)
  const language = useGameStore((state) => state.language)
  const credits = useGameStore((state) => state.credits)
  const selectText = useGameStore((state) => state.selectText)
  const openMenu = useGameStore((state) => state.openMenu)

  const labels = LABELS[language]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      sfx.unlock()
      if (event.key === 'Escape') {
        openMenu()
        return
      }
      const index = Number.parseInt(event.key, 10) - 1
      const text = texts[index]
      if (text) selectText(text.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [texts, selectText, openMenu])

  return (
    <TerminalFrame title="signal // targets" right={`${labels.credits}: ${credits}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 sm:px-10">
        <div>
          <h2 className="glow text-2xl tracking-[0.25em] text-term-bright uppercase">{labels.heading}</h2>
          <p className="mt-1 text-sm text-term-muted">{labels.sub}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {texts.map((text, index) => (
            <TargetCard
              key={text.id}
              text={text}
              index={index}
              language={language}
              labels={labels}
              onSelect={() => {
                sfx.unlock()
                selectText(text.id)
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-6">
          <TerminalButton variant="ghost" onClick={openMenu}>
            {labels.back}
          </TerminalButton>
          <span className="text-xs tracking-widest text-term-dim uppercase">{labels.hint}</span>
        </div>
      </div>
    </TerminalFrame>
  )
}

function TargetCard({
  text,
  index,
  language,
  labels,
  onSelect,
}: {
  text: LevelText
  index: number
  language: Language
  labels: (typeof LABELS)[Language]
  onSelect: () => void
}) {
  const variant = text.variants[language]
  const difficulty = DIFFICULTY[text.difficulty]

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="group flex cursor-pointer flex-col gap-4 border border-term-line bg-term-bg/60 p-4 text-left transition-colors hover:border-term focus-visible:border-term focus-visible:outline-none"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.25 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="glow-soft text-sm tracking-[0.2em] text-term-bright uppercase">
          [{index + 1}] {variant.title}
        </span>
      </div>

      <span className={`text-xs tracking-[0.25em] uppercase ${difficulty.className}`}>
        {difficulty[language]}
      </span>

      <p className="line-clamp-3 text-sm text-term-dim group-hover:text-term-muted">{variant.body}</p>

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 text-xs tracking-widest uppercase">
        <Stat label={labels.time} value={`${Math.round(variant.durationMs / 1000)}s`} />
        <Stat label={labels.length} value={String(variant.body.length)} />
        <Stat label={labels.target} value={variant.targetScore.toLocaleString('ru-RU')} />
        <Stat label={labels.reward} value={`+${text.reward}`} accent />
      </dl>
    </motion.button>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-term-dim">{label}</dt>
      <dd className={accent ? 'text-term-amber' : 'text-term'}>{value}</dd>
    </div>
  )
}
