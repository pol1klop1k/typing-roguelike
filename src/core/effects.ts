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
 *
 * У модификатора есть собственная память (state) и кулдаун. Память нужна
 * предметам вроде «второго шанса»: они должны помнить, когда срабатывали.
 * Кулдаун живёт в ядре, а не в предмете, потому что его обязан видеть
 * интерфейс — иначе игрок не понимает, доступен предмет или нет.
 */
import type { ItemStatus, LevelSnapshot } from './types'

export type HookName =
  | 'onLevelStart'
  | 'onKeyCheck'
  | 'onCharCorrect'
  | 'onCharError'
  | 'onScoreCalc'
  | 'onWordComplete'
  | 'onTimePenalty'
  | 'onTick'
  | 'onLevelEnd'

/** Память и кулдаун предмета, чей хук выполняется прямо сейчас. */
export interface ItemApi {
  /** Переживает вызовы хуков внутри одного уровня, обнуляется между уровнями. */
  readonly memory: Record<string, number>
  /** Кулдаун истёк, предмет может сработать. */
  readonly ready: boolean
  /**
   * Предмет сработал. Интерфейс подсветит его, а если указан кулдаун —
   * покажет откат. Пассивные предметы fire() не вызывают: подсвечивать
   * то, что работает всегда, значит превратить панель в мигалку.
   */
  fire(cooldownMs?: number): void
}

interface BaseContext {
  readonly snapshot: LevelSnapshot
  /** Часы уровня. Те же, что у таймера. */
  readonly now: number
  item: ItemApi
}

/**
 * Нажата клавиша — считать ли её верной?
 *
 * Хук решает, что вообще является правильным вводом, поэтому он стоит
 * раньше всех проверок. Так предметы могут смягчать саму сверку символа,
 * не трогая ядро.
 */
export interface KeyCheckContext extends BaseContext {
  readonly key: string
  readonly expected: string
  accepted: boolean
}

/** Верно напечатан символ. Можно изменить, сколько символов он принёс. */
export interface CharCorrectContext extends BaseContext {
  readonly char: string
  readonly isDigit: boolean
  readonly isUpperCase: boolean
  readonly isPunctuation: boolean
  chips: number
}

/**
 * Промах настоящий: он пережил и окно безопасности, и защиту от долбления
 * по одной клавише. Последняя возможность спасти игрока.
 *
 * forgiven = true означает, что ошибки не было вовсе: символ засчитывается,
 * курсор идёт дальше, время, множитель и комбо не страдают.
 */
export interface CharErrorContext extends BaseContext {
  readonly key: string
  readonly expected: string
  forgiven: boolean
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

/** Уровень начинается. Здесь задаётся стартовый множитель. */
export interface LevelStartContext extends BaseContext {
  mult: number
}

export interface HookContexts {
  onLevelStart: LevelStartContext
  onKeyCheck: KeyCheckContext
  onCharCorrect: CharCorrectContext
  onCharError: CharErrorContext
  onScoreCalc: ScoreCalcContext
  onWordComplete: WordCompleteContext
  onTimePenalty: TimePenaltyContext
  onTick: TickContext
  onLevelEnd: BaseContext
}

/** Часть контекста, которую заполняет ядро. Остальное подставляет рантайм. */
export type HookPayload<K extends HookName> = Omit<HookContexts[K], 'item'> & { item?: ItemApi }

/**
 * Предмет, босс или модификатор уровня. Всё это одна и та же структура —
 * различается только тем, откуда она попадает в список активных.
 *
 * Название и описание здесь сознательно отсутствуют: это текст для игрока,
 * он живёт в src/content вместе с ценой и иконкой. Ядру нужны только
 * идентификатор и поведение.
 */
export interface Modifier {
  readonly id: string
  /** Начальное содержимое памяти. Копируется на каждый уровень. */
  readonly memory?: Readonly<Record<string, number>>
  readonly hooks: {
    readonly [K in HookName]?: (ctx: HookContexts[K]) => void
  }
}

interface Slot {
  readonly modifier: Modifier
  memory: Record<string, number>
  firedAt: number | null
  readyAt: number
  cooldownMs: number
}

/**
 * Прогоняет контексты через модификаторы и хранит их память и кулдауны.
 *
 * Один рантайм = один уровень. Порядок модификаторов важен: как и джокеры
 * в Balatro, предметы срабатывают слева направо, и перестановка меняет
 * результат. Это сознательная часть дизайна.
 */
export class ModifierRuntime {
  private readonly slots: readonly Slot[]

  constructor(modifiers: readonly Modifier[]) {
    this.slots = modifiers.map((modifier) => ({
      modifier,
      memory: { ...(modifier.memory ?? {}) },
      firedAt: null,
      readyAt: 0,
      cooldownMs: 0,
    }))
  }

  run<K extends HookName>(hook: K, now: number, payload: HookPayload<K>): HookContexts[K] {
    const context = payload as HookContexts[K]

    for (const slot of this.slots) {
      const handler = slot.modifier.hooks[hook]
      if (!handler) continue

      // Свежий api на каждый вызов: ready зависит от текущего времени,
      // а память и кулдаун должны попадать строго в свой слот.
      context.item = {
        memory: slot.memory,
        ready: now >= slot.readyAt,
        fire: (cooldownMs = 0) => {
          slot.firedAt = now
          slot.cooldownMs = cooldownMs
          slot.readyAt = now + cooldownMs
        },
      }

      handler(context)
    }

    return context
  }

  statuses(now: number): readonly ItemStatus[] {
    return this.slots.map((slot) => ({
      id: slot.modifier.id,
      cooldownLeftMs: Math.max(0, slot.readyAt - now),
      cooldownTotalMs: slot.cooldownMs,
      sinceFiredMs: slot.firedAt === null ? null : now - slot.firedAt,
    }))
  }
}
