/**
 * Забег: последовательность уровней, кредиты, предметы и магазин между ними.
 *
 * Состояние забега — обычные неизменяемые данные, а не класс: каждое
 * действие возвращает новый объект. Так забег можно сохранить, повторить
 * по сиду и показать в тестах целиком, без моков.
 *
 * Модуль ничего не знает ни про конкретные предметы, ни про конкретные
 * тексты: он работает со списком идентификаторов, который ему передают.
 * Это и есть граница между ядром и контентом.
 */
import { BALANCE } from './balance'
import { createRng, type Rng } from './rng'
import type { BaseWpm, Rarity } from './types'

export type RunPhase =
  /** Идёт уровень (или показываются его итоги). */
  | 'level'
  /** Уровень взят, открыт магазин. */
  | 'shop'
  /** Уровни кончились — забег пройден целиком. */
  | 'complete'
  /** Уровень провален — забег окончен. */
  | 'over'

export interface RunState {
  readonly seed: number
  /** Заявленная скорость игрока: от неё считается требуемая на каждом узле. */
  readonly baseWpm: BaseWpm
  /**
   * Узлы этого забега: случайный набор фрагментов лора, отсортированный
   * по номеру журнала. Каждый забег читает свою выборку, но всегда вперёд.
   */
  readonly levels: readonly string[]
  /** Индекс текущего узла в levels. */
  readonly levelIndex: number
  readonly totalLevels: number
  readonly credits: number
  /** Предметы в порядке инвентаря: порядок влияет на срабатывание. */
  readonly items: readonly string[]
  /** Витрина магазина. Пуста, пока магазин закрыт. */
  readonly offers: readonly string[]
  /** Сколько раз витрину перетряхивали — часть сида, чтобы реролл был честным. */
  readonly rerolls: number
  readonly phase: RunPhase
}

/** Фрагмент лора в том виде, в каком забег его знает: id и слот линии. */
export interface TextEntry {
  readonly id: string
  /** Место в истории. У одного слота несколько взаимозаменяемых текстов. */
  readonly slot: number
}

/** Предмет в том виде, в каком забег его знает: id, цена, редкость. */
export interface ShopEntry {
  readonly id: string
  readonly price: number
  /** Насколько часто вещь попадает на витрину. Веса лежат в balance.ts. */
  readonly rarity: Rarity
  /** Второй экземпляр бесполезен, поэтому витрина его не предлагает. */
  readonly unique?: boolean
}

/**
 * Набор узлов забега.
 *
 * Линия сюжета - это не список текстов, а список СЛОТОВ: позиций с
 * закреплённым местом в истории. У слота несколько взаимозаменяемых
 * вариантов, и забег берёт из каждого ровно один.
 *
 * Такой способ выбран вместо случайной выборки из общего запаса по одной
 * причине: выборка ломала историю. Она могла вытянуть последствие без
 * причины, а половину забега набрать из первого акта, и связный сюжет
 * превращался в набор открыток. Слоты дают и то и другое сразу - форма
 * забега постоянна, а слова каждый раз новые.
 *
 * Слотов больше длины забега - берём первые: линию обрывают с конца, а не
 * с середины. Меньше - забег просто выйдет короче.
 */
export function pickLevels(seed: number, pool: readonly TextEntry[], count: number): string[] {
  const rng = createRng(seed)

  const bySlot = new Map<number, TextEntry[]>()
  for (const entry of pool) {
    const variants = bySlot.get(entry.slot)
    if (variants) variants.push(entry)
    else bySlot.set(entry.slot, [entry])
  }

  return [...bySlot.entries()]
    .sort(([a], [b]) => a - b)
    .slice(0, count)
    .map(([, variants]) => rng.pick(variants).id)
}

export function startRun(seed: number, baseWpm: BaseWpm, pool: readonly TextEntry[]): RunState {
  const levels = pickLevels(seed, pool, BALANCE.runLength)
  return {
    seed,
    baseWpm,
    levels,
    levelIndex: 0,
    totalLevels: levels.length,
    credits: 0,
    items: [],
    offers: [],
    rerolls: 0,
    phase: 'level',
  }
}

/** Идентификатор текста на текущем узле. */
export function currentLevelId(run: RunState): string | null {
  return run.levels[run.levelIndex] ?? null
}

