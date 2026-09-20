import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../audio/sfx'
import { BALANCE } from '../../core/balance'
import { useGameStore } from '../../state/gameStore'
import { comboTier } from '../intensity'
import { LevelHud } from '../components/LevelHud'
import { ScorePopups, type ScorePopup } from '../components/ScorePopups'
import { TerminalFrame } from '../components/TerminalFrame'
import { TypingText } from '../components/TypingText'

const LABELS = {
  ru: {
    layout: 'Похоже, включена не та раскладка. Переключи язык ввода — эти нажатия не штрафуются.',
    abort: 'Esc — прервать',
    go: 'ПОШЁЛ',
    won: 'УЗЕЛ ВЗЛОМАН',
    lostTime: 'ВРЕМЯ ВЫШЛО',
    lostText: 'ТЕКСТ КОНЧИЛСЯ, ЦЕЛЬ НЕ ВЗЯТА',
  },
  en: {
    layout: 'Wrong keyboard layout. Switch your input language - these keystrokes are not penalized.',
    abort: 'Esc to abort',
    go: 'GO',
    won: 'NODE BREACHED',
    lostTime: 'OUT OF TIME',
    lostText: 'TEXT ENDED, TARGET NOT REACHED',
  },
} as const

export function LevelScreen() {
  const session = useGameStore((state) => state.session)
  const snapshot = useGameStore((state) => state.snapshot)
  const language = useGameStore((state) => state.language)
  const activeText = useGameStore((state) => state.activeText)

  const shake = useAnimationControls()
  const [popups, setPopups] = useState<readonly ScorePopup[]>([])
  const [flash, setFlash] = useState(false)
  const popupId = useRef(0)
  const textAreaRef = useRef<HTMLDivElement>(null)
  const lastCountdownBeep = useRef(-1)
  const lastLowTimeBeep = useRef(-1)

  const phase = snapshot?.phase
  const labels = LABELS[language]

  // Запуск отсчёта 3-2-1 при входе на уровень.
  useEffect(() => {
    if (!session) return
    useGameStore.getState().startSession(performance.now())
  }, [session])

  // Часы уровня. Останавливаются, как только уровень закончился.
  useEffect(() => {
    if (!session) return
    let frame = 0
    const loop = () => {
      const state = useGameStore.getState()
      const current = state.snapshot?.phase
      if (current === 'won' || current === 'lost') return
      state.tick(performance.now())
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [session])

  // Ввод.
  useEffect(() => {
    if (!session) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return

      if (event.key === 'Escape') {
        useGameStore.getState().openSelect()
        return
      }

      // Пробел листает страницу, кавычка открывает поиск в Firefox, Tab уводит фокус.
      if (event.key === ' ' || event.key === 'Tab' || event.key === "'" || event.key === '/') {
        event.preventDefault()
      }
      if (event.repeat) return

      const outcome = useGameStore.getState().pressKey(event.key, performance.now())

      if (outcome.kind === 'correct') {
        sfx.key()
        if (outcome.wordScored) {
          const scored = outcome.wordScored
          const id = popupId.current++
          const { x, y } = cursorPosition(textAreaRef.current)
          const combo = useGameStore.getState().snapshot?.combo ?? 0
          // Звук тот же, что и анимация: на предельном комбо вместо
          // одиночной ноты звучит аккорд под расходящуюся вспышку.
          if (comboTier(combo).epic) sfx.wordEpic(scored.mult)
          else sfx.word(scored.mult)
          setPopups((current) => [
            ...current,
            { id, gained: scored.gained, chips: scored.chips, mult: scored.mult, combo, x, y },
          ])
          window.setTimeout(() => {
            setPopups((current) => current.filter((popup) => popup.id !== id))
          }, 900)
        }
      } else if (outcome.kind === 'error') {
        sfx.error()
        setFlash(true)
        window.setTimeout(() => setFlash(false), 160)
        void shake.start({ x: [0, -10, 8, -6, 4, 0], transition: { duration: 0.26 } })
      } else if (outcome.kind === 'safe') {
        // Промах по инерции: обозначаем, но не пугаем. Ни вспышки, ни тряски.
        sfx.safeMiss()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [session, shake])

  // Пищалки отсчёта.
  useEffect(() => {
    if (phase !== 'countdown' || !snapshot) return
    const remaining = Math.ceil(snapshot.countdownLeftMs / 1000)
    if (remaining !== lastCountdownBeep.current) {
      lastCountdownBeep.current = remaining
      if (remaining > 0) sfx.countdown()
    }
  }, [phase, snapshot])

  // Тревожное тиканье в последние секунды.
  useEffect(() => {
    if (phase !== 'running' || !snapshot) return
    if (snapshot.timeLeftMs > BALANCE.lowTimeWarningMs) return
    const second = Math.ceil(snapshot.timeLeftMs / 1000)
    if (second !== lastLowTimeBeep.current) {
      lastLowTimeBeep.current = second
      sfx.lowTime()
    }
  }, [phase, snapshot])

  // Уровень закончился: фанфары и переход к результатам.
  useEffect(() => {
    if (phase !== 'won' && phase !== 'lost') return
    if (phase === 'won') sfx.win()
    else sfx.lose()
    const timer = window.setTimeout(() => useGameStore.getState().openResults(), 1500)
    return () => window.clearTimeout(timer)
  }, [phase])

  // Переход на уровень с пустым состоянием возможен только при ручной перезагрузке.
  useEffect(() => {
    if (!session) useGameStore.getState().openMenu()
  }, [session])

  if (!session || !snapshot || !activeText) return null

  const variant = activeText.variants[language]
  const countdownNumber = Math.ceil(snapshot.countdownLeftMs / 1000)

  return (
    <TerminalFrame title={variant.title} right={labels.abort}>
      <motion.div animate={shake} className="flex min-h-0 flex-1 flex-col">
        <LevelHud snapshot={snapshot} language={language} />

        <div
          ref={textAreaRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-6 pt-24 pb-8 sm:px-10"
        >
          <ScorePopups popups={popups} />

          <TypingText
            words={session.words}
            cursor={snapshot.cursor}
            hasError={snapshot.wrongKey !== null}
            safeWindow={snapshot.safeWindow}
          />

          <AnimatePresence>
            {snapshot.layoutMismatch ? (
              <motion.p
                className="mt-8 border border-term-amber px-4 py-2 text-sm text-term-amber"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {labels.layout}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {flash ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-40 bg-term-red/15"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'countdown' ? (
          <motion.div
            key={countdownNumber}
            className="glow pointer-events-none absolute inset-0 z-40 flex items-center justify-center text-8xl text-term-bright"
            initial={{ opacity: 0, scale: 1.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3 }}
          >
            {countdownNumber > 0 ? countdownNumber : labels.go}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'won' || phase === 'lost' ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-term-bg/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className={`glow text-3xl tracking-[0.3em] sm:text-5xl ${
                phase === 'won' ? 'text-term-bright' : 'text-term-red'
              }`}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              {phase === 'won'
                ? labels.won
                : snapshot.lossReason === 'time'
                  ? labels.lostTime
                  : labels.lostText}
            </motion.span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </TerminalFrame>
  )
}

/**
 * Позиция курсора внутри области текста.
 *
 * Читается синхронно в обработчике нажатия, то есть ещё до перерисовки —
 * поэтому возвращает символ, который игрок только что добил. Это ровно то
 * место, где в этот миг находится взгляд.
 */
function cursorPosition(container: HTMLDivElement | null): { x: number; y: number } {
  const cursor = container?.querySelector('[data-cursor]')
  if (!container || !cursor) return { x: 0, y: 0 }

  const charBox = cursor.getBoundingClientRect()
  const areaBox = container.getBoundingClientRect()
  return {
    x: charBox.left - areaBox.left + charBox.width / 2,
    y: charBox.top - areaBox.top + container.scrollTop,
  }
}
