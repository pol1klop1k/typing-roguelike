import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useGameStore } from '../../state/gameStore'
import { TerminalButton } from '../components/TerminalButton'
import { TerminalFrame } from '../components/TerminalFrame'

const LABELS = {
  ru: {
    won: 'УЗЕЛ ВЗЛОМАН',
    lostTime: 'ВРЕМЯ ВЫШЛО',
    lostText: 'ЦЕЛЬ НЕ ВЗЯТА',
    score: 'Счёт',
    target: 'Цель',
    speed: 'Скорость',
    accuracy: 'Точность',
    errors: 'Ошибок',
    combo: 'Лучшее комбо',
    time: 'Время',
    reward: 'Получено',
    credits: 'кредитов',
    creditsTitle: 'Кредиты',
    log: 'Расшифровка записи',
    retry: 'Ещё раз',
    another: 'Другая цель',
    menu: 'В меню',
    hint: 'Enter — ещё раз, Esc — к выбору',
    cpm: 'зн/мин',
  },
  en: {
    won: 'NODE BREACHED',
    lostTime: 'OUT OF TIME',
    lostText: 'TARGET NOT REACHED',
    score: 'Score',
    target: 'Target',
    speed: 'Speed',
    accuracy: 'Accuracy',
    errors: 'Errors',
    combo: 'Best combo',
    time: 'Time',
    reward: 'Earned',
    credits: 'credits',
    creditsTitle: 'Credits',
    log: 'Recovered log',
    retry: 'Retry',
    another: 'Another target',
    menu: 'Menu',
    hint: 'Enter to retry, Esc to choose again',
    cpm: 'cpm',
  },
} as const

export function ResultsScreen() {
  const result = useGameStore((state) => state.result)
  const language = useGameStore((state) => state.language)
  const activeText = useGameStore((state) => state.activeText)
  const credits = useGameStore((state) => state.credits)
  const retry = useGameStore((state) => state.retry)
  const openSelect = useGameStore((state) => state.openSelect)
  const openMenu = useGameStore((state) => state.openMenu)

  const labels = LABELS[language]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') retry()
      if (event.key === 'Escape') openSelect()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [retry, openSelect])

  if (!result || !activeText) return null

  const variant = activeText.variants[language]
  const heading = result.won
    ? labels.won
    : result.lossReason === 'time'
      ? labels.lostTime
      : labels.lostText

  return (
    <TerminalFrame title={variant.title} right={`${labels.creditsTitle}: ${credits}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 sm:px-10">
        <motion.h2
          className={`glow text-3xl tracking-[0.3em] sm:text-4xl ${
            result.won ? 'text-term-bright' : 'text-term-red'
          }`}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {heading}
        </motion.h2>

        <motion.dl
          className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Stat label={labels.score} value={result.score.toLocaleString('ru-RU')} accent />
          <Stat label={labels.target} value={result.targetScore.toLocaleString('ru-RU')} />
          <Stat label={labels.speed} value={`${result.cpm} ${labels.cpm}`} sub={`${result.wpm} wpm`} />
          <Stat label={labels.accuracy} value={`${result.accuracy}%`} />
          <Stat label={labels.errors} value={String(result.errors)} danger={result.errors > 0} />
          <Stat label={labels.combo} value={String(result.maxCombo)} />
          <Stat label={labels.time} value={`${(result.elapsedMs / 1000).toFixed(1)}s`} />
          <Stat
            label={labels.reward}
            value={`+${result.reward}`}
            sub={labels.credits}
            accent={result.reward > 0}
          />
        </motion.dl>

        {/* Досрочная победа обрывает печать на середине, но лор игрок должен
            получить целиком — иначе выигрывать становится невыгодно по сюжету. */}
        <motion.section
          className="border-t border-term-line pt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-2 text-[0.7rem] tracking-[0.25em] text-term-muted uppercase">{labels.log}</h3>
          <p className="text-sm leading-relaxed text-term sm:text-base">{variant.body}</p>
        </motion.section>

        <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
          <TerminalButton onClick={retry}>{labels.retry}</TerminalButton>
          <TerminalButton variant="ghost" onClick={openSelect}>
            {labels.another}
          </TerminalButton>
          <TerminalButton variant="ghost" onClick={openMenu}>
            {labels.menu}
          </TerminalButton>
          <span className="text-xs tracking-widest text-term-dim uppercase">{labels.hint}</span>
        </div>
      </div>
    </TerminalFrame>
  )
}

function Stat({
  label,
  value,
  sub,
  accent = false,
  danger = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  danger?: boolean
}) {
  const tone = danger ? 'text-term-red' : accent ? 'text-term-amber' : 'text-term-bright'
  return (
    <div>
      <dt className="text-[0.7rem] tracking-[0.2em] text-term-muted uppercase">{label}</dt>
      <dd className={`glow-soft text-2xl tabular-nums ${tone}`}>
        {value}
        {sub ? <span className="ml-2 text-xs tracking-widest text-term-dim uppercase">{sub}</span> : null}
      </dd>
    </div>
  )
}
