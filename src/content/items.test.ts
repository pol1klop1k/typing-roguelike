import { describe, expect, it } from 'vitest'
import { BALANCE, BALANCE_DEFAULTS } from '../core/balance'
import { LevelSession, type LevelConfig, type WordScored } from '../core/level'
import { createRng } from '../core/rng'
import { RARITY_ORDER } from '../core/types'
import { DEFAULT_ITEMS, findItem, ITEMS, modifiersFor, RARITY_TEXT } from './items'

/**
 * Сид, на котором первый же бросок предмета удачен (или, для unlucky, нет).
 *
 * Сид ищется под ТЕКУЩИЙ шанс из наладки, а не вписан числом: иначе тест
 * начал бы врать, как только менеджер повернёт ручку в админке.
 */
function seedWhereFirstRoll(lucky: boolean): number {
  for (let seed = 0; seed < 100_000; seed++) {
    const rng = createRng(seed)
    if (lucky === rng.next() < BALANCE.autocompleteChance) return seed
  }
  throw new Error('не нашёл сид под текущий шанс autocomplete')
}

/** Буквы, которые лотерея разыграла на этом уровне. */
function lotteryLetters(session: LevelSession): string[] {
  const memory = session.snapshot.items[0]?.memory ?? {}
  const letters: string[] = []
  for (let index = 0; index < BALANCE.lotterySymbols; index++) {
    const code = memory[`s${index}`]
    if (code !== undefined) letters.push(String.fromCharCode(code))
  }
  return letters
}

const START = BALANCE.countdownMs

/**
 * Часы конкретной сессии: каждое следующее нажатие на миллисекунду позже.
 * Нужны, чтобы печатать в одну сессию несколько слов подряд.
 */
const clock = new WeakMap<LevelSession, number>()

/** Печатает слово по знаку в миллисекунду и возвращает его итог. */
function typeWord(session: LevelSession, word: string): WordScored {
  let at = clock.get(session) ?? START + 1
  let scored: WordScored | null = null

  for (const char of word) {
    const outcome = session.pressKey(char, at)
    at += 1
    if ((outcome.kind === 'correct' || outcome.kind === 'forgiven') && outcome.wordScored) {
      scored = outcome.wordScored
    }
  }

  clock.set(session, at)
  if (!scored) throw new Error(`слово "${word}" не закрылось`)
  return scored
}

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
      autofill: null,
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
      autofill: null,
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

describe('названия предметов', () => {
  it('сохраняют авторский регистр и не переводятся', () => {
    // lowkey пишется строчными, CapsGod горбом. Ничто в коде не имеет права
    // приводить это к общему виду, поэтому проверяем дословно.
    //
    // Смотрим на каталог ДО наладки: переименовать предмет в админке игрок
    // вправе, а вот причёсывать регистр за него код не должен.
    for (const [id, name] of [
      ['capsgod', 'CapsGod'],
      ['lowkey', 'lowkey'],
      ['guillotine', 'guillotine'],
      ['freeze', 'freeze'],
    ] as const) {
      const item = DEFAULT_ITEMS.find((candidate) => candidate.id === id)
      expect(item?.text.ru.name).toBe(name)
      expect(item?.text.en.name).toBe(name)
    }
  })
})

describe('редкость', () => {
  it('проставлена у каждого предмета и известна балансу', () => {
    for (const item of ITEMS) {
      expect(RARITY_ORDER).toContain(item.rarity)
      expect(BALANCE.rarityWeights[item.rarity]).toBeGreaterThan(0)
    }
  })

  it('названа на обоих языках', () => {
    for (const rarity of RARITY_ORDER) {
      expect(RARITY_TEXT[rarity].ru).toBeTruthy()
      expect(RARITY_TEXT[rarity].en).toBeTruthy()
    }
  })

  it('чем выше ступень, тем реже предмет на витрине', () => {
    // Вес обязан падать монотонно, иначе лестница редкостей ничего не значит.
    // Проверяем замысел из кода: в наладке игрок волен поставить что угодно.
    const weights = RARITY_ORDER.map((rarity) => BALANCE_DEFAULTS.rarityWeights[rarity])
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]!).toBeLessThan(weights[i - 1]!)
    }
  })
})

