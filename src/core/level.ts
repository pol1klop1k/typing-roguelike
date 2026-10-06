/**
 * Состояние одного уровня: ввод, счёт, таймер, победа и поражение.
 *
 * Класс намеренно ничего не знает про React, DOM и звук. Он принимает
 * "сейчас" снаружи (performance.now у интерфейса, обычные числа в тестах)
 * и возвращает описание того, что произошло. Решать, как это показать
 * и озвучить, — задача интерфейса.
 */
import { BALANCE } from './balance'
import { ModifierRuntime, type HookName, type HookPayload, type Modifier } from './effects'
import { createRng } from './rng'
import {
  computeAccuracy,
  computeCpm,
  computeWpm,
  levelPayout,
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
  /** База награды за узел. Надбавку за запас времени считает сам уровень. */
  readonly reward: number
  /** Скорость, которой требует узел. Ядро её только показывает. */
  readonly requiredWpm?: number
  /**
   * Сид случайности уровня. Забег обязан воспроизводиться, поэтому предметы
   * тянут случайность отсюда, а не из Math.random. Без сида уровень всё равно
   * детерминирован - просто одинаков от запуска к запуску.
   */
  readonly seed?: number | string
  /** Предметы игрока в порядке инвентаря. */
  readonly modifiers?: readonly Modifier[]
  /**
   * Босс узла. Отдельно от предметов по двум причинам: его статус не должен
   * попадать в панель предметов и сдвигать там индексы, а хуки его обязаны
   * идти ПОСЛЕ предметов - босс действует на то, что получилось у игрока.
   */
  readonly boss?: Modifier
}

/**
 * Ядро дописало слово само: какие символы и на сколько встали часы.
 *
 * Едет в исходе нажатия, а не в срезе: это одноразовое событие, его надо
 * показать один раз, а не держать в состоянии. Так же устроено слово,
 * превратившееся в очки.
 */
export interface AutofillEvent {
  /** Первый дописанный символ. */
  readonly from: number
  /** Индекс за последним дописанным символом. */
  readonly to: number
  /** На сколько реального времени встали часы уровня. */
  readonly freezeMs: number
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
  | {
      readonly kind: 'correct'
      readonly char: string
      readonly wordScored: WordScored | null
      readonly autofill: AutofillEvent | null
    }
  /**
   * Промах, который предмет превратил в верный символ. Игрок не потерял
   * ничего. Какой именно предмет сработал, интерфейс видит по статусам
   * в срезе уровня — отдельное поле здесь было бы вторым источником правды.
   */
  | {
      readonly kind: 'forgiven'
      readonly char: string
      readonly wordScored: WordScored | null
      readonly autofill: AutofillEvent | null
    }
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
  readonly requiredWpm: number

  private readonly runtime: ModifierRuntime
  /** Сколько первых слотов рантайма - предметы игрока. Остальное босс. */
  private readonly itemCount: number
  /**
   * Погашенные слова: индекс слова -> час уровня, до которого оно темно.
   *
   * Живёт в ядре, а не в памяти босса, по той же причине, по которой там живёт
   * откат предмета: срок обязан видеть интерфейс, а идти - по часам уровня.
   */
  private readonly blackouts = new Map<number, number>()

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

  /**
   * Замедление часов уровня. Объявляется предметами на старте.
   *
   * Внутри класса ВСЁ считается по часам уровня: таймер, откаты, окно после
   * ошибки, время слова. Реальное время остаётся только там, где меряется
   * сам игрок, то есть в скорости печати: замедление даёт больше секунд на
   * уровень, но не делает пальцы быстрее и не должно врать об этом в итогах.
   */
  private timeScale = 1
  /** Момент по реальным часам, с которого ход времени разошёлся с реальным. */
  private scaleSince: number | null = null

  private realNow = 0
  private realStartedAt = 0
  private realEndedAt: number | null = null

