import { motion } from 'motion/react'
import { useEffect } from 'react'
import { activeText, useGameStore } from '../../state/gameStore'
import { CreditsMeter } from '../components/CreditsMeter'
import { ItemBar } from '../components/ItemBar'
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
    demanded: 'Требовалось',
    accuracy: 'Точность',
    errors: 'Ошибок',
    combo: 'Лучшее комбо',
    time: 'Время',
    reward: 'Получено',
    credits: 'кредитов',
    reserve: 'Запас времени',
    reserveBonus: 'надбавка',
    log: 'Расшифровка записи',
    menu: 'В меню',
    cpm: 'зн/мин',
    node: 'Узел',
    toShop: 'На склад',
    complete: 'ЗАБЕГ ПРОЙДЕН',
    completeSub: 'Все узлы взяты. Девятый узел ждёт в следующей версии.',
    over: 'ЗАБЕГ ОКОНЧЕН',
    overSub: 'Предметы и кредиты потеряны. В роглайте это называется опытом.',
    again: 'Новый забег',
    hintShop: 'Enter — на склад',
    hintOver: 'Enter — новый забег, Esc — в меню',
  },
  en: {
    won: 'NODE BREACHED',
    lostTime: 'OUT OF TIME',
    lostText: 'TARGET NOT REACHED',
    score: 'Score',
    target: 'Target',
    speed: 'Speed',
    demanded: 'Demanded',
    accuracy: 'Accuracy',
    errors: 'Errors',
    combo: 'Best combo',
    time: 'Time',
    reward: 'Earned',
    credits: 'credits',
    reserve: 'Time left',
    reserveBonus: 'bonus',
    log: 'Recovered log',
    menu: 'Menu',
    cpm: 'cpm',
    node: 'Node',
    toShop: 'To the depot',
    complete: 'RUN COMPLETE',
    completeSub: 'Every node taken. The ninth node waits in a future build.',
    over: 'RUN OVER',
    overSub: 'Items and credits are gone. In a roguelike that is called experience.',
    again: 'New run',
    hintShop: 'Enter for the depot',
    hintOver: 'Enter for a new run, Esc for the menu',
  },
} as const

export function ResultsScreen() {
  const result = useGameStore((state) => state.result)
  const run = useGameStore((state) => state.run)
  const language = useGameStore((state) => state.language)
  const text = useGameStore(activeText)
  const continueRun = useGameStore((state) => state.continueRun)
  const beginRun = useGameStore((state) => state.beginRun)
  const openMenu = useGameStore((state) => state.openMenu)

  const labels = LABELS[language]
  const finished = run !== null && run.phase !== 'shop'

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (finished) beginRun()
        else continueRun()
      }
      if (event.key === 'Escape') openMenu()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finished, beginRun, continueRun, openMenu])

  if (!result || !text || !run) return null

  const variant = text.variants[language]

  // Заголовок говорит про забег, а не про уровень: взятый узел в середине
  // забега и последний узел - это разные события, даже если счёт одинаков.
  const heading = !result.won
    ? labels.over
    : run.phase === 'complete'
      ? labels.complete
      : labels.won

  const subtitle = !result.won
    ? result.lossReason === 'time'
      ? labels.lostTime + '. ' + labels.overSub
      : labels.lostText + '. ' + labels.overSub
    : run.phase === 'complete'
      ? labels.completeSub
      : null

  return (
    <TerminalFrame
      title={`${labels.node} ${run.levelIndex + 1}/${run.totalLevels} // ${variant.title}`}
      // Счётчик начинает с суммы ДО узла и добирает награду на глазах:
      // начисление должно быть событием, а не готовым числом в углу.
      right={
        <CreditsMeter
          credits={run.credits}
          countFrom={run.credits - result.reward}
          language={language}
        />
      }
    >
      <ItemBar items={run.items} language={language} />

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 sm:px-10">
        <div>
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
          {subtitle ? <p className="mt-2 text-sm text-term-muted">{subtitle}</p> : null}
        </div>

        <motion.dl
          className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Stat label={labels.score} value={result.score.toLocaleString('ru-RU')} accent />
          <Stat label={labels.target} value={result.targetScore.toLocaleString('ru-RU')} />
          <Stat
            label={labels.speed}
            value={`${result.wpm} wpm`}
            sub={`${result.cpm} ${labels.cpm}`}
            danger={result.wpm < result.requiredWpm}
          />
          <Stat label={labels.demanded} value={`${result.requiredWpm} wpm`} />
          <Stat label={labels.accuracy} value={`${result.accuracy}%`} />
          <Stat label={labels.errors} value={String(result.errors)} danger={result.errors > 0} />
          <Stat label={labels.combo} value={String(result.maxCombo)} />
          <Stat label={labels.time} value={`${(result.elapsedMs / 1000).toFixed(1)}s`} />
          {/* Запас времени стоит рядом с наградой не для красоты: это
              единственное место, где игрок узнаёт, за что ему доплатили. */}
          <Stat
            label={labels.reserve}
            value={`${(result.timeLeftMs / 1000).toFixed(1)}s`}
            sub={result.rewardTimeBonus > 0 ? `${labels.reserveBonus} +${result.rewardTimeBonus}` : undefined}
            accent={result.rewardTimeBonus > 0}
          />
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
          {finished ? (
            <TerminalButton onClick={beginRun}>{labels.again}</TerminalButton>
          ) : (
            <TerminalButton onClick={continueRun}>{labels.toShop}</TerminalButton>
          )}
          <TerminalButton variant="ghost" onClick={openMenu}>
            {labels.menu}
          </TerminalButton>
          <span className="text-xs tracking-widest text-term-dim uppercase">
            {finished ? labels.hintOver : labels.hintShop}
          </span>
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
  sub?: string | undefined
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