describe('Капитель', () => {
  it('умножает множитель слова на две единицы за каждую заглавную', () => {
    const session = makeSession(['capsgod'])
    const plain = makeSession([])

    // Текст 'Ab cd': в первом слове ровно одна заглавная.
    const withItem = typeWord(session, 'Ab ')
    const without = typeWord(plain, 'Ab ')

    expect(withItem.mult).toBeCloseTo(without.mult * BALANCE.capsGodPerCap)
    expect(withItem.gained).toBeGreaterThan(without.gained)
  })

  it('считает нажатие, а не букву в тексте', () => {
    // Строчная 'b' набрана заглавной и прощена «Строчной»: для Капители
    // это всё равно заглавная, поэтому множитель удваивается дважды.
    const session = makeSession(['lowkey', 'capsgod'])
    const plain = makeSession([])

    session.pressKey('A', START + 1)
    session.pressKey('B', START + 2)
    const withItem = session.pressKey(' ', START + 3)

    const without = typeWord(plain, 'Ab ')
    const scored = withItem.kind === 'correct' ? withItem.wordScored : null

    expect(scored?.mult).toBeCloseTo(without.mult * BALANCE.capsGodPerCap * 2)
  })

  it('не трогает слово без заглавных и не копит их между словами', () => {
    const session = makeSession(['capsgod'])
    const plain = makeSession([])
    typeWord(session, 'Ab ')
    typeWord(plain, 'Ab ')

    expect(typeWord(session, 'cd').mult).toBeCloseTo(typeWord(plain, 'cd').mult)
  })

  it('не оставляет разовую надбавку в общем множителе', () => {
    // Это главное: x4 за слово не должны превратиться в x4 навсегда.
    const session = makeSession(['capsgod'])
    const plain = makeSession([])
    typeWord(session, 'Ab ')
    typeWord(plain, 'Ab ')

    expect(session.snapshot.mult).toBeCloseTo(plain.snapshot.mult)
  })
})

describe('Строчная', () => {
  it('принимает строчную букву в любом регистре', () => {
    const session = makeSession(['lowkey'])
    session.pressKey('A', START + 1)
    expect(session.pressKey('B', START + 2).kind).toBe('correct')
    expect(session.snapshot.errors).toBe(0)
  })

  it('не отменяет регистр у заглавных в тексте', () => {
    const session = makeSession(['lowkey'])
    expect(session.pressKey('a', START + 1).kind).toBe('error')
  })
})

describe('Гильотина', () => {
  it('вознаграждает быстрое слово и режет медленное', () => {
    const fast = makeSession(['guillotine'])
    const slow = makeSession(['guillotine'])
    const plain = makeSession([])

    const fastScored = typeWord(fast, 'Ab ')
    // То же слово, но каждый знак через две секунды.
    slow.pressKey('A', START + 1)
    slow.pressKey('b', START + 2_000)
    const slowOutcome = slow.pressKey(' ', START + 4_000)
    const slowScored = slowOutcome.kind === 'correct' ? slowOutcome.wordScored : null
    const base = typeWord(plain, 'Ab ')

    expect(fastScored.mult).toBeGreaterThan(base.mult)
    expect(slowScored!.mult).toBeLessThan(base.mult)
  })

  it('помечает срабатывание красным, когда урезала множитель', () => {
    const slow = makeSession(['guillotine'])
    slow.pressKey('A', START + 1)
    slow.pressKey('b', START + 2_000)
    slow.pressKey(' ', START + 4_000)

    expect(slow.snapshot.items[0]?.tone).toBe('harm')
  })

  it('на быстром слове срабатывание обычное', () => {
    const fast = makeSession(['guillotine'])
    typeWord(fast, 'Ab ')

    expect(fast.snapshot.items[0]?.tone).toBe('plain')
  })

  it('не уходит в бесконечность на мгновенном слове', () => {
    const session = makeSession(['guillotine'])
    const scored = typeWord(session, 'Ab ')
    const ceiling = BALANCE.guillotineNumerator / (BALANCE.guillotineFloorMs / 1000)

    expect(Number.isFinite(scored.mult)).toBe(true)
    expect(scored.mult).toBeLessThanOrEqual(BALANCE.multStart * ceiling + 0.001)
  })
})

