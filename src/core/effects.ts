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
import { createRng, type Rng } from './rng'
import type { FireTone, ItemStatus, LevelSnapshot } from './types'

export type { FireTone }

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
   *
   * `tone` отмечает срабатывание, которое обошлось игроку дорого.
   */
  fire(cooldownMs?: number, tone?: FireTone): void
}

interface BaseContext {
  readonly snapshot: LevelSnapshot
  /** Часы уровня. Те же, что у таймера. */
  readonly now: number
  item: ItemApi
  /**
   * Случайность уровня. Один генератор на уровень, засеянный от сида забега.
   *
   * Предмет НЕ имеет права звать Math.random: забег в роглайте обязан
   * воспроизводиться по сиду, иначе невозможны ни повторы, ни отладка «как я
   * вообще получил такой расклад». По этой же причине генератор один на всех
   * предметов: порядок вызовов - часть расклада.
   */
  readonly rng: Rng
  /**
   * Очки, которые предмет начисляет НАПРЯМУЮ, минуя слово и множитель.
   *
   * Поле есть у каждого хука, потому что подарок счёта не привязан к
   * завершению слова: лотерея закрывается посреди слова и даже на ошибке.
   * Ядро прибавляет его сразу после прогона хуков и тут же проверяет победу -
   * иначе подарок, добравший цель, заметили бы только на следующей букве.
   */
  bonusScore: number
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
  /**
   * Что игрок нажал физически. Отличается от char, когда нажатие простил
   * предмет: текст ждал строчную, а игрок попал по заглавной.
   *
   * Поле нужно предметам, которым важен не текст, а сам ввод: они считают
   * не то, что написано, а то, как это набрали.
   */
  readonly key: string
  readonly isDigit: boolean
  readonly isUpperCase: boolean
  readonly isPunctuation: boolean
  chips: number
  /**
   * Символ поставил предмет, а не игрок.
   *
   * Предмет, который дописывает текст за игрока, обязан проверять этот флаг,
   * иначе сработает на своей же работе. Ядро на такие символы не наращивает
   * ни комбо, ни число верных нажатий: скорость и точность в итогах меряют
   * пальцы игрока, и врать о них нельзя (см. правило 4 в architecture.md).
   */
  readonly auto: boolean
  /**
   * Просьба дописать текущее слово до конца. Ядро дописывает остаток теми же
   * символами, что стоят в тексте, прогоняя каждый через onCharCorrect с
   * auto: true - поэтому предметы, дающие символы за знак, их тоже видят.
   */
  completeWord: boolean
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
  /**
   * Сколько заняло само слово: от первого засчитанного символа до пробела
   * за ним. Считается по часам уровня, то есть уже с учётом замедления.
   */
  readonly wordElapsedMs: number
  chips: number
  /**
   * Общий множитель игрока. Правка ЗДЕСЬ остаётся с игроком и дальше:
   * это тот самый множитель, который копится по ходу уровня.
   */
  mult: number
  /**
   * Надбавка только на это слово. Умножается на mult при подсчёте очков и
   * тут же забывается.
   *
   * Поле существует потому, что без него разовый бонус пришлось бы вносить
   * в mult и вычитать обратно в onWordComplete. Предмет, который умножает
   * множитель на четыре за одно слово, не должен оставлять игроку
   * четырёхкратный множитель навсегда.
   */
  wordMult: number
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

/** Уровень начинается. Здесь задаётся стартовый множитель и ход часов. */
export interface LevelStartContext extends BaseContext {
  /**
   * Текст узла целиком. Нужен предметам, которые смотрят, ЧТО придётся
   * печатать: лотерея по нему определяет язык и алфавит.
   */
  readonly text: string
  mult: number
  /**
   * Во сколько раз часы уровня идут медленнее реальных. 1 - обычный ход.
   *
   * Замедление объявляется один раз на старте и дальше живёт в ядре,
   * потому что по этим часам обязаны идти ВСЕ механики уровня разом:
   * таймер, откаты предметов, окно после ошибки, время слова. Иначе
   * замедление лечило бы таймер и ломало всё остальное.
   */
  timeScale: number
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
export type HookPayload<K extends HookName> = Omit<
  HookContexts[K],
  'item' | 'rng' | 'bonusScore'
> & { item?: ItemApi }

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
  firedTone: FireTone
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
  private readonly rng: Rng

  /**
   * Генератор по умолчанию засеян нулём, а не временем: тест, который не
   * передал сид, обязан вести себя одинаково от запуска к запуску.
   */
  constructor(modifiers: readonly Modifier[], rng: Rng = createRng(0)) {
    this.rng = rng
    this.slots = modifiers.map((modifier) => ({
      modifier,
      memory: { ...(modifier.memory ?? {}) },
      firedAt: null,
      firedTone: 'plain',
      readyAt: 0,
      cooldownMs: 0,
    }))
  }

  run<K extends HookName>(hook: K, now: number, payload: HookPayload<K>): HookContexts[K] {
    const context = payload as HookContexts[K]
    // Общее для всех хуков рантайм подставляет сам: ядру не нужно помнить
    // об этом в девяти местах вызова.
    ;(context as { rng: Rng }).rng = this.rng
    context.bonusScore = 0

    for (const slot of this.slots) {
      const handler = slot.modifier.hooks[hook]
      if (!handler) continue

      // Свежий api на каждый вызов: ready зависит от текущего времени,
      // а память и кулдаун должны попадать строго в свой слот.
      context.item = {
        memory: slot.memory,
        ready: now >= slot.readyAt,
        fire: (cooldownMs = 0, tone: FireTone = 'plain') => {
          slot.firedAt = now
          slot.firedTone = tone
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
      // Копия, а не сама память: интерфейс читает её каждый кадр, и править
      // состояние предмета из компонента он не должен.
      memory: { ...slot.memory },
      cooldownLeftMs: Math.max(0, slot.readyAt - now),
      cooldownTotalMs: slot.cooldownMs,
      sinceFiredMs: slot.firedAt === null ? null : now - slot.firedAt,
      tone: slot.firedTone,
    }))
  }
}
