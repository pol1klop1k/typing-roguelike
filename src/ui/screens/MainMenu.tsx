import { motion } from 'motion/react'
import { useEffect } from 'react'
import { sfx } from '../../audio/sfx'
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
  ],
  en: [
    'LOADING LOCAL TERMINAL...',
    'NETWORK: UNREACHABLE. LAST RESPONSE 412 DAYS AGO.',
    'OPERATORS ONLINE: 1',
    '',
    'They took the network. The terminal is still yours.',
    'Type fast. Every mistake costs time you do not have.',
  ],
}

const LABELS = {
  ru: { start: 'Начать', language: 'Язык', sound: 'Звук', on: 'вкл', off: 'выкл', credits: 'Кредиты', hint: 'Enter — начать' },
  en: { start: 'Start', language: 'Language', sound: 'Sound', on: 'on', off: 'off', credits: 'Credits', hint: 'Enter to start' },
} as const

export function MainMenu() {
  const language = useGameStore((state) => state.language)
  const soundEnabled = useGameStore((state) => state.soundEnabled)
  const credits = useGameStore((state) => state.credits)
  const setLanguage = useGameStore((state) => state.setLanguage)
  const toggleSound = useGameStore((state) => state.toggleSound)
  const openSelect = useGameStore((state) => state.openSelect)

  const labels = LABELS[language]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      sfx.unlock()
      if (event.key === 'Enter') openSelect()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openSelect])

  return (
    <TerminalFrame title="signal // boot" right={`${labels.credits}: ${credits}`}>
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
              openSelect()
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
