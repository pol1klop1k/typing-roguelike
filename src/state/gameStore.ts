/**
 * Мост между ядром и интерфейсом.
 *
 * Здесь живёт только то, что нужно экранам: какой экран открыт, состояние
 * забега, текущий срез уровня. Правила игры целиком остаются в src/core.
 */
import { create } from 'zustand'
import { sfx } from '../audio/sfx'
import { findItem, ITEMS, modifiersFor } from '../content/items'
import { findText, TEXTS } from '../content/texts'
import { planLevel } from '../core/difficulty'
import { LevelSession, type KeyOutcome } from '../core/level'
import {
  buyItem,
  currentLevelId,
  dropItem,
  leaveShop,
  loseLevel,
  rerollOffers,
  startRun,
  winLevel,
  type RunState,
} from '../core/run'
import { BALANCE } from '../core/balance'
import type {
  BaseWpm,
  Language,
  LevelResult,
  LevelSnapshot,
  LevelText,
  TextVariant,
} from '../core/types'

export type Screen = 'menu' | 'level' | 'results' | 'shop'

interface GameState {
  screen: Screen
  language: Language
  soundEnabled: boolean
  /** Заявленная скорость печати. От неё зависит вся кривая забега. */
  baseWpm: BaseWpm
  run: RunState | null
  session: LevelSession | null
  snapshot: LevelSnapshot | null
  result: LevelResult | null

  setLanguage: (language: Language) => void
  setBaseWpm: (baseWpm: BaseWpm) => void
  toggleSound: () => void
  openMenu: () => void
  /** Новый забег с нуля: новая выборка узлов, пустой инвентарь. */
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
  /** Из магазина на следующий узел. */
  nextLevel: () => void
}

/** Текст текущего узла забега. */
export function activeText(state: GameState): LevelText | null {
  if (!state.run) return null
  const id = currentLevelId(state.run)
  return id ? (findText(id) ?? null) : null
}

/** Вариант текущего текста на выбранном языке. */
export function activeVariant(state: GameState): TextVariant | null {
  const text = activeText(state)
  return text ? text.variants[state.language] : null
}

function createSession(run: RunState, language: Language): LevelSession | null {
  const id = currentLevelId(run)
  const text = id ? findText(id) : undefined
  if (!text) return null

  const variant = text.variants[language]
  // Таймер, цель и награда считаются из места узла в забеге, а не берутся
  // из текста: один и тот же фрагмент на втором и на девятом узле требует
  // разного, и это ровно то, что делает забег забегом.
  const plan = planLevel(variant.body, run.baseWpm, run.levelIndex, run.totalLevels)

  return new LevelSession({
    text: variant.body,
    targetScore: plan.targetScore,
    durationMs: plan.durationMs,
    reward: plan.reward,
    requiredWpm: plan.requiredWpm,
    modifiers: modifiersFor(run.items),
  })
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  language: 'ru',
  soundEnabled: true,
  baseWpm: BALANCE.presets[1]!,
  run: null,
  session: null,
  snapshot: null,
  result: null,

  setLanguage: (language) => set({ language }),

  setBaseWpm: (baseWpm) => set({ baseWpm }),

  toggleSound: () => {
    const soundEnabled = !get().soundEnabled
    sfx.setEnabled(soundEnabled)
    set({ soundEnabled })
  },

  openMenu: () => set({ screen: 'menu', run: null, session: null, snapshot: null, result: null }),

  beginRun: () => {
    const run = startRun(Date.now(), get().baseWpm, TEXTS)
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
