import { motion } from 'motion/react'
import { useEffect } from 'react'
import { sfx } from '../../audio/sfx'
import { TEXTS } from '../../content/texts'
import { BALANCE } from '../../core/balance'
import { requiredWpm, wallStep } from '../../core/difficulty'
import { useGameStore } from '../../state/gameStore'
import type { Language } from '../../core/types'
import { TerminalButton } from '../components/TerminalButton'
import { TerminalFrame } from '../components/TerminalFrame'

const INTRO: Record<Language, readonly string[]> = {
  ru: [
    'ЗАГРУЗКА ЛОКАЛЬНОГО ТЕРМИНАЛА...',
    'СЕТЬ: НЕДОСТУПНА. ПОСЛЕДНИЙ ОТВЕТ 412 ДНЕЙ НАЗАД.',
    'ОПЕРАТОРОВ В СИСТЕМЕ: 1',
    '',
    'Они забрали сеть. Терминал остался тебе.',
    'Печатай быстро. Каждая ошибка стоит времени, которого нет.',
    'Между узлами есть склад. Снаряжение там стоит кредитов.',
  ],
  en: [
    'LOADING LOCAL TERMINAL...',
    'NETWORK: UNREACHABLE. LAST RESPONSE 412 DAYS AGO.',
    'OPERATORS ONLINE: 1',
    '',
    'They took the network. The terminal is still yours.',
    'Type fast. Every mistake costs time you do not have.',
    'Between nodes there is a depot. Gear there costs credits.',
  ],
}

const LABELS = {
  ru: {
    start: 'Начать забег',
    language: 'Язык',
    sound: 'Звук',
    on: 'вкл',
    off: 'выкл',
    nodes: 'узлов',
    speed: 'Твоя скорость',
    hint: 'Enter — начать',
    curveHead: 'Забег потребует от',
    curveMid: 'до',
    curveTail: 'слов в минуту. С узла',
    curveEnd: 'без предметов уже не обойтись.',
  },
  en: {
    start: 'Start a run',
    language: 'Language',
    sound: 'Sound',
    on: 'on',
    off: 'off',
    nodes: 'nodes',
    speed: 'Your speed',
    hint: 'Enter to start',
    curveHead: 'This run will demand from',
    curveMid: 'to',
    curveTail: 'words per minute. From node',
    curveEnd: 'onward you will need items.',
  },
} as const

export function MainMenu() {
  const language = useGameStore((state) => state.language)
  const soundEnabled = useGameStore((state) => state.soundEnabled)
  const setLanguage = useGameStore((state) => state.setLanguage)
  const toggleSound = useGameStore((state) => state.toggleSound)
  const beginRun = useGameStore((state) => state.beginRun)
  const baseWpm = useGameStore((state) => state.baseWpm)
  const setBaseWpm = useGameStore((state) => state.setBaseWpm)

  const labels = LABELS[language]
  const fromWpm = requiredWpm(baseWpm, 0, BALANCE.runLength)
  const toWpm = requiredWpm(baseWpm, BALANCE.runLength - 1, BALANCE.runLength)
  const wall = wallStep(BALANCE.runLength) + 1

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      sfx.unlock()
      if (event.key === 'Enter') beginRun()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [beginRun])

  return (
    <TerminalFrame title="signal // boot" right={`${TEXTS.length} ${labels.nodes}`}>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-10 overflow-y-auto px-6 py-8 sm:px-12">
        <div>
          <motion.h1
            className="glow text-5xl tracking-[0.35em] text-term-bright sm:text-7xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            SIGNAL
          </motion.h1>
          <p className="mt-2 text-sm tracking-[0.3em] text-term-dim uppercase">
            {language === 'ru' ? 'последний оператор' : 'the last operator'}
          </p>
        </div>

        <div className="space-y-1 text-sm sm:text-base">
          {INTRO[language].map((line, index) => (
            <motion.p
              key={line || `spacer-${index}`}
              className={line.startsWith('ЗАГРУЗКА') || line.startsWith('LOADING') || line === line.toUpperCase() ? 'text-term-muted' : 'text-term'}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.12, duration: 0.25 }}
            >
              {line ? (line === line.toUpperCase() ? line : `> ${line}`) : ' '}
            </motion.p>
          ))}
        </div>

        <motion.div
          className="flex flex-wrap items-center gap-x-8 gap-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <TerminalButton
            onClick={() => {
              sfx.unlock()
              beginRun()
            }}
          >
            {labels.start}
          </TerminalButton>

          <Setting label={labels.language}>
            <Choice active={language === 'ru'} onClick={() => setLanguage('ru')}>
              рус
            </Choice>
            <Choice active={language === 'en'} onClick={() => setLanguage('en')}>
              eng
            </Choice>
          </Setting>

          <Setting label={labels.speed}>
            {BALANCE.presets.map((wpm) => (
              <Choice key={wpm} active={baseWpm === wpm} onClick={() => setBaseWpm(wpm)}>
                {wpm}
              </Choice>
            ))}
          </Setting>

          <Setting label={labels.sound}>
            <Choice
              active={soundEnabled}
              onClick={() => {
                sfx.unlock()
                toggleSound()
              }}
            >
              {soundEnabled ? labels.on : labels.off}
            </Choice>
          </Setting>

          <span className="text-xs tracking-widest text-term-dim uppercase">{labels.hint}</span>
        </motion.div>

        <motion.p
          className="text-xs text-term-dim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05 }}
        >
          {labels.curveHead} <span className="text-term-amber">{fromWpm}</span>{' '}
          {labels.curveMid} <span className="text-term-amber">{toWpm}</span>{' '}
          {labels.curveTail} <span className="text-term-amber">{wall}</span>{' '}
          {labels.curveEnd}
        </motion.p>
      </div>
    </TerminalFrame>
  )
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-3 text-xs tracking-[0.2em] uppercase">
      <span className="text-term-muted">{label}</span>
      <span className="flex gap-2">{children}</span>
    </span>
  )
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border px-2 py-1 transition-colors ${
        active ? 'glow-soft border-term text-term' : 'border-term-line text-term-dim hover:text-term-muted'
      }`}
    >
      {children}
    </button>
  )
}
