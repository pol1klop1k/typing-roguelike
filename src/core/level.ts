/**
 * Состояние одного уровня: ввод, счёт, таймер, победа и поражение.
 *
 * Класс намеренно ничего не знает про React, DOM и звук. Он принимает
 * "сейчас" снаружи (performance.now у интерфейса, обычные числа в тестах)
 * и возвращает описание того, что произошло. Решать, как это показать
 * и озвучить, — задача интерфейса.
 */
import { BALANCE } from './balance'
import { ModifierRuntime, type Modifier } from './effects'
import {
  computeAccuracy,
  computeCpm,
  computeWpm,
  nextMult,
  scoreWord,
  timePenaltyMs,
} from './scoring'
import {
  isLayoutMismatch,
  isTypableKey,
  splitWords,
  type WordSegment,
} from './typing'
import type { LevelResult, LevelSnapshot, LossReason } from './types'

export interface LevelConfig {
  readonly text: string
  readonly targetScore: number
  readonly durationMs: number
  readonly reward: number
  /** Предметы, эффекты босса и модификаторы уровня. В прототипе пусто. */
  readonly modifiers?: readonly Modifier[]
}

/** Слово превратилось в очки — интерфейсу есть что анимировать. */
export interface WordScored {
  readonly word: string
  readonly wordIndex: number
  readonly chips: number
  readonly mult: number
  readonly gained: number
}

export type KeyOutcome =
  | { readonly kind: 'ignored' }
  | { readonly kind: 'correct'; readonly char: string; readonly wordScored: WordScored | null }
  /**
   * Промах, который предмет превратил в верный символ. Игрок не потерял
   * ничего. Какой именно предмет сработал, интерфейс видит по статусам
   * в срезе уровня — отдельное поле здесь было бы вторым источником правды.
   */
  | { readonly kind: 'forgiven'; readonly char: string; readonly wordScored: WordScored | null }
  | { readonly kind: 'error'; readonly penaltyMs: number }
  /** Промах внутри окна после ошибки: помечен, но ничего не стоил. */
  | { readonly kind: 'safe' }
  /** Нажата буква чужого алфавита — это не ошибка игрока, а не та раскладка. */
  | { readonly kind: 'layout' }

const PUNCTUATION = /[^\p{L}\p{N}\s]/u

export class LevelSession {
  readonly text: string
  readonly words: readonly WordSegment[]
  readonly targetScore: number
  readonly durationMs: number
  readonly reward: number

  private readonly runtime: ModifierRuntime

  private phase: LevelSnapshot['phase'] = 'idle'
  private cursor = 0
  private score = 0
  private mult: number = BALANCE.multStart
  private wordChips = 0
  private wordIndex = 0
  private errorInWord = false
  private errors = 0
  private combo = 0
  private maxCombo = 0
  private correctChars = 0
  private wrongKey: string | null = null
  private layoutStreak = 0
  private safeWindowUntil = 0
  private layoutMismatch = false
  private lossReason: LossReason | null = null

  private now = 0
  private countdownEndsAt = 0
  private startedAt = 0
  private deadlineAt = 0
  private endedAt: number | null = null

  constructor(config: LevelConfig) {
    this.text = config.text
    this.words = splitWords(config.text)
    this.targetScore = config.targetScore
    this.durationMs = config.durationMs
    this.reward = config.reward
    this.runtime = new ModifierRuntime(config.modifiers ?? [])
  }

  /** Запускает отсчёт 3-2-1. Таймер уровня пойдёт после него. */
  start(now: number): void {
    if (this.phase !== 'idle') return
    this.now = now
    this.phase = 'countdown'
    this.countdownEndsAt = now + BALANCE.countdownMs
    // Стартовый множитель - это данные, а не константа: предмет вроде
    // «Фальстарта» поднимает его, не трогая ядро.
    this.mult = this.runtime.run('onLevelStart', now, {
      snapshot: this.snapshot,
      now,
      mult: this.mult,
    }).mult
  }

