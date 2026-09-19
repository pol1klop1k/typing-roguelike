/**
 * Базовые типы игры. Файл не импортирует ничего — он корень графа зависимостей.
 */

export type Language = 'ru' | 'en'

export type Difficulty = 'easy' | 'normal' | 'hard'

/** Языковой вариант текста. Длина и цель задаются отдельно для каждого языка,
 *  потому что один и тот же фрагмент лора на русском и английском печатается
 *  за разное время. */
export interface TextVariant {
  readonly title: string
  readonly body: string
  readonly durationMs: number
  readonly targetScore: number
}

/** Уровень в виде данных. Это всё, что ядру нужно знать о тексте. */
export interface LevelText {
  readonly id: string
  readonly difficulty: Difficulty
  /** Награда в кредитах за прохождение. Пока заглушка под будущий магазин. */
  readonly reward: number
  readonly variants: Readonly<Record<Language, TextVariant>>
}

export type LevelPhase = 'idle' | 'countdown' | 'running' | 'won' | 'lost'

export type LossReason = 'time' | 'textExhausted'

/** Неизменяемый срез состояния уровня. Интерфейс читает только его. */
export interface LevelSnapshot {
  readonly phase: LevelPhase
  /** Индекс символа, который игрок должен нажать следующим. */
  readonly cursor: number
  readonly score: number
  readonly targetScore: number
  readonly mult: number
  /** Символы, накопленные в текущем, ещё не завершённом слове. */
  readonly wordChips: number
  readonly errors: number
  readonly combo: number
  readonly maxCombo: number
  readonly correctChars: number
  readonly timeLeftMs: number
  readonly totalTimeMs: number
  readonly elapsedMs: number
  /** Мс до конца отсчёта 3-2-1, если идёт отсчёт. */
  readonly countdownLeftMs: number
  /** Последняя неверно нажатая клавиша — для подсветки. */
  readonly wrongKey: string | null
  /** Игрок печатает не в той раскладке — показать подсказку. */
  readonly layoutMismatch: boolean
  readonly lossReason: LossReason | null
}

/** Итог уровня для экрана результатов. */
export interface LevelResult {
  readonly won: boolean
  readonly lossReason: LossReason | null
  readonly score: number
  readonly targetScore: number
  readonly errors: number
  readonly maxCombo: number
  readonly correctChars: number
  readonly elapsedMs: number
  /** Знаков в минуту. */
  readonly cpm: number
  /** Слов в минуту по стандарту «5 знаков = слово». */
  readonly wpm: number
  /** Точность в процентах, 0..100. */
  readonly accuracy: number
  readonly reward: number
}