describe('Заморозка и часы уровня', () => {
  it('не закрывает окно безопасности раньше срока', () => {
    // Окно ставится в часах УРОВНЯ, а сравнивалось с реальными: под
    // замедлением реальные часы уходят вперёд, и окно закрывалось, не успев
    // открыться. Под заморозкой это было видно особенно хорошо.
    const session = makeSession(['freeze'], { text: 'ab cd', durationMs: 60_000 })

    // Промах открывает окно на errorSafeWindowMs ЧАСОВ УРОВНЯ, то есть на
    // вдвое больше реальных миллисекунд.
    expect(session.pressKey('z', START + 1).kind).toBe('error')

    const realInside = START + 1 + BALANCE.errorSafeWindowMs * BALANCE.freezeTimeScale - 50
    expect(session.pressKey('x', realInside).kind).toBe('safe')
    expect(session.snapshot.errors).toBe(1)
  })
})

describe('Заморозка', () => {
  it('растягивает уровень: таймер теряет меньше, чем прошло на самом деле', () => {
    const frozen = makeSession(['freeze'], { durationMs: 30_000 })
    const plain = makeSession([], { durationMs: 30_000 })

    frozen.tick(START + 12_000)
    plain.tick(START + 12_000)

    expect(plain.snapshot.timeLeftMs).toBe(18_000)
    expect(frozen.snapshot.timeLeftMs).toBeCloseTo(30_000 - 12_000 / BALANCE.freezeTimeScale, 0)
  })

  it('замедляет и время слова, которое видит Гильотина', () => {
    // Слово за две реальные секунды под заморозкой стоит меньше двух
    // секунд уровня, поэтому и режет слабее.
    const frozen = makeSession(['freeze', 'guillotine'])
    const plain = makeSession(['guillotine'])

    for (const session of [frozen, plain]) {
      session.pressKey('A', START + 1)
      session.pressKey('b', START + 1_000)
    }
    const frozenOut = frozen.pressKey(' ', START + 2_000)
    const plainOut = plain.pressKey(' ', START + 2_000)

    const frozenMult = frozenOut.kind === 'correct' ? frozenOut.wordScored!.mult : 0
    const plainMult = plainOut.kind === 'correct' ? plainOut.wordScored!.mult : 0

    expect(frozenMult).toBeCloseTo(plainMult * BALANCE.freezeTimeScale, 2)
  })

  it('не приписывает игроку чужую скорость печати', () => {
    // Замедление даёт больше секунд, но пальцы быстрее не становятся:
    // в итогах должна стоять реальная скорость.
    const frozen = makeSession(['freeze'], { targetScore: 1, durationMs: 30_000 })
    const plain = makeSession([], { targetScore: 1, durationMs: 30_000 })

    for (const session of [frozen, plain]) {
      session.pressKey('A', START + 1)
      session.pressKey('b', START + 1_000)
      session.pressKey(' ', START + 2_000)
    }

    expect(frozen.result?.wpm).toBe(plain.result?.wpm)
    expect(frozen.result?.elapsedMs).toBe(plain.result?.elapsedMs)
  })
})

describe('autocomplete', () => {
  it('дописывает слово целиком и закрывает его', () => {
    const session = makeSession(['autocomplete'], { seed: seedWhereFirstRoll(true) })
    const outcome = session.pressKey('A', START + 1)

    expect(outcome.kind).toBe('correct')
    // Слово "Ab " закрылось от одной нажатой буквы.
    expect(outcome.kind === 'correct' && outcome.wordScored?.word).toBe('Ab ')
    expect(session.snapshot.cursor).toBe(3)
  })

  it('платит за дописанные буквы как за напечатанные', () => {
    const session = makeSession(['autocomplete'], { seed: seedWhereFirstRoll(true) })
    const outcome = session.pressKey('A', START + 1)
    const scored = outcome.kind === 'correct' ? outcome.wordScored : null

    // Три символа слова "Ab ", хотя нажат был один.
    expect(scored?.chips).toBe(BALANCE.chipsPerChar * 3)
  })

  it('не приписывает игроку скорость, которую он не напечатал', () => {
    const session = makeSession(['autocomplete'], { seed: seedWhereFirstRoll(true) })
    session.pressKey('A', START + 1)

    // Нажатие было одно: по этому числу считаются скорость и точность.
    expect(session.snapshot.correctChars).toBe(1)
    expect(session.snapshot.combo).toBe(1)
  })

  it('не срабатывает на своей же работе и не допечатывает текст до конца', () => {
    const session = makeSession(['autocomplete'], { seed: seedWhereFirstRoll(true) })
    session.pressKey('A', START + 1)

    // Дописано ровно одно слово, а не весь текст "Ab cd".
    expect(session.snapshot.cursor).toBeLessThan(5)
  })

  it('молчит, когда не повезло', () => {
    const session = makeSession(['autocomplete'], { seed: seedWhereFirstRoll(false) })
    session.pressKey('A', START + 1)

    expect(session.snapshot.cursor).toBe(1)
  })
})