/**
 * Витрина. Сид собирается из номера уровня и числа перетряхиваний, поэтому
 * один и тот же забег всегда выкладывает один и тот же товар.
 */
export function rollOffers(run: RunState, pool: readonly ShopEntry[]): readonly string[] {
  const rng = createRng(run.seed ^ (run.levelIndex * 7919) ^ (run.rerolls * 104729))
  const available = pool.filter((entry) => !(entry.unique && run.items.includes(entry.id)))
  return drawByRarity(rng, available, BALANCE.shopOffers).map((entry) => entry.id)
}

/**
 * Достаёт из запаса нужное число РАЗНЫХ предметов с оглядкой на редкость.
 *
 * Выбор идёт по одному и без возврата: взятый предмет выбывает, и веса
 * пересчитываются. Иначе витрина из четырёх мест могла бы предложить один
 * и тот же предмет дважды, а это выглядит как ошибка, а не как удача.
 */
function drawByRarity(rng: Rng, pool: readonly ShopEntry[], count: number): ShopEntry[] {
  const rest = [...pool]
  const drawn: ShopEntry[] = []

  while (drawn.length < count && rest.length > 0) {
    const total = rest.reduce((sum, entry) => sum + BALANCE.rarityWeights[entry.rarity], 0)

    let index = rest.length - 1
    let roll = rng.next() * total
    for (let i = 0; i < rest.length; i++) {
      roll -= BALANCE.rarityWeights[rest[i]!.rarity]
      if (roll <= 0) {
        index = i
        break
      }
    }

    drawn.push(rest[index]!)
    rest.splice(index, 1)
  }

  return drawn
}

/** Уровень взят: кредиты начислены, дальше магазин или конец забега. */
export function winLevel(run: RunState, reward: number, pool: readonly ShopEntry[]): RunState {
  if (run.phase !== 'level') return run

  const next: RunState = { ...run, credits: run.credits + reward }
  // Последний уровень магазином не заканчивается: тратить кредиты уже негде.
  if (run.levelIndex + 1 >= run.totalLevels) return { ...next, phase: 'complete' }

  return { ...next, phase: 'shop', offers: rollOffers(next, pool) }
}

/** Уровень провален. В роглайте это конец забега, а не повод переиграть. */
export function loseLevel(run: RunState): RunState {
  if (run.phase !== 'level') return run
  return { ...run, phase: 'over' }
}

export function canAfford(run: RunState, price: number): boolean {
  return run.credits >= price
}

export function hasFreeSlot(run: RunState): boolean {
  return run.items.length < BALANCE.inventorySlots
}

/** Покупка. Молча ничего не делает, если денег или слотов не хватает. */
export function buyItem(run: RunState, entry: ShopEntry): RunState {
  if (run.phase !== 'shop') return run
  if (!run.offers.includes(entry.id)) return run
  if (!canAfford(run, entry.price) || !hasFreeSlot(run)) return run

  return {
    ...run,
    credits: run.credits - entry.price,
    items: [...run.items, entry.id],
    offers: removeFirst(run.offers, entry.id),
  }
}

/** Освободить слот. Деньги не возвращаются: решение должно чего-то стоить. */
export function dropItem(run: RunState, index: number): RunState {
  if (index < 0 || index >= run.items.length) return run
  return { ...run, items: run.items.filter((_, i) => i !== index) }
}

export function rerollOffers(run: RunState, pool: readonly ShopEntry[]): RunState {
  if (run.phase !== 'shop') return run
  if (!canAfford(run, BALANCE.rerollCost)) return run

  const next: RunState = {
    ...run,
    credits: run.credits - BALANCE.rerollCost,
    rerolls: run.rerolls + 1,
  }
  return { ...next, offers: rollOffers(next, pool) }
}

/** Выйти из магазина на следующий уровень. */
export function leaveShop(run: RunState): RunState {
  if (run.phase !== 'shop') return run
  return { ...run, levelIndex: run.levelIndex + 1, offers: [], phase: 'level' }
}

function removeFirst(items: readonly string[], id: string): readonly string[] {
  const index = items.indexOf(id)
  if (index < 0) return items
  return items.filter((_, i) => i !== index)
}
