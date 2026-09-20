/**
 * Базовые типы игры. Файл не импортирует ничего — он корень графа зависимостей.
 */

export type Language = 'ru' | 'en'

/**
 * Заявленная игроком скорость печати, слов в минуту. От неё пляшет вся
 * кривая забега: требуемая скорость задана долей от этого числа, а не
 * абсолютной величиной. Игрок называет её в меню, потому что «требуемая
 * скорость» имеет смысл только рядом с собственной.
 */
export type BaseWpm = number

/** Языковой вариант текста. Только содержание: заголовок и тело. */
export interface TextVariant {
  readonly title: string
  readonly body: string
}

/**
 * Фрагмент лора. Чисел здесь намеренно нет: таймер, цель и награда
 * вычисляются забегом из места узла в нём (см. core/difficulty.ts).
 * Благодаря этому новый текст добавляется без всякой настройки.
 */
export interface LevelText {
  readonly id: string
  /** Номер журнала. Задаёт порядок чтения лора, а не сложность. */
  readonly order: number
  readonly variants: Readonly<Record<Language, TextVariant>>
}

/**
 * Живое состояние предмета на уровне. Интерфейс читает только это:
 * когда предмет сработал и сколько осталось отката.
 */
export interface ItemStatus {
  readonly id: string
  /** Сколько миллисекунд отката осталось. 0 — предмет готов. */
  readonly cooldownLeftMs: number
  /** Длина последнего отката. Нужна, чтобы нарисовать полосу. */
  readonly cooldownTotalMs: number
  /** Сколько прошло с последнего срабатывания. Null — ещё ни разу. */
  readonly sinceFiredMs: number | null
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
  /** Идёт окно после ошибки: промахи сейчас ничего не стоят. */
  readonly safeWindow: boolean
  /** Игрок печатает не в той раскладке — показать подсказку. */
  readonly layoutMismatch: boolean
  readonly lossReason: LossReason | null
  /** Предметы игрока в порядке инвентаря: подсветка и откаты. */
  readonly items: readonly ItemStatus[]
  /** Скорость, которой требует этот узел. */
  readonly requiredWpm: number
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
  /** Скорость, которой требовал этот узел. */
  readonly requiredWpm: number
}