describe('adrenaline', () => {
  const factorAt = (leftShare: number) =>
    1 + (BALANCE.adrenalineMaxMult - 1) * (1 - leftShare)

  it('на полном таймере ничего не добавляет', () => {
    const withItem = makeSession(['adrenaline'], { durationMs: 60_000 })
    const plain = makeSession([], { durationMs: 60_000 })

    expect(typeWord(withItem, 'Ab ').chips).toBe(typeWord(plain, 'Ab ').chips)
  })

  it('к концу таймера символы дороже', () => {
    const session = makeSession(['adrenaline'], { durationMs: 60_000 })
    // Девять десятых времени потрачено: осталась десятая.
    const at = START + 54_000
    session.pressKey('A', at)
    session.pressKey('b', at + 1)
    const outcome = session.pressKey(' ', at + 2)
    const scored = outcome.kind === 'correct' ? outcome.wordScored : null

    const perChar = Math.round(BALANCE.chipsPerChar * factorAt(0.1))
    expect(scored?.chips).toBe(perChar * 3)
  })

  it('растёт ровно, без рывка в конце', () => {
    const half = makeSession(['adrenaline'], { durationMs: 60_000 })
    half.pressKey('A', START + 30_000)

    const perChar = Math.round(BALANCE.chipsPerChar * factorAt(0.5))
    expect(half.snapshot.wordChips).toBe(perChar)
  })
})

describe('lottery', () => {
  it('разыгрывает буквы алфавита того текста, который придётся печатать', () => {
    const session = makeSession(['lottery'])
    const letters = lotteryLetters(session)

    expect(letters).toHaveLength(BALANCE.lotterySymbols)
    expect(new Set(letters).size).toBe(letters.length)
    // Текст уровня латинский, значит и буквы латинские: иначе их можно было
    // бы набрать бесплатно, чужой алфавит ядро за ошибку не считает.
    for (const letter of letters) expect(letter).toMatch(/[a-z]/)
  })

  it('считает нажатие, а не засчитанный символ: ошибка тоже зачитывается', () => {
    const session = makeSession(['lottery'])
    const letter = lotteryLetters(session)[0]!

    const outcome = session.pressKey(letter, START + 1)
    // Под курсором стоит "A", значит это промах - и он всё равно зачтён.
    expect(outcome.kind).toBe('error')
    expect(session.snapshot.items[0]?.memory.d0).toBe(1)
  })

  it('дарит долю цели, когда собраны все буквы, и только один раз', () => {
    const session = makeSession(['lottery'])
    const letters = lotteryLetters(session)

    letters.forEach((letter, index) => session.pressKey(letter, START + 1 + index * 700))

    const gift = Math.round(session.snapshot.targetScore * BALANCE.lotteryTargetShare)
    expect(session.snapshot.score).toBe(gift)

    session.pressKey(letters[0]!, START + 10_000)
    expect(session.snapshot.score).toBe(gift)
  })

  it('показывает в значке, что уже зачтено', () => {
    const session = makeSession(['lottery'])
    const letters = lotteryLetters(session)
    session.pressKey(letters[0]!, START + 1)

    const badge = findItem('lottery')!.badge!(session.snapshot.items[0]!.memory)
    expect(badge).toHaveLength(BALANCE.lotterySymbols)
    expect(badge[0]).toEqual({ text: letters[0], done: true })
    expect(badge[1]?.done).toBe(false)
  })
})

