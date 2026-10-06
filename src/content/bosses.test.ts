import { describe, expect, it } from 'vitest'
import { BALANCE, BALANCE_DEFAULTS } from '../core/balance'
import { isBossStep } from '../core/difficulty'
import { LevelSession } from '../core/level'
import { TEXTS } from './texts'
import { BOSSES, bossFor } from './bosses'

const START = BALANCE.countdownMs

/** Уровень с боссом и текстом из десяти коротких слов. */
function makeSession(bossId: string, durationMs = 60_000): LevelSession {
  const boss = BOSSES.find((entry) => entry.id === bossId)!
  const session = new LevelSession({
    text: 'aa bb cc dd ee ff gg hh ii jj',
    targetScore: 1_000_000,
    durationMs,
    reward: 3,
    boss: boss.modifier,
    seed: 'boss',
  })
  session.start(0)
  session.tick(START)
  return session
}

describe('каталог боссов', () => {
  it('не содержит повторяющихся идентификаторов и узлов', () => {
    expect(new Set(BOSSES.map((boss) => boss.id)).size).toBe(BOSSES.length)
    expect(new Set(BOSSES.map((boss) => boss.step)).size).toBe(BOSSES.length)
  })

  it('у модификатора тот же идентификатор, что у босса', () => {
    for (const boss of BOSSES) expect(boss.modifier.id).toBe(boss.id)
  })

  it('стоит на узле, который кривая считает боссовым', () => {
    // Замысел, а не наладка: читается из кода. Босс обязан стоять там, где
    // требуемая скорость и так подскакивает, иначе узел перестанет быть рубежом.
    for (const boss of BOSSES) {
      expect(
        isBossStep(boss.step, BALANCE_DEFAULTS.runLength, BALANCE_DEFAULTS.actLength),
      ).toBe(true)
    }
  })

  it('находит босса по узлу и молчит там, где его нет', () => {
    expect(bossFor(9)?.id).toBe('nurse')
    expect(bossFor(0)).toBeUndefined()
  })
})

describe('сиделка', () => {
  it('гасит слово сразу, как уровень пошел', () => {
    const session = makeSession('nurse')
    expect(session.snapshot.blackouts).toHaveLength(1)
  })

  it('не трогает слово под курсором: его буквы игрок уже видел', () => {
    const session = makeSession('nurse')
    const dark = session.snapshot.blackouts[0]!

    expect(dark).toBeGreaterThan(session.snapshot.wordIndex)
    expect(dark).toBeLessThanOrEqual(
      session.snapshot.wordIndex + Math.round(BALANCE.nurseLookahead),
    )
  })

  it('возвращает питание, когда срок вышел', () => {
    const session = makeSession('nurse')
    const dark = session.snapshot.blackouts[0]!

    // На полшага до срока слово ещё темно.
    session.tick(START + BALANCE.nurseBlackoutMs - 1)
    expect(session.snapshot.blackouts).toContain(dark)

    session.tick(START + BALANCE.nurseBlackoutMs + 1)
    expect(session.snapshot.blackouts).not.toContain(dark)
  })

  it('держит на экране ровно одно погашенное слово', () => {
    // Интервал равен длительности, поэтому передышки нет: одно слово гаснет
    // в тот же миг, когда возвращается предыдущее.
    const session = makeSession('nurse')
    for (let step = 1; step <= 6; step++) {
      session.tick(START + BALANCE.nurseIntervalMs * step + 1)
      expect(session.snapshot.blackouts).toHaveLength(1)
    }
  })

  it('не гасит ничего за концом текста', () => {
    const session = makeSession('nurse')
    // Печатаем всё, кроме последнего слова: впереди гасить уже нечего.
    const text = 'aa bb cc dd ee ff gg hh ii '
    ;[...text].forEach((char, index) => session.pressKey(char, START + 1 + index))

    session.tick(START + BALANCE.nurseIntervalMs + 1_000)
    for (const dark of session.snapshot.blackouts) {
      expect(dark).toBeLessThan(session.snapshot.wordCount)
    }
  })

  it('не попадает в панель предметов игрока', () => {
    // Иначе индексы статусов разъехались бы с инвентарём и подсветка села бы
    // не на тот слот.
    const session = makeSession('nurse')
    expect(session.snapshot.items).toHaveLength(0)
    expect(session.snapshot.boss?.id).toBe('nurse')
  })
})

describe('запись босса', () => {
  it('закреплена за слотом каждого босса', () => {
    // Слот равен номеру узла: босс на десятом узле читает журнал 010.
    // Без закрепления нужный текст выпадал бы в одном забеге из шести.
    for (const boss of BOSSES) {
      const slot = boss.step + 1
      const pinned = TEXTS.filter((text) => text.slot === slot && text.pinned)
      expect(pinned).toHaveLength(1)
    }
  })
})