  /** Продвигает часы. Вызывается каждый кадр и не считает ничего, кроме времени. */
  tick(now: number): void {
    this.now = now

    if (this.phase === 'countdown') {
      if (now < this.countdownEndsAt) return
      this.phase = 'running'
      this.startedAt = now
      this.deadlineAt = now + this.durationMs
    }

    if (this.phase !== 'running') return

    const context = this.runtime.run('onTick', now, {
      snapshot: this.snapshot,
      now,
      deltaMs: now - this.startedAt,
      addTimeMs: 0,
    })
    if (context.addTimeMs !== 0) this.deadlineAt += context.addTimeMs

    if (now >= this.deadlineAt) this.finish('lost', 'time')
  }

  /** Обрабатывает нажатие. `key` — это KeyboardEvent.key, то есть уже с учётом раскладки. */
  pressKey(key: string, now: number): KeyOutcome {
    this.now = now
    if (this.phase !== 'running') return { kind: 'ignored' }
    if (!isTypableKey(key)) return { kind: 'ignored' }

    const expected = this.text[this.cursor]
    if (expected === undefined) return { kind: 'ignored' }

    // Что считается верным вводом, решают предметы: «Регистр» разрешает
    // писать заглавные строчными. Проверка стоит первой, потому что она
    // определяет само понятие ошибки.
    const check = this.runtime.run('onKeyCheck', now, {
      snapshot: this.snapshot,
      now,
      key,
      expected,
      accepted: key === expected,
    })
    if (check.accepted) {
      const wordScored = this.acceptChar(expected)
      return { kind: 'correct', char: expected, wordScored }
    }

    // Буква чужого алфавита почти наверняка значит не ту раскладку, а не ошибку.
    // Штрафовать за это — значит убивать человека, который даже не понял, что происходит.
    if (isLayoutMismatch(expected, key)) {
      this.layoutStreak++
      if (this.layoutStreak >= BALANCE.layoutMismatchStreak) this.layoutMismatch = true
      return { kind: 'layout' }
    }

    // Инерция: осознав промах, человек успевает добить ещё символ-другой
    // по привычке. Эти нажатия помечаются, но не стоят ничего.
    if (now < this.safeWindowUntil) {
      this.wrongKey = key
      return { kind: 'safe' }
    }

    // Паническое долбление по одной и той же неверной клавише
    // не должно съедать таймер пачкой штрафов.
    if (key === this.wrongKey) return { kind: 'ignored' }

    // Промах настоящий. Он пережил окно безопасности и защиту от долбления,
    // поэтому предмет вроде «Второго шанса» тратится только на него.
    const failure = this.runtime.run('onCharError', now, {
      snapshot: this.snapshot,
      now,
      key,
      expected,
      forgiven: false,
    })

    if (failure.forgiven) {
      const wordScored = this.acceptChar(expected)
      return { kind: 'forgiven', char: expected, wordScored }
    }

    return this.rejectChar(key)
  }

  /** Засчитывает символ под курсором и возвращает слово, если оно закрылось. */
  private acceptChar(char: string): WordScored | null {
    const context = this.runtime.run('onCharCorrect', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      char,
      isDigit: char >= '0' && char <= '9',
      isUpperCase: char !== char.toLowerCase(),
      isPunctuation: PUNCTUATION.test(char),
      chips: BALANCE.chipsPerChar,
    })

    this.wordChips += context.chips
    this.cursor++
    this.correctChars++
    this.combo++
    if (this.combo > this.maxCombo) this.maxCombo = this.combo
    this.wrongKey = null
    this.layoutStreak = 0
    this.layoutMismatch = false
    this.safeWindowUntil = 0

    let wordScored: WordScored | null = null
    const word = this.words[this.wordIndex]
    if (word && this.cursor >= word.end) wordScored = this.completeWord(word)

    if (this.score >= this.targetScore) {
      this.finish('won', null)
    } else if (this.cursor >= this.text.length) {
      this.finish('lost', 'textExhausted')
    }

