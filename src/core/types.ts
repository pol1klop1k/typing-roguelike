/**
 * Базовые типы игры. Файл не импортирует ничего — он корень графа зависимостей.
 */

export type Language = 'ru' | 'en'

/**
 * Каким было срабатывание предмета для игрока.
 *
 * Двусторонние предметы могут сработать во вред: «Гильотина» на медленном
 * слове не прибавляет множитель, а режет его. Игрок обязан различать эти
 * два случая мгновенно, поэтому тон объявляет сам предмет, а интерфейс
 * только красит вспышку.
 */
export type FireTone = 'plain' | 'harm'

/**
 * Редкость предмета. Ядро знает только идентификатор: название и цвет —
 * текст для игрока, они живут в content и ui.
 *
 * Лестница построена не на «ценности», а на том, насколько вещь известна
 * сети. Мир весь пересчитан и занесён в ведомости, поэтому сила предмета
 * ровно в том, какого учёта он избежал. Серийное сеть выпускает сама,
 * неучтённого у неё в списках нет вовсе — как нет и самого игрока.
 *
 * serial     - серийное, работает ровно и скучно;
 * offspec    - нештатное, меняет одно правило ввода;
 * prototype  - опытное, даёт механику, которой в игре больше нет;
 * classified - закрытое, сильное и с ценой;
 * unlogged   - неучтённое, перестраивает уровень целиком.
 */
export type Rarity = 'serial' | 'offspec' | 'prototype' | 'classified' | 'unlogged'

/** Все редкости от самой частой к самой редкой. Порядок значим для интерфейса. */
export const RARITY_ORDER: readonly Rarity[] = [
  'serial',
  'offspec',
  'prototype',
  'classified',
  'unlogged',
]

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
  /**
   * Слот линии: он же номер журнала. Задаёт место в истории, а не сложность.
   *
   * У одного слота несколько текстов, и забег берёт из каждого слота ровно
   * один. Поэтому история всегда идёт по порядку и всегда одной формы, но в
   * каждом прохождении читается другими словами. Тексты одного слота обязаны
   * рассказывать об одном и том же событии линии: подменять событие нельзя,
   * иначе соседние узлы перестанут сходиться.
   */
  readonly slot: number
  readonly variants: Readonly<Record<Language, TextVariant>>
}

/**
 * Живое состояние предмета на уровне. Интерфейс читает только это:
 * когда предмет сработал и сколько осталось отката.
 */
export interface ItemStatus {
  readonly id: string
  /**
   * Копия памяти предмета на уровне.
   *
   * Нужна предметам, у которых есть своё состояние на экране: лотерея должна
   * показать пять своих символов и то, какие уже зачтены. Что именно значат
   * числа, знает только сам предмет, поэтому рисует их не панель, а значок,
   * объявленный рядом с предметом в content/items.ts.
   */
  readonly memory: Readonly<Record<string, number>>
  /** Сколько миллисекунд отката осталось. 0 — предмет готов. */
  readonly cooldownLeftMs: number
  /** Длина последнего отката. Нужна, чтобы нарисовать полосу. */
  readonly cooldownTotalMs: number
  /** Сколько прошло с последнего срабатывания. Null — ещё ни разу. */
  readonly sinceFiredMs: number | null
  /**
   * Каким было последнее срабатывание. 'harm' означает, что предмет
   * сработал во вред игроку, и вспышка должна быть красной.
   */
  readonly tone: FireTone
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
  /**
   * Сколько кредитов даст узел, если взять его СЕЙЧАС. Надбавка тает вместе
   * с таймером, и игрок обязан видеть это во время печати: иначе он узнаёт
   * о существовании надбавки только на экране итогов, когда изменить уже
   * ничего нельзя.
   */
  readonly rewardBase: number
  readonly rewardTimeBonus: number
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
  /** Сколько времени осталось на таймере в момент победы, по часам уровня. */
  readonly timeLeftMs: number
  /** Всего начислено кредитов. За поражение - ноль, вместе со слагаемыми. */
  readonly reward: number
  readonly rewardBase: number
  readonly rewardTimeBonus: number
  /** Скорость, которой требовал этот узел. */
  readonly requiredWpm: number
}