  /**
   * Остановка часов уровня.
   *
   * Храним момент по РЕАЛЬНЫМ часам и длину: пока остановка идёт, часы уровня
   * не двигаются вовсе, а значит по ним нельзя отмерить и её собственный
   * конец. Накопленное уходит в frozenTotalMs и вычитается из реального
   * времени при каждом переводе часов.
   */
  private freezeStartedAtReal: number | null = null
  private freezeMs = 0
  private frozenTotalMs = 0

  /** Что ядро дописало последним нажатием. Читается в исходе и сбрасывается. */
  private lastAutofill: AutofillEvent | null = null

  /** Начало текущего слова по часам уровня. null - слово ещё не начато. */
  private wordStartedAt: number | null = null

  constructor(config: LevelConfig) {
    this.text = config.text
    this.words = splitWords(config.text)
    this.targetScore = config.targetScore
    this.durationMs = config.durationMs
    this.reward = config.reward
    this.requiredWpm = config.requiredWpm ?? 0

    const items = config.modifiers ?? []
    this.itemCount = items.length
    this.runtime = new ModifierRuntime(
      config.boss ? [...items, config.boss] : items,
      createRng(config.seed ?? 0),
    )
  }

  /**
   * Переводит реальные часы в часы уровня.
   *
   * До старта отсчёта они совпадают: замедлять «три-два-один» незачем.
   * После - реальные миллисекунды делятся на масштаб, поэтому за двенадцать
   * реальных секунд таймер уровня теряет десять.
   */
  private levelTime(realNow: number): number {
    if (this.scaleSince === null) return realNow
    // Замороженные миллисекунды вычитаются ДО замедления: во время остановки
    // часы уровня не идут ни быстро, ни медленно - они стоят.
    const running = realNow - this.scaleSince - this.frozenMsAt(realNow)
    return this.scaleSince + running / this.timeScale
  }

  /**
   * Прогоняет хук и применяет то, что предметы вернули НЕ через свои поля:
   * пока это только подаренный счёт.
   *
   * Обёртка существует, чтобы правило жило в одном месте. Девять вызовов
   * хуков, каждый со своей проверкой победы, разошлись бы при первой же
   * правке, и подарок, добравший цель, где-нибудь остался бы незамеченным.
   */
  private runHook<K extends HookName>(hook: K, now: number, payload: HookPayload<K>) {
    const context = this.runtime.run(hook, now, payload)

    if (context.bonusScore > 0) {
      this.score += context.bonusScore
      if (this.score >= this.targetScore) this.finish('won', null)
    }

    for (const request of context.blackout) {
      if (request.durationMs <= 0) continue
      // Повторная заявка на то же слово продлевает гашение, а не копится:
      // двух разных сроков у одного слова быть не может.
      this.blackouts.set(request.wordIndex, now + request.durationMs)
    }

    return context
  }

  /** Запускает отсчёт 3-2-1. Таймер уровня пойдёт после него. */
  start(now: number): void {
    if (this.phase !== 'idle') return
    this.realNow = now
    this.now = now
    this.phase = 'countdown'
    this.countdownEndsAt = now + BALANCE.countdownMs
    // Стартовый множитель и ход часов - это данные, а не константы:
    // «Фальстарт» поднимает множитель, «Заморозка» растягивает время,
    // и ядру не приходится знать ни про то, ни про другое.
    const started = this.runHook('onLevelStart', now, {
      snapshot: this.snapshot,
      now,
      text: this.text,
      mult: this.mult,
      timeScale: this.timeScale,
    })
    this.mult = started.mult
    this.timeScale = started.timeScale > 0 ? started.timeScale : 1
  }

  /**
   * Сколько реального времени уже проглочено остановками к моменту realNow.
   * Текущая, ещё идущая остановка считается частично.
   */
  private frozenMsAt(realNow: number): number {
    if (this.freezeStartedAtReal === null) return this.frozenTotalMs
    const spent = Math.max(0, Math.min(this.freezeMs, realNow - this.freezeStartedAtReal))
    return this.frozenTotalMs + spent
  }

