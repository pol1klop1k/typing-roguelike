/**
 * Система эффектов — точка роста всей игры.
 *
 * Ядро в ключевых моментах уровня вызывает хук и передаёт в него изменяемый
 * контекст. Предметы, боссы и модификаторы уровней подписываются на хуки и
 * правят контекст. Благодаря этому новая механика добавляется как ДАННЫЕ
 * в src/content, а не как новый if внутри ядра.
 *
 * Если для новой механики захотелось поправить level.ts или scoring.ts —
 * значит, не хватает хука. Добавлять надо хук.
 */
import type { LevelSnapshot } from './types'

export type HookName =
  | 'onLevelStart'
  | 'onCharCorrect'
  | 'onCharError'
  | 'onScoreCalc'
  | 'onWordComplete'
  | 'onTimePenalty'
  | 'onTick'
  | 'onLevelEnd'

interface BaseContext {
  readonly snapshot: LevelSnapshot
}

/** Верно напечатан символ. Можно изменить, сколько символов он принёс. */
export interface CharCorrectContext extends BaseContext {
  readonly char: string
  readonly isDigit: boolean
  readonly isUpperCase: boolean
  readonly isPunctuation: boolean
  chips: number
}

/** Слово вот-вот превратится в очки. Главная точка вмешательства. */
export interface ScoreCalcContext extends BaseContext {
  readonly word: string
  readonly cleanWord: boolean
  chips: number
  mult: number
}

/** Слово уже засчитано. Здесь удобно раздавать множитель. */
export interface WordCompleteContext extends BaseContext {
  readonly word: string
  readonly cleanWord: boolean
  readonly gained: number
  mult: number
}

/** Ошибка вот-вот отнимет время. Можно смягчить или усилить штраф. */
export interface TimePenaltyContext extends BaseContext {
  readonly errorIndex: number
  penaltyMs: number
}

/** Кадр таймера. Позволяет механикам, живущим по часам, добавлять время. */
export interface TickContext extends BaseContext {
  readonly deltaMs: number
  addTimeMs: number
}

export interface HookContexts {
  onLevelStart: BaseContext
  onCharCorrect: CharCorrectContext
  onCharError: BaseContext
  onScoreCalc: ScoreCalcContext
  onWordComplete: WordCompleteContext
  onTimePenalty: TimePenaltyContext
  onTick: TickContext
  onLevelEnd: BaseContext
}

/**
 * Предмет, босс или модификатор уровня. Всё это одна и та же структура —
 * различается только тем, откуда она попадает в список активных.
 */
export interface Modifier {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly hooks: {
    readonly [K in HookName]?: (ctx: HookContexts[K]) => void
  }
}

/**
 * Прогоняет контекст через все активные модификаторы по порядку.
 * Порядок важен: в Balatro перестановка джокеров меняет результат, у нас
 * будет так же, и это сознательная часть дизайна.
 */
export function runHook<K extends HookName>(
  modifiers: readonly Modifier[],
  hook: K,
  context: HookContexts[K],
): HookContexts[K] {
  for (const modifier of modifiers) {
    const handler = modifier.hooks[hook]
    if (handler) handler(context)
  }
  return context
}