    return wordScored
  }

  private completeWord(word: WordSegment): WordScored {
    const cleanWord = !this.errorInWord

    const calc = this.runtime.run('onScoreCalc', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      word: word.text,
      cleanWord,
      chips: this.wordChips,
      mult: this.mult,
    })

    const gained = scoreWord(calc.chips, calc.mult)
    this.score += gained

    const after = this.runtime.run('onWordComplete', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      word: word.text,
      cleanWord,
      gained,
      mult: calc.mult,
    })

    this.mult = nextMult(after.mult, cleanWord)

    const scored: WordScored = {
      word: word.text,
      wordIndex: this.wordIndex,
      chips: calc.chips,
      mult: calc.mult,
      gained,
    }

    this.wordChips = 0
    this.errorInWord = false
    this.wordIndex++

    return scored
  }

  private rejectChar(key: string): KeyOutcome {
    this.errors++
    this.combo = 0
    this.mult = Math.max(BALANCE.multStart, this.mult - BALANCE.multLossOnError)
    this.errorInWord = true
    this.wrongKey = key
    this.safeWindowUntil = this.now + BALANCE.errorSafeWindowMs

    const context = this.runtime.run('onTimePenalty', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      errorIndex: this.errors,
      penaltyMs: timePenaltyMs(this.errors),
    })

    this.deadlineAt -= context.penaltyMs
    if (this.now >= this.deadlineAt) this.finish('lost', 'time')

    return { kind: 'error', penaltyMs: context.penaltyMs }
  }

  private finish(phase: 'won' | 'lost', reason: LossReason | null): void {
    if (this.phase === 'won' || this.phase === 'lost') return
    this.phase = phase
    this.lossReason = reason
    this.endedAt = this.now
    this.runtime.run('onLevelEnd', this.now, { snapshot: this.snapshot, now: this.now })
  }

  get snapshot(): LevelSnapshot {
    const finished = this.phase === 'won' || this.phase === 'lost'

    let timeLeftMs = this.durationMs
    if (this.phase === 'running') {
      timeLeftMs = Math.max(0, this.deadlineAt - this.now)
    } else if (finished) {
      timeLeftMs = Math.max(0, this.deadlineAt - (this.endedAt ?? this.now))
    }

    const elapsedMs = this.startedAt === 0 ? 0 : (this.endedAt ?? this.now) - this.startedAt

    return {
      phase: this.phase,
      cursor: this.cursor,
      score: this.score,
      targetScore: this.targetScore,
      mult: this.mult,
      wordChips: this.wordChips,
      errors: this.errors,
      combo: this.combo,
      maxCombo: this.maxCombo,
      correctChars: this.correctChars,
      timeLeftMs,
      totalTimeMs: this.durationMs,
      elapsedMs,
      countdownLeftMs:
        this.phase === 'countdown' ? Math.max(0, this.countdownEndsAt - this.now) : 0,
      wrongKey: this.wrongKey,
      safeWindow: this.phase === 'running' && this.now < this.safeWindowUntil,
      layoutMismatch: this.layoutMismatch,
      lossReason: this.lossReason,
      items: this.runtime.statuses(this.now),
    }
  }

  get result(): LevelResult | null {
    if (this.phase !== 'won' && this.phase !== 'lost') return null
    const won = this.phase === 'won'
    const elapsedMs = (this.endedAt ?? this.now) - this.startedAt

    return {
      won,
      lossReason: this.lossReason,
      score: this.score,
      targetScore: this.targetScore,
      errors: this.errors,
      maxCombo: this.maxCombo,
      correctChars: this.correctChars,
      elapsedMs,
      cpm: computeCpm(this.correctChars, elapsedMs),
      wpm: computeWpm(this.correctChars, elapsedMs),
      accuracy: computeAccuracy(this.correctChars, this.errors),
      reward: won ? this.reward : 0,
    }
  }
}