  /**
   * Закрывает остановку, если её время по реальным часам вышло.
   *
   * Вызывается на входе каждого публичного метода, до перевода часов: иначе
   * истёкшая остановка продолжала бы вычитаться как идущая.
   */
  private settleFreeze(realNow: number): void {
    if (this.freezeStartedAtReal === null) return
    if (realNow - this.freezeStartedAtReal < this.freezeMs) return

    this.frozenTotalMs += this.freezeMs
    this.freezeStartedAtReal = null
    this.freezeMs = 0
  }

  /** Часы уровня стоят прямо сейчас. */
  private get frozen(): boolean {
    return this.freezeStartedAtReal !== null
  }

  /** Останавливает часы уровня на realMs реального времени. */
  private freeze(realMs: number): void {
    if (realMs <= 0) return
    // Вторая заявка во время остановки продлевает её, а не заводит вторую:
    // двух одновременно идущих остановок быть не может.
    if (this.freezeStartedAtReal !== null) {
      this.freezeMs += realMs
      return
    }

    this.freezeStartedAtReal = this.realNow
    this.freezeMs = realMs
  }

  /** Продвигает часы. Вызывается каждый кадр и не считает ничего, кроме времени. */
  tick(now: number): void {
    this.realNow = now
    this.settleFreeze(now)
    this.now = this.levelTime(now)

    if (this.phase === 'countdown') {
      if (this.now < this.countdownEndsAt) return
      this.phase = 'running'
      this.startedAt = this.now
      this.realStartedAt = now
      this.deadlineAt = this.now + this.durationMs
      // С этого мгновения часы уровня отстают от реальных.
      this.scaleSince = now
    }

    if (this.phase !== 'running') return

    const context = this.runHook('onTick', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      deltaMs: this.now - this.startedAt,
      addTimeMs: 0,
    })
    if (context.addTimeMs !== 0) this.deadlineAt += context.addTimeMs

    // Истёкшие гашения убираются по часам уровня, здесь же, где идёт время.
    // Срез их только фильтрует: он читается из хуков по многу раз за кадр и
    // менять состояние не имеет права.
    for (const [wordIndex, until] of this.blackouts) {
      if (this.now >= until) this.blackouts.delete(wordIndex)
    }

