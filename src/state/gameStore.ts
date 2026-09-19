/**
 * Мост между ядром и интерфейсом.
 *
 * Здесь живёт только то, что нужно экранам: какой экран открыт, какой текст
 * выбран, текущий срез уровня. Правила игры целиком остаются в src/core.
 */
import { create } from 'zustand'
import { sfx } from '../audio/sfx'
import { ACTIVE_MODIFIERS } from '../content/modifiers'
import { findText, TEXTS } from '../content/texts'
import { LevelSession, type KeyOutcome } from '../core/level'
import type { Language, LevelResult, LevelSnapshot, LevelText, TextVariant } from '../core/types'

export type Screen = 'menu' | 'select' | 'level' | 'results'

interface GameState {
  screen: Screen
  language: Language
  soundEnabled: boolean
  /** Заглушка под будущий магазин: кредиты копятся, тратить их пока некуда. */
  credits: number
  texts: readonly LevelText[]
  activeText: LevelText | null
  session: LevelSession | null
  snapshot: LevelSnapshot | null
  result: LevelResult | null

  setLanguage: (language: Language) => void
  toggleSound: () => void
  openMenu: () => void
  openSelect: () => void
  selectText: (id: string) => void
  startSession: (now: number) => void
  tick: (now: number) => void
  pressKey: (key: string, now: number) => KeyOutcome
  openResults: () => void
  retry: () => void
}

/** Вариант выбранного текста на текущем языке. */
export function activeVariant(state: GameState): TextVariant | null {
  if (!state.activeText) return null
  return state.activeText.variants[state.language]
}

function createSession(text: LevelText, language: Language): LevelSession {
  const variant = text.variants[language]
  return new LevelSession({
    text: variant.body,
    targetScore: variant.targetScore,
    durationMs: variant.durationMs,
    reward: text.reward,
    modifiers: ACTIVE_MODIFIERS,
  })
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  language: 'ru',
  soundEnabled: true,
  credits: 0,
  texts: TEXTS,
  activeText: null,
  session: null,
  snapshot: null,
  result: null,

  setLanguage: (language) => set({ language }),

  toggleSound: () => {
    const soundEnabled = !get().soundEnabled
    sfx.setEnabled(soundEnabled)
    set({ soundEnabled })
  },

  openMenu: () => set({ screen: 'menu', session: null, snapshot: null, result: null, activeText: null }),

  openSelect: () => set({ screen: 'select', session: null, snapshot: null, result: null }),

  selectText: (id) => {
    const text = findText(id)
    if (!text) return
    const session = createSession(text, get().language)
    set({ screen: 'level', activeText: text, session, snapshot: session.snapshot, result: null })
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
    const { screen, session } = get()
    // Защита от повторного начисления: награда выдаётся ровно один раз.
    if (screen !== 'level' || !session) return
    const result = session.result
    if (!result) return
    set((state) => ({ screen: 'results', result, credits: state.credits + result.reward }))
  },

  retry: () => {
    const { activeText, language } = get()
    if (!activeText) return
    const session = createSession(activeText, language)
    set({ screen: 'level', session, snapshot: session.snapshot, result: null })
  },
}))
