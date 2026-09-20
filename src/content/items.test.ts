import { describe, expect, it } from 'vitest'
import { BALANCE } from '../core/balance'
import { LevelSession, type LevelConfig } from '../core/level'
import { findItem, ITEMS, modifiersFor } from './items'

const START = BALANCE.countdownMs

/** Уровень с текстом, где есть и заглавная буква, и обычные слова. */
function makeSession(itemIds: readonly string[], overrides: Partial<LevelConfig> = {}): LevelSession {
  const session = new LevelSession({
    text: 'Ab cd',
    targetScore: 1_000_000,
    durationMs: 60_000,
    reward: 3,
    modifiers: modifiersFor(itemIds),
    ...overrides,
  })
  session.start(0)
  session.tick(START)
  return session
}

describe('каталог предметов', () => {
  it('не содержит повторяющихся идентификаторов', () => {
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(ITEMS.length)
  })

  it('у каждого предмета есть цена, иконка и текст на обоих языках', () => {
    for (const item of ITEMS) {
      expect(item.price).toBeGreaterThan(0)
      expect(item.glyph.length).toBeGreaterThan(0)
      expect(item.text.ru.name).toBeTruthy()
      expect(item.text.en.name).toBeTruthy()
      expect(item.text.ru.description).toBeTruthy()
      expect(item.text.en.description).toBeTruthy()
    }
  })

  it('у модификатора тот же идентификатор, что у предмета', () => {
    for (const item of ITEMS) expect(item.modifier.id).toBe(item.id)
  })

  it('находит предмет по идентификатору', () => {
    expect(findItem('brutforce')?.glyph).toBeTruthy()
    expect(findItem('нет такого')).toBeUndefined()
  })

  it('собирает модификаторы в порядке инвентаря', () => {
    expect(modifiersFor(['brutforce', 'falsestart']).map((m) => m.id)).toEqual([
      'brutforce',
      'falsestart',
    ])
  })

  it('молча пропускает неизвестный предмет', () => {
    expect(modifiersFor(['нет такого'])).toEqual([])
  })
})

describe('Фальстарт', () => {
  it('поднимает стартовый множитель', () => {
    expect(makeSession(['falsestart']).snapshot.mult).toBe(
      BALANCE.multStart + BALANCE.falseStartMult,
    )
  })

  it('складывается со вторым экземпляром', () => {
    expect(makeSession(['falsestart', 'falsestart']).snapshot.mult).toBe(
      BALANCE.multStart + BALANCE.falseStartMult * 2,
    )
  })

  it('без предмета уровень начинается как обычно', () => {
    expect(makeSession([]).snapshot.mult).toBe(BALANCE.multStart)
  })
})

describe('Перебор', () => {
  it('добавляет символы каждому знаку', () => {
    const session = makeSession(['brutforce'])
    session.pressKey('A', START + 1)
    expect(session.snapshot.wordChips).toBe(BALANCE.chipsPerChar + BALANCE.brutForceChips)
  })

  it('складывается со вторым экземпляром', () => {
    const session = makeSession(['brutforce', 'brutforce'])
    session.pressKey('A', START + 1)
    expect(session.snapshot.wordChips).toBe(BALANCE.chipsPerChar + BALANCE.brutForceChips * 2)
  })
})

describe('Регистр', () => {
  it('принимает заглавную букву, набранную строчной', () => {
    const session = makeSession(['carliccase'])
    expect(session.pressKey('a', START + 1)).toEqual({
      kind: 'correct',
      char: 'A',
      wordScored: null,
    })
    expect(session.snapshot.errors).toBe(0)
    expect(session.snapshot.cursor).toBe(1)
  })

  it('без предмета то же нажатие - ошибка', () => {
    const session = makeSession([])
    expect(session.pressKey('a', START + 1).kind).toBe('error')
  })

  it('не прощает нажатие другой буквы', () => {
    const session = makeSession(['carliccase'])
    expect(session.pressKey('z', START + 1).kind).toBe('error')
  })

  it('срабатывает сколько угодно раз: у него нет отката', () => {
    const session = makeSession(['carliccase'], { text: 'AA' })
    session.pressKey('a', START + 1)
    session.pressKey('a', START + 2)
    expect(session.snapshot.cursor).toBe(2)
    expect(session.snapshot.errors).toBe(0)
  })
})

