/**
 * Мост между ядром и интерфейсом.
 *
 * Здесь живёт только то, что нужно экранам: какой экран открыт, состояние
 * забега, текущий срез уровня. Правила игры целиком остаются в src/core.
 */
import { create } from 'zustand'
import { sfx } from '../audio/sfx'
import { findItem, ITEMS, modifiersFor } from '../content/items'
import { TEXTS } from '../content/texts'
import { LevelSession, type KeyOutcome } from '../core/level'
import {
  buyItem,
  dropItem,
  leaveShop,
  loseLevel,
  rerollOffers,
  startRun,
  winLevel,
  type RunState,
} from '../core/run'
import type { Language, LevelResult, LevelSnapshot, LevelText, TextVariant } from '../core/types'

export type Screen = 'menu' | 'level' | 'results' | 'shop'

interface GameState {
  screen: Screen
  language: Language
  soundEnabled: boolean
  run: RunState | null
  session: LevelSession | null
  snapshot: LevelSnapshot | null
  result: LevelResult | null

  setLanguage: (language: Language) => void
  toggleSound: () => void
  openMenu: () => void
  /** Новый забег с нуля: кредиты и предметы обнуляются. */
  beginRun: () => void
  startSession: (now: number) => void
  tick: (now: number) => void
  pressKey: (key: string, now: number) => KeyOutcome
  /** Уровень закончился: итог применяется к забегу ровно один раз. */
  openResults: () => void
  /** С экрана итогов: в магазин, на финальный экран или в меню. */
  continueRun: () => void
  buy: (itemId: string) => void
  drop: (index: number) => void
  reroll: () => void
  /** Из магазина на следующий уровень. */
  nextLevel: () => void
}

/** Текст текущего уровня забега. */
export function activeText(state: GameState): LevelText | null {
  if (!state.run) return null
  return TEXTS[state.run.levelIndex] ?? null
}

/** Вариант текущего текста на выбранном языке. */
export function activeVariant(state: GameState): TextVariant | null {
  const text = activeText(state)
  return text ? text.variants[state.language] : null
}

function createSession(run: RunState, language: Language): LevelSession | null {
  const text = TEXTS[run.levelIndex]
  if (!text) return null
  const variant = text.variants[language]

  return new LevelSession({
    text: variant.body,
    targetScore: variant.targetScore,
    durationMs: variant.durationMs,
    reward: text.reward,
    modifiers: modifiersFor(run.items),
  })
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  language: 'ru',
  soundEnabled: true,
  run: null,
  session: null,
  snapshot: null,
  result: null,

  setLanguage: (language) => set({ language }),

  toggleSound: () => {
    const soundEnabled = !get().soundEnabled
    sfx.setEnabled(soundEnabled)
    set({ soundEnabled })
  },

  openMenu: () => set({ screen: 'menu', run: null, session: null, snapshot: null, result: null }),

  beginRun: () => {
    const run = startRun(Date.now(), TEXTS.length)
    const session = createSession(run, get().language)
    if (!session) return
    set({ screen: 'level', run, session, snapshot: session.snapshot, result: null })
  },

  startSession: (now) => {
    const { session } = get()
    if (!session) return
    session.start(now)
    set({ snapshot: session.snapshot })
  },

  tick: (now) => {
    const { session } = get()
    if (!session) return
    session.tick(now)
    set({ snapshot: session.snapshot, result: session.result })
  },

  pressKey: (key, now) => {
    const { session } = get()
    if (!session) return { kind: 'ignored' }
    const outcome = session.pressKey(key, now)
    if (outcome.kind !== 'ignored') set({ snapshot: session.snapshot, result: session.result })
    return outcome
  },

  openResults: () => {
    const { screen, session, run } = get()
    // Защита от повторного начисления: итог применяется ровно один раз.
    if (screen !== 'level' || !session || !run) return
    const result = session.result
    if (!result) return

    set({
      screen: 'results',
      result,
      run: result.won ? winLevel(run, result.reward, ITEMS) : loseLevel(run),
    })
  },

  continueRun: () => {
    const { run } = get()
    if (!run) return
    if (run.phase === 'shop') set({ screen: 'shop' })
    else get().openMenu()
  },

  buy: (itemId) => {
    const { run } = get()
    const item = findItem(itemId)
    if (!run || !item) return
    set({ run: buyItem(run, item) })
  },

  drop: (index) => {
    const { run } = get()
    if (!run) return
    set({ run: dropItem(run, index) })
  },

  reroll: () => {
    const { run } = get()
    if (!run) return
    set({ run: rerollOffers(run, ITEMS) })
  },

  nextLevel: () => {
    const { run, language } = get()
    if (!run) return
    const next = leaveShop(run)
    const session = createSession(next, language)
    if (!session) return
    set({ screen: 'level', run: next, session, snapshot: session.snapshot, result: null })
  },
}))
