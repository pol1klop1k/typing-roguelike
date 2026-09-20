import { describe, expect, it } from 'vitest'
import { BALANCE } from './balance'
import {
  buyItem,
  canAfford,
  dropItem,
  hasFreeSlot,
  leaveShop,
  loseLevel,
  rerollOffers,
  startRun,
  winLevel,
  type RunState,
  type ShopEntry,
} from './run'

const POOL: readonly ShopEntry[] = [
  { id: 'a', price: 3 },
  { id: 'b', price: 5 },
  { id: 'c', price: 6 },
  { id: 'd', price: 8 },
  { id: 'e', price: 4, unique: true },
]

const SEED = 12_345

function runWith(overrides: Partial<RunState> = {}): RunState {
  return { ...startRun(SEED, 4), ...overrides }
}

describe('ход забега', () => {
  it('начинается на первом уровне без денег и предметов', () => {
    const run = startRun(SEED, 8)
    expect(run.levelIndex).toBe(0)
    expect(run.credits).toBe(0)
    expect(run.items).toEqual([])
    expect(run.phase).toBe('level')
  })

  it('после взятого узла открывает магазин и начисляет награду', () => {
    const run = winLevel(startRun(SEED, 4), 5, POOL)
    expect(run.phase).toBe('shop')
    expect(run.credits).toBe(5)
    expect(run.offers).toHaveLength(BALANCE.shopOffers)
  })

  it('на последнем узле магазина не открывает: тратить уже негде', () => {
    const run = winLevel(runWith({ levelIndex: 3 }), 8, POOL)
    expect(run.phase).toBe('complete')
    expect(run.offers).toEqual([])
    expect(run.credits).toBe(8)
  })

  it('провал уровня заканчивает забег', () => {
    expect(loseLevel(startRun(SEED, 4)).phase).toBe('over')
  })

  it('выход из магазина ведёт на следующий узел', () => {
    const shop = winLevel(startRun(SEED, 4), 5, POOL)
    const next = leaveShop(shop)
    expect(next.levelIndex).toBe(1)
    expect(next.phase).toBe('level')
    expect(next.offers).toEqual([])
  })

  it('не начисляет награду дважды за один уровень', () => {
    const once = winLevel(startRun(SEED, 4), 5, POOL)
    expect(winLevel(once, 5, POOL)).toBe(once)
  })
})

describe('витрина', () => {
  it('повторяема по сиду: один и тот же забег выкладывает тот же товар', () => {
    const first = winLevel(startRun(SEED, 4), 5, POOL)
    const second = winLevel(startRun(SEED, 4), 5, POOL)
    expect(first.offers).toEqual(second.offers)
  })

  it('меняется от уровня к уровню', () => {
    const shopOne = winLevel(startRun(SEED, 8), 5, POOL)
    const shopTwo = winLevel(leaveShop(shopOne), 5, POOL)
    expect(shopTwo.offers).not.toEqual(shopOne.offers)
  })

  it('не предлагает второй экземпляр уникального предмета', () => {
    const run = runWith({ phase: 'shop', items: ['e'], credits: 99, rerolls: 3 })
    expect(rerollOffers(run, POOL).offers).not.toContain('e')
  })

  it('перетряхивание стоит денег и меняет товар', () => {
    const shop = winLevel(startRun(SEED, 4), 5, POOL)
    const rerolled = rerollOffers(shop, POOL)
    expect(rerolled.credits).toBe(shop.credits - BALANCE.rerollCost)
    expect(rerolled.offers).not.toEqual(shop.offers)
  })

  it('без денег перетряхнуть нельзя', () => {
    const broke = runWith({ phase: 'shop', credits: 0, offers: ['a'] })
    expect(rerollOffers(broke, POOL)).toBe(broke)
  })
})

describe('покупка', () => {
  it('списывает цену, занимает слот и убирает предмет с витрины', () => {
    const shop = runWith({ phase: 'shop', credits: 10, offers: ['a', 'b'] })
    const after = buyItem(shop, POOL[0]!)
    expect(after.credits).toBe(7)
    expect(after.items).toEqual(['a'])
    expect(after.offers).toEqual(['b'])
  })

  it('не проходит, если денег не хватает', () => {
    const shop = runWith({ phase: 'shop', credits: 2, offers: ['a'] })
    expect(buyItem(shop, POOL[0]!)).toBe(shop)
  })

  it('не проходит, если слоты заняты', () => {
    const full = Array.from({ length: BALANCE.inventorySlots }, () => 'b')
    const shop = runWith({ phase: 'shop', credits: 99, offers: ['a'], items: full })
    expect(hasFreeSlot(shop)).toBe(false)
    expect(buyItem(shop, POOL[0]!)).toBe(shop)
  })

  it('не проходит по предмету, которого нет на витрине', () => {
    const shop = runWith({ phase: 'shop', credits: 99, offers: ['b'] })
    expect(buyItem(shop, POOL[0]!)).toBe(shop)
  })

  it('вне магазина не работает', () => {
    const level = runWith({ credits: 99, offers: ['a'] })
    expect(buyItem(level, POOL[0]!)).toBe(level)
  })
})

describe('инвентарь', () => {
  it('освобождает слот, но денег не возвращает', () => {
    const run = runWith({ items: ['a', 'b', 'c'], credits: 4 })
    const after = dropItem(run, 1)
    expect(after.items).toEqual(['a', 'c'])
    expect(after.credits).toBe(4)
  })

  it('на несуществующий слот не реагирует', () => {
    const run = runWith({ items: ['a'] })
    expect(dropItem(run, 5)).toBe(run)
  })

  it('держит ровно столько предметов, сколько слотов', () => {
    const run = runWith({ items: Array.from({ length: BALANCE.inventorySlots - 1 }, () => 'a') })
    expect(hasFreeSlot(run)).toBe(true)
    expect(hasFreeSlot({ ...run, items: [...run.items, 'b'] })).toBe(false)
  })

  it('считает, хватает ли денег', () => {
    expect(canAfford(runWith({ credits: 5 }), 5)).toBe(true)
    expect(canAfford(runWith({ credits: 4 }), 5)).toBe(false)
  })
})