describe('Второй шанс', () => {
  it('засчитывает неверную букву как верную и не берёт ничего взамен', () => {
    const session = makeSession(['secondchance'], { text: 'ab cd' })
    const before = session.snapshot

    expect(session.pressKey('z', START + 1)).toEqual({
      kind: 'forgiven',
      char: 'a',
      wordScored: null,
    })

    const after = session.snapshot
    expect(after.cursor).toBe(1)
    expect(after.errors).toBe(0)
    expect(after.combo).toBe(1)
    expect(after.mult).toBe(before.mult)
    // Время не тронуто: штраф не применялся.
    expect(after.timeLeftMs).toBe(before.timeLeftMs - 1)
  })

  it('оставляет слово чистым, поэтому множитель всё равно растёт', () => {
    const session = makeSession(['secondchance'], { text: 'ab ' })
    session.pressKey('z', START + 1) // прощённый промах вместо 'a'
    session.pressKey('b', START + 2)
    session.pressKey(' ', START + 3)
    expect(session.snapshot.mult).toBeCloseTo(BALANCE.multStart + BALANCE.multPerWord)
  })

  it('уходит в откат и не спасает второй раз подряд', () => {
    const session = makeSession(['secondchance'], { text: 'abcd' })
    expect(session.pressKey('z', START + 1).kind).toBe('forgiven')

    // Ждём, пока закроется окно безопасности, иначе промах просто не дойдёт
    // до предмета: окно гасит его раньше.
    const later = START + BALANCE.errorSafeWindowMs + 100
    expect(session.pressKey('z', later).kind).toBe('error')
  })

  it('снова готов, когда откат истёк', () => {
    const session = makeSession(['secondchance'], { text: 'abcd' })
    session.pressKey('z', START + 1)

    const afterCooldown = START + BALANCE.secondChanceCooldownMs + 1
    expect(session.pressKey('z', afterCooldown).kind).toBe('forgiven')
  })

  it('два экземпляра дают два спасения подряд', () => {
    const session = makeSession(['secondchance', 'secondchance'], { text: 'abcd' })
    expect(session.pressKey('z', START + 1).kind).toBe('forgiven')

    const later = START + BALANCE.errorSafeWindowMs + 100
    expect(session.pressKey('z', later).kind).toBe('forgiven')
  })
})

describe('статусы предметов в срезе уровня', () => {
  it('показывают откат и момент срабатывания', () => {
    const session = makeSession(['secondchance'], { text: 'abcd' })
    expect(session.snapshot.items[0]!.sinceFiredMs).toBeNull()
    expect(session.snapshot.items[0]!.cooldownLeftMs).toBe(0)

    session.pressKey('z', START + 1)
    const status = session.snapshot.items[0]!
    expect(status.id).toBe('secondchance')
    expect(status.sinceFiredMs).toBe(0)
    expect(status.cooldownLeftMs).toBe(BALANCE.secondChanceCooldownMs)
    expect(status.cooldownTotalMs).toBe(BALANCE.secondChanceCooldownMs)
  })

  it('у пассивного предмета отката нет', () => {
    const session = makeSession(['brutforce'])
    session.pressKey('A', START + 1)
    expect(session.snapshot.items[0]!.cooldownLeftMs).toBe(0)
    expect(session.snapshot.items[0]!.sinceFiredMs).toBeNull()
  })

  it('идут в том же порядке, что и предметы в инвентаре', () => {
    const session = makeSession(['brutforce', 'secondchance'])
    expect(session.snapshot.items.map((status) => status.id)).toEqual([
      'brutforce',
      'secondchance',
    ])
  })
})