describe('autocomplete: остановка часов', () => {
  /** Сид, на котором первое же нажатие дописывает слово. */
  const lucky = () => seedWhereFirstRoll(true)

  it('останавливает часы уровня на время дописывания', () => {
    const session = makeSession(['autocomplete'], { seed: lucky(), durationMs: 60_000 })
    const outcome = session.pressKey('A', START + 1)
    const autofill = outcome.kind === 'correct' ? outcome.autofill : null

    expect(autofill).not.toBeNull()
    expect(session.snapshot.frozen).toBe(true)

    // Реальное время идёт, а таймер уровня стоит.
    const frozenLeft = session.snapshot.timeLeftMs
    session.tick(START + 1 + autofill!.freezeMs - 1)
    expect(session.snapshot.timeLeftMs).toBe(frozenLeft)
  })

  it('проглатывает нажатия, пока печатает: залп по инерции больше не ошибка', () => {
    // Ровно та поломка, из-за которой предмет переделывали: пальцы игрока
    // были в середине слова, курсор уезжал за него, и следующее нажатие
    // гарантированно шло не в тот символ.
    const session = makeSession(['autocomplete'], { seed: lucky(), durationMs: 60_000 })
    session.pressKey('A', START + 1)

    expect(session.pressKey('b', START + 2)).toEqual({ kind: 'ignored' })
    expect(session.pressKey('z', START + 3)).toEqual({ kind: 'ignored' })
    expect(session.snapshot.errors).toBe(0)
  })

  it('отпускает часы, когда слово допечатано', () => {
    const session = makeSession(['autocomplete'], { seed: lucky(), durationMs: 60_000 })
    const outcome = session.pressKey('A', START + 1)
    const freezeMs = outcome.kind === 'correct' ? outcome.autofill!.freezeMs : 0

    session.tick(START + 1 + freezeMs + 1)
    expect(session.snapshot.frozen).toBe(false)

    // Дальше таймер снова идёт, и остановка из него не вычитается дважды.
    const left = session.snapshot.timeLeftMs
    session.tick(START + 1 + freezeMs + 1_001)
    expect(session.snapshot.timeLeftMs).toBeCloseTo(left - 1_000, -1)
  })

  it('не отнимает у игрока время, которое он провёл в остановке', () => {
    const frozen = makeSession(['autocomplete'], { seed: lucky(), durationMs: 60_000 })
    const plain = makeSession([], { seed: lucky(), durationMs: 60_000 })

    const outcome = frozen.pressKey('A', START + 1)
    plain.pressKey('A', START + 1)
    const freezeMs = outcome.kind === 'correct' ? outcome.autofill!.freezeMs : 0

    // Пять секунд реального времени на оба уровня, остановка давно кончилась.
    frozen.tick(START + 5_000)
    plain.tick(START + 5_000)

    // У того, кому дописали слово, на таймере БОЛЬШЕ ровно на остановку:
    // секунды, пока печатало ядро, игроку не в счёт.
    expect(frozen.snapshot.timeLeftMs - plain.snapshot.timeLeftMs).toBe(freezeMs)
  })

  it('открывает окно безопасности после остановки', () => {
    // Инерция переживает и остановку: кто-то успеет нажать уже после неё.
    const session = makeSession(['autocomplete'], { seed: lucky(), durationMs: 60_000 })
    const outcome = session.pressKey('A', START + 1)
    const freezeMs = outcome.kind === 'correct' ? outcome.autofill!.freezeMs : 0

    session.tick(START + 1 + freezeMs + 1)
    expect(session.pressKey('z', START + 1 + freezeMs + 2)).toEqual({ kind: 'safe' })
    expect(session.snapshot.errors).toBe(0)
  })

  it('сообщает интерфейсу, какие символы дописаны', () => {
    const session = makeSession(['autocomplete'], { seed: lucky(), durationMs: 60_000 })
    const outcome = session.pressKey('A', START + 1)
    const autofill = outcome.kind === 'correct' ? outcome.autofill! : null

    // Текст уровня - "Ab cd": после нажатой A дописаны "b " до конца слова.
    expect(autofill).toEqual({
      from: 1,
      to: 3,
      freezeMs: Math.max(BALANCE.autofillMinMs, 2 * BALANCE.autofillCharMs),
    })
  })
})
