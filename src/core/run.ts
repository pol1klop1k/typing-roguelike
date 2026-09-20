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
import { createRng } from './rng'

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
  /** Индекс текущего уровня в списке текстов. */
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

/** Предмет в том виде, в каком забег его знает: id, цена и уникальность. */
export interface ShopEntry {
  readonly id: string
  readonly price: number
  /** Второй экземпляр бесполезен, поэтому витрина его не предлагает. */
  readonly unique?: boolean
}

export function startRun(seed: number, totalLevels: number): RunState {
  return {
    seed,
    levelIndex: 0,
    totalLevels,
    credits: 0,
    items: [],
    offers: [],
    rerolls: 0,
    phase: 'level',
  }
}

/**
 * Витрина. Сид собирается из номера уровня и числа перетряхиваний, поэтому
 * один и тот же забег всегда выкладывает один и тот же товар.
 */
export function rollOffers(run: RunState, pool: readonly ShopEntry[]): readonly string[] {
  const rng = createRng(run.seed ^ (run.levelIndex * 7919) ^ (run.rerolls * 104729))
  const available = pool.filter((entry) => !(entry.unique && run.items.includes(entry.id)))
  return rng.shuffle(available).slice(0, BALANCE.shopOffers).map((entry) => entry.id)
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