    if (this.now >= this.deadlineAt) this.finish('lost', 'time')
  }

  /** Обрабатывает нажатие. `key` — это KeyboardEvent.key, то есть уже с учётом раскладки. */
  pressKey(key: string, now: number): KeyOutcome {
    this.realNow = now
    this.settleFreeze(now)
    this.now = this.levelTime(now)
    this.lastAutofill = null

    if (this.phase !== 'running') return { kind: 'ignored' }
    // Часы стоят, пока ядро печатает слово за игрока. Нажатия в это время
    // проглатываются без последствий - в этом и смысл остановки: залп по
    // инерции, из-за которого предмет сам себе устраивал ошибку, больше
    // никуда не попадает.
    if (this.frozen) return { kind: 'ignored' }
    if (!isTypableKey(key)) return { kind: 'ignored' }

    const expected = this.text[this.cursor]
    if (expected === undefined) return { kind: 'ignored' }

    // Что считается верным вводом, решают предметы: «Регистр» разрешает
    // писать заглавные строчными. Проверка стоит первой, потому что она
    // определяет само понятие ошибки.
    const check = this.runHook('onKeyCheck', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      key,
      expected,
      accepted: key === expected,
    })
    if (check.accepted) {
      const wordScored = this.acceptChar(expected, key)
      return { kind: 'correct', char: expected, wordScored, autofill: this.lastAutofill }
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
    //
    // Сравнение по часам УРОВНЯ, и это не придирка. Окно ставится в часах
    // уровня (rejectChar), а сравнивалось раньше с реальными: под
    // замедлением времени реальные часы уходят вперёд, и окно закрывалось,
    // не успев открыться. Остановка часов ломала его совсем.
    if (this.now < this.safeWindowUntil) {
      this.wrongKey = key
      return { kind: 'safe' }
    }

    // Паническое долбление по одной и той же неверной клавише
    // не должно съедать таймер пачкой штрафов.
    if (key === this.wrongKey) return { kind: 'ignored' }

    // Промах настоящий. Он пережил окно безопасности и защиту от долбления,
    // поэтому предмет вроде «Второго шанса» тратится только на него.
    const failure = this.runHook('onCharError', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      key,
      expected,
      forgiven: false,
    })

    if (failure.forgiven) {
      const wordScored = this.acceptChar(expected, key)
      return { kind: 'forgiven', char: expected, wordScored, autofill: this.lastAutofill }
    }

    return this.rejectChar(key)
  }

  /**
   * Засчитывает символ под курсором и возвращает слово, если оно закрылось.
   *
   * `char` — то, что стоит в тексте, `key` — то, что игрок нажал. Они
   * расходятся, когда нажатие простил предмет вроде «Регистра».
   *
   * `auto` означает, что символ поставил предмет, а не человек. Такой символ
   * даёт символы и двигает курсор, но НЕ идёт ни в комбо, ни в число верных
   * нажатий: по ним считаются скорость и точность в итогах, и приписывать
   * игроку работу предмета - значит врать ему о собственной скорости
   * (правило 4 в architecture.md).
   */
  private acceptChar(char: string, key: string, auto = false): WordScored | null {
    if (this.wordStartedAt === null) this.wordStartedAt = this.now

    const context = this.runHook('onCharCorrect', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      char,
      key,
      isDigit: char >= '0' && char <= '9',
      isUpperCase: char !== char.toLowerCase(),
      isPunctuation: PUNCTUATION.test(char),
      chips: BALANCE.chipsPerChar,
      auto,
      completeWord: false,
    })

    this.wordChips += context.chips
    this.cursor++

    if (!auto) {
      this.correctChars++
      this.combo++
      if (this.combo > this.maxCombo) this.maxCombo = this.combo
      this.wrongKey = null
      this.layoutStreak = 0
      this.layoutMismatch = false
      this.safeWindowUntil = 0
    }

    let wordScored: WordScored | null = null
    const word = this.words[this.wordIndex]
    if (word && this.cursor >= word.end) {
      wordScored = this.completeWord(word)
    } else if (word && context.completeWord) {
      wordScored = this.fillWord(word)
    }

    if (this.score >= this.targetScore) {
      this.finish('won', null)
    } else if (this.cursor >= this.text.length) {
      this.finish('lost', 'textExhausted')
    }

    return wordScored
  }

  /**
   * Дописывает остаток слова за игрока. Символы берутся из текста как есть,
   * то есть слово закрывается так, будто его напечатали идеально.
   *
   * Каждый символ идёт обычным путём, поэтому предметы, дающие символы за
   * знак, видят и его. Вложенная просьба дописать игнорируется сама собой:
   * предмет, который её выставляет, обязан молчать на auto-символах.
   */
  private fillWord(word: WordSegment): WordScored | null {
    let scored: WordScored | null = null
    const from = this.cursor

    while (this.cursor < word.end && this.phase === 'running') {
      const char = this.text[this.cursor]
      if (char === undefined) break
      scored = this.acceptChar(char, char, true) ?? scored
    }

    const filled = this.cursor - from
    if (filled > 0) {
      const freezeMs = Math.max(BALANCE.autofillMinMs, filled * BALANCE.autofillCharMs)
      this.freeze(freezeMs)
      // Инерция переживает и остановку: кто-то успеет нажать уже после неё.
      // Первый такой промах не стоит ничего - то же окно, что после ошибки.
      this.safeWindowUntil = this.now + BALANCE.errorSafeWindowMs
      this.lastAutofill = { from, to: this.cursor, freezeMs }
    }

    return scored
  }

  private completeWord(word: WordSegment): WordScored {
    const cleanWord = !this.errorInWord

    const calc = this.runHook('onScoreCalc', this.now, {
      snapshot: this.snapshot,
      now: this.now,
      word: word.text,
      cleanWord,
      wordElapsedMs: this.wordStartedAt === null ? 0 : this.now - this.wordStartedAt,
      chips: this.wordChips,
      mult: this.mult,
      wordMult: 1,
    })

    // Разовая надбавка умножается на общий множитель только здесь и дальше
    // не живёт: в onWordComplete уходит чистый mult, из которого и вырастет
    // множитель следующего слова.
    const effectiveMult = calc.mult * calc.wordMult
    const gained = scoreWord(calc.chips, effectiveMult)
    this.score += gained

    const after = this.runHook('onWordComplete', this.now, {
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
      // Интерфейс показывает тот множитель, который и дал эти очки,
      // то есть вместе с разовой надбавкой.
      mult: effectiveMult,
      gained,
    }

    this.wordChips = 0
    this.errorInWord = false
    this.wordIndex++
    this.wordStartedAt = null

    return scored
  }

  private rejectChar(key: string): KeyOutcome {
    this.errors++
    this.combo = 0
    this.mult = Math.max(BALANCE.multStart, this.mult - BALANCE.multLossOnError)
    this.errorInWord = true
    this.wrongKey = key
    this.safeWindowUntil = this.now + BALANCE.errorSafeWindowMs

    const context = this.runHook('onTimePenalty', this.now, {
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
    this.realEndedAt = this.realNow
    this.runtime.run('onLevelEnd', this.now, { snapshot: this.snapshot, now: this.now })
  }

  /**
   * Остаток на таймере по часам уровня. До старта - весь таймер, после конца
   * уровня - застывший остаток на момент конца.
   *
   * Отдельный геттер, потому что число читают двое: срез (его видит игрок) и
   * итог (по нему начисляется надбавка). Две копии этой арифметики разошлись
   * бы, и игрок получил бы не то, что было на экране.
   */
  private get timeLeftMs(): number {
    if (this.phase === 'running') return Math.max(0, this.deadlineAt - this.now)
    if (this.phase === 'won' || this.phase === 'lost') {
      return Math.max(0, this.deadlineAt - (this.endedAt ?? this.now))
    }
    return this.durationMs
  }

  get snapshot(): LevelSnapshot {
    const timeLeftMs = this.timeLeftMs
    const payout = levelPayout(this.reward, timeLeftMs)
    const statuses = this.runtime.statuses(this.now)

    const blackouts: number[] = []
    for (const [wordIndex, until] of this.blackouts) {
      if (this.now < until) blackouts.push(wordIndex)
    }

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
      wordIndex: this.wordIndex,
      wordCount: this.words.length,
      blackouts,
      timeLeftMs,
      totalTimeMs: this.durationMs,
      elapsedMs: this.realElapsedMs,
      rewardBase: payout.base,
      rewardTimeBonus: payout.timeBonus,
      countdownLeftMs:
        this.phase === 'countdown' ? Math.max(0, this.countdownEndsAt - this.now) : 0,
      wrongKey: this.wrongKey,
      safeWindow: this.phase === 'running' && this.now < this.safeWindowUntil,
      frozen: this.frozen,
      layoutMismatch: this.layoutMismatch,
      lossReason: this.lossReason,
      items: statuses.slice(0, this.itemCount),
      boss: statuses[this.itemCount] ?? null,
      requiredWpm: this.requiredWpm,
    }
  }

  /**
   * Сколько игрок печатал по РЕАЛЬНЫМ часам.
   *
   * Именно это число идёт в скорость и точность. Замедление времени даёт
   * больше секунд на уровень, но не делает пальцы быстрее, и подмешивать
   * его сюда значило бы врать игроку о его собственной скорости.
   */
  private get realElapsedMs(): number {
    if (this.realStartedAt === 0) return 0
    return (this.realEndedAt ?? this.realNow) - this.realStartedAt
  }

  get result(): LevelResult | null {
    if (this.phase !== 'won' && this.phase !== 'lost') return null
    const won = this.phase === 'won'
    const elapsedMs = this.realElapsedMs
    const timeLeftMs = this.timeLeftMs
    const payout = levelPayout(this.reward, timeLeftMs)

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
      timeLeftMs,
      // Поражение не платит ничего: ни базы, ни надбавки, даже если таймер
      // остановился на середине из-за кончившегося текста.
      reward: won ? payout.total : 0,
      rewardBase: won ? payout.base : 0,
      rewardTimeBonus: won ? payout.timeBonus : 0,
      requiredWpm: this.requiredWpm,
    }
  }
}
