import { beforeEach, describe, expect, it } from 'vitest'
import { BALANCE } from './balance'
import type { Modifier } from './effects'
import { LevelSession, type LevelConfig } from './level'

const START = BALANCE.countdownMs

function makeSession(overrides: Partial<LevelConfig> = {}): LevelSession {
  const session = new LevelSession({
    text: 'ab cd ef',
    targetScore: 1_000_000,
    durationMs: 10_000,
    reward: 3,
    ...overrides,
  })
  session.start(0)
  session.tick(START) // проматываем отсчёт 3-2-1
  return session
}

/** Печатает строку посимвольно, по миллисекунде на знак. */
function typeText(session: LevelSession, text: string, from = START + 1): void {
  ;[...text].forEach((char, index) => session.pressKey(char, from + index))
}

describe('отсчёт перед стартом', () => {
  let session: LevelSession

  beforeEach(() => {
    session = new LevelSession({ text: 'ab', targetScore: 100, durationMs: 10_000, reward: 1 })
  })

  it('держит уровень на паузе, пока идёт 3-2-1', () => {
    session.start(0)
    expect(session.snapshot.phase).toBe('countdown')
    expect(session.pressKey('a', 1_000)).toEqual({ kind: 'ignored' })
    expect(session.snapshot.cursor).toBe(0)
  })

  it('запускает таймер ровно после отсчёта', () => {
    session.start(0)
    session.tick(START - 1)
    expect(session.snapshot.phase).toBe('countdown')
    session.tick(START)
    expect(session.snapshot.phase).toBe('running')
    expect(session.snapshot.timeLeftMs).toBe(10_000)
  })

  it('показывает остаток отсчёта', () => {
    session.start(0)
    session.tick(1_000)
    expect(session.snapshot.countdownLeftMs).toBe(START - 1_000)
  })
})

describe('начисление очков', () => {
  it('копит символы, но не даёт очков до конца слова', () => {
    const session = makeSession()
    typeText(session, 'ab')
    expect(session.snapshot.score).toBe(0)
    expect(session.snapshot.wordChips).toBe(2 * BALANCE.chipsPerChar)
  })

  it('превращает слово в очки в момент пробела', () => {
    const session = makeSession()
    typeText(session, 'ab ')
    // 3 знака (включая пробел) * 10 символов * множитель 1
    expect(session.snapshot.score).toBe(30)
    expect(session.snapshot.wordChips).toBe(0)
  })

  it('повышает множитель за чистое слово и применяет его к следующему', () => {
    const session = makeSession()
    typeText(session, 'ab ')
    expect(session.snapshot.mult).toBeCloseTo(1.2)
    typeText(session, 'cd ', START + 100)
    // 30 за первое слово + 3 знака * 10 * 1.2 = 36
    expect(session.snapshot.score).toBe(66)
    expect(session.snapshot.mult).toBeCloseTo(1.4)
  })

  it('сообщает интерфейсу, что слово засчитано', () => {
    const session = makeSession()
    session.pressKey('a', START + 1)
    session.pressKey('b', START + 2)
    const outcome = session.pressKey(' ', START + 3)
    expect(outcome).toEqual({
      kind: 'correct',
      char: ' ',
      wordScored: { word: 'ab ', wordIndex: 0, chips: 30, mult: 1, gained: 30 },
      autofill: null,
    })
  })
})

describe('ошибки', () => {
  it('снижают множитель и отнимают время', () => {
    const session = makeSession()
    typeText(session, 'ab ')
    expect(session.snapshot.mult).toBeCloseTo(1.2)

    const outcome = session.pressKey('z', START + 100)
    expect(outcome).toEqual({ kind: 'error', penaltyMs: 1_000 })
    expect(session.snapshot.mult).toBe(1)
    expect(session.snapshot.errors).toBe(1)
    expect(session.snapshot.timeLeftMs).toBe(10_000 - 100 - 1_000)
  })

  it('не дают множителю вырасти за грязное слово', () => {
    const session = makeSession()
    session.pressKey('z', START + 1) // ошибка внутри первого слова
    typeText(session, 'ab ', START + 2)
    expect(session.snapshot.score).toBe(30) // слово засчитано по множителю 1
    expect(session.snapshot.mult).toBe(1) // и множитель не вырос
  })

  it('не штрафуют за долбление по той же самой неверной клавише', () => {
    const session = makeSession()
    session.pressKey('z', START + 1)
    // намеренно за пределами окна безопасности: проверяем именно защиту
    // от повторов, а не окно
    expect(session.pressKey('z', START + 1_000)).toEqual({ kind: 'ignored' })
    expect(session.pressKey('z', START + 2_000)).toEqual({ kind: 'ignored' })
    expect(session.snapshot.errors).toBe(1)
  })

  it('штрафуют снова, если игрок промахнулся по-новому после окна', () => {
    const session = makeSession()
    session.pressKey('z', START + 1)
    expect(session.pressKey('x', START + 1_000)).toEqual({ kind: 'error', penaltyMs: 2_000 })
    expect(session.snapshot.errors).toBe(2)
  })

  it('сбрасывают комбо, но сохраняют его рекорд', () => {
    const session = makeSession()
    typeText(session, 'ab ')
    expect(session.snapshot.combo).toBe(3)
    session.pressKey('z', START + 100)
    expect(session.snapshot.combo).toBe(0)
    expect(session.snapshot.maxCombo).toBe(3)
  })

  it('обнуляют память о промахе, как только нажат верный символ', () => {
    const session = makeSession()
    session.pressKey('z', START + 1)
    session.pressKey('a', START + 2)
    expect(session.snapshot.wrongKey).toBeNull()
    // тот же 'z' на новой позиции снова считается ошибкой
    expect(session.pressKey('z', START + 3)).toEqual({ kind: 'error', penaltyMs: 2_000 })
  })
})

describe('снижение множителя', () => {
  /** Восемь чистых слов подряд поднимают множитель до x2.6. */
  function sessionWithHighMult(): LevelSession {
    const session = makeSession({ text: 'aa bb cc dd ee ff gg hh ii jj' })
    typeText(session, 'aa bb cc dd ee ff gg hh ')
    return session
  }

  it('вычитает фиксированную величину, а не обнуляет', () => {
    const session = sessionWithHighMult()
    expect(session.snapshot.mult).toBeCloseTo(2.6)
    session.pressKey('z', START + 100)
    expect(session.snapshot.mult).toBeCloseTo(2.6 - BALANCE.multLossOnError)
  })

  it('не опускает множитель ниже стартового', () => {
    const session = makeSession()
    session.pressKey('z', START + 1)
    expect(session.snapshot.mult).toBe(BALANCE.multStart)
    session.pressKey('x', START + 1_000)
    expect(session.snapshot.mult).toBe(BALANCE.multStart)
  })

  it('копится: две отдельные ошибки снимают вдвое больше', () => {
    const session = sessionWithHighMult()
    session.pressKey('z', START + 100)
    session.pressKey('x', START + 1_100)
    expect(session.snapshot.mult).toBeCloseTo(2.6 - BALANCE.multLossOnError * 2)
  })
})

describe('окно безопасности после ошибки', () => {
  it('не штрафует промахи, сделанные по инерции', () => {
    const session = makeSession()
    session.pressKey('z', START + 1)
    expect(session.pressKey('x', START + 100)).toEqual({ kind: 'safe' })
    expect(session.pressKey('y', START + 300)).toEqual({ kind: 'safe' })
    expect(session.snapshot.errors).toBe(1)
  })

  it('не отнимает за них ни времени, ни множителя', () => {
    const session = makeSession({ text: 'aa bb cc dd ee ff' })
    typeText(session, 'aa bb cc dd ee ')
    session.pressKey('z', START + 100)

    const afterError = session.snapshot
    session.pressKey('x', START + 200)
    session.pressKey('y', START + 300)

    expect(session.snapshot.mult).toBe(afterError.mult)
    expect(session.snapshot.timeLeftMs).toBe(afterError.timeLeftMs - 200)
  })

  it('закрывается по истечении срока', () => {
    const session = makeSession()
    session.pressKey('z', START + 1)
    const windowEnds = START + BALANCE.errorSafeWindowMs
    expect(session.pressKey('x', windowEnds - 1)).toEqual({ kind: 'safe' })
    // другой клавишей, иначе сработает защита от повторного нажатия того же символа
    expect(session.pressKey('q', windowEnds + 1)).toEqual({ kind: 'error', penaltyMs: 2_000 })
  })

  it('закрывается досрочно, как только нажат верный символ', () => {
    const session = makeSession()
    session.pressKey('z', START + 1)
    session.pressKey('a', START + 50) // верный символ закрывает окно
    expect(session.pressKey('z', START + 100)).toEqual({ kind: 'error', penaltyMs: 2_000 })
  })

  it('виден интерфейсу, чтобы тот мог показать промах другим цветом', () => {
    const session = makeSession()
    expect(session.snapshot.safeWindow).toBe(false)
    session.pressKey('z', START + 1)
    expect(session.snapshot.safeWindow).toBe(true)
    session.tick(START + BALANCE.errorSafeWindowMs + 1)
    expect(session.snapshot.safeWindow).toBe(false)
  })
})

describe('чужая раскладка', () => {
  it('не штрафует за буквы другого алфавита', () => {
    const session = makeSession({ text: 'привет' })
    expect(session.pressKey('g', START + 1)).toEqual({ kind: 'layout' })
    expect(session.snapshot.errors).toBe(0)
    expect(session.snapshot.timeLeftMs).toBe(10_000 - 1)
  })

  it('включает подсказку после серии промахов чужим алфавитом', () => {
    const session = makeSession({ text: 'привет' })
    session.pressKey('g', START + 1)
    session.pressKey('h', START + 2)
    expect(session.snapshot.layoutMismatch).toBe(false)
    session.pressKey('j', START + 3)
    expect(session.snapshot.layoutMismatch).toBe(true)
  })

  it('снимает подсказку, как только игрок переключился', () => {
    const session = makeSession({ text: 'привет' })
    typeText(session, 'ghj')
    expect(session.snapshot.layoutMismatch).toBe(true)
    session.pressKey('п', START + 10)
    expect(session.snapshot.layoutMismatch).toBe(false)
    expect(session.snapshot.cursor).toBe(1)
  })

  it('обычную опечатку в своём алфавите по-прежнему штрафует', () => {
    const session = makeSession({ text: 'привет' })
    expect(session.pressKey('р', START + 1)).toEqual({ kind: 'error', penaltyMs: 1_000 })
  })
})

describe('победа и поражение', () => {
  it('победа наступает сразу по достижении цели, не дожидаясь конца текста', () => {
    const session = makeSession({ targetScore: 30 })
    typeText(session, 'ab ')
    expect(session.snapshot.phase).toBe('won')
    expect(session.snapshot.cursor).toBe(3)
    expect(session.text.length).toBe(8) // текст напечатан не целиком
  })

  it('поражение, если текст кончился, а цели не хватило', () => {
    const session = makeSession({ targetScore: 1_000_000 })
    typeText(session, 'ab cd ef')
    expect(session.snapshot.phase).toBe('lost')
    expect(session.snapshot.lossReason).toBe('textExhausted')
  })

  it('поражение по истечении времени', () => {
    const session = makeSession()
    session.tick(START + 10_000)
    expect(session.snapshot.phase).toBe('lost')
    expect(session.snapshot.lossReason).toBe('time')
    expect(session.snapshot.timeLeftMs).toBe(0)
  })

  it('штраф за ошибку может сам закончить уровень', () => {
    const session = makeSession({ durationMs: 1_000 })
    session.pressKey('z', START + 100)
    expect(session.snapshot.phase).toBe('lost')
    expect(session.snapshot.lossReason).toBe('time')
  })

  it('игнорирует ввод после конца уровня', () => {
    const session = makeSession({ targetScore: 30 })
    typeText(session, 'ab ')
    expect(session.pressKey('c', START + 500)).toEqual({ kind: 'ignored' })
    expect(session.snapshot.cursor).toBe(3)
  })

  it('замораживает остаток времени после конца уровня', () => {
    const session = makeSession({ targetScore: 30 })
    typeText(session, 'ab ', START + 1_000)
    const frozen = session.snapshot.timeLeftMs
    session.tick(START + 9_000)
    expect(session.snapshot.timeLeftMs).toBe(frozen)
  })
})

describe('итог уровня', () => {
  it('отсутствует, пока уровень идёт', () => {
    expect(makeSession().result).toBeNull()
  })

  it('содержит метрики и награду за победу', () => {
    const session = makeSession({ targetScore: 30, reward: 7 })
    // 3 верных знака за 60 секунд -> 3 зн/мин. Таймер к этому моменту давно
    // на нуле, поэтому надбавки за запас времени нет: только база.
    typeText(session, 'ab ', START + 60_000)
    const result = session.result!
    expect(result.won).toBe(true)
    expect(result.reward).toBe(7)
    expect(result.timeLeftMs).toBe(0)
    expect(result.correctChars).toBe(3)
    expect(result.accuracy).toBe(100)
    expect(result.cpm).toBe(3)
  })

  it('не выдаёт награду за поражение', () => {
    const session = makeSession({ reward: 7 })
    session.tick(START + 10_000)
    expect(session.result!.won).toBe(false)
    expect(session.result!.reward).toBe(0)
    expect(session.result!.rewardBase).toBe(0)
    expect(session.result!.rewardTimeBonus).toBe(0)
  })

  it('добавляет к награде надбавку за запас времени', () => {
    const session = makeSession({ targetScore: 30, reward: 7 })
    // Цель взята сразу, значит на таймере остался почти весь запас.
    typeText(session, 'ab ')
    const result = session.result!

    const left = 10_000 - 3
    const bonus = Math.min(
      BALANCE.rewardTimeMax,
      Math.floor(left / (BALANCE.rewardTimeSecPerCredit * 1_000)),
    )

    expect(result.timeLeftMs).toBe(left)
    expect(result.rewardBase).toBe(7)
    expect(result.rewardTimeBonus).toBe(bonus)
    expect(result.reward).toBe(7 + bonus)
    // Иначе тест перестал бы проверять надбавку, ничего не сообщив.
    expect(bonus).toBeGreaterThan(0)
  })

  it('показывает в срезе награду, которая тает вместе с таймером', () => {
    const session = makeSession({ reward: 3 })
    expect(session.snapshot.rewardBase).toBe(3)
    expect(session.snapshot.rewardTimeBonus).toBeGreaterThan(0)

    session.tick(START + 10_000)
    expect(session.snapshot.rewardTimeBonus).toBe(0)
  })

  it('считает точность по ошибкам', () => {
    const session = makeSession({ targetScore: 30 })
    session.pressKey('z', START + 1)
    typeText(session, 'ab ', START + 2)
    expect(session.result!.accuracy).toBe(75) // 3 верных из 4 нажатий
  })
})

describe('система эффектов', () => {
  it('позволяет модификатору изменить цену символа', () => {
    const doubleChips: Modifier = {
      id: 'test-double',
      hooks: { onCharCorrect: (ctx) => { ctx.chips *= 2 } },
    }
    const session = makeSession({ modifiers: [doubleChips] })
    typeText(session, 'ab ')
    expect(session.snapshot.score).toBe(60)
  })

  it('позволяет модификатору изменить множитель слова', () => {
    const bonusMult: Modifier = {
      id: 'test-mult',
      hooks: { onWordComplete: (ctx) => { ctx.mult += 1 } },
    }
    const session = makeSession({ modifiers: [bonusMult] })
    typeText(session, 'ab ')
    // слово засчитано по множителю 1, но следующий множитель уже 1 + 1 + 0.2
    expect(session.snapshot.score).toBe(30)
    expect(session.snapshot.mult).toBeCloseTo(2.2)
  })

  it('позволяет модификатору смягчить штраф времени', () => {
    const absorber: Modifier = {
      id: 'test-absorber',
      hooks: { onTimePenalty: (ctx) => { ctx.penaltyMs = ctx.penaltyMs / 2 } },
    }
    const session = makeSession({ modifiers: [absorber] })
    expect(session.pressKey('z', START + 1)).toEqual({ kind: 'error', penaltyMs: 500 })
  })

  it('не предлагает предметам спасать промах внутри окна безопасности', () => {
    let offers = 0
    const watcher: Modifier = {
      id: 'watcher',
      hooks: { onCharError: () => { offers++ } },
    }
    const session = makeSession({ modifiers: [watcher] })

    session.pressKey('z', START + 1) // настоящая ошибка: предмету предложено спасти
    expect(offers).toBe(1)

    // Инерционный промах внутри окна гасится раньше, чем дойдёт до предмета,
    // иначе одноразовые спасения сгорали бы на физиологии, а не на ошибках.
    session.pressKey('q', START + 100)
    expect(offers).toBe(1)
  })

  it('прощённый промах не считается ошибкой и не открывает окно безопасности', () => {
    const saviour: Modifier = {
      id: 'saviour',
      hooks: { onCharError: (ctx) => { ctx.forgiven = true } },
    }
    const session = makeSession({ modifiers: [saviour] })

    expect(session.pressKey('z', START + 1)).toEqual({
      kind: 'forgiven',
      char: 'a',
      wordScored: null,
      autofill: null,
    })
    expect(session.snapshot.errors).toBe(0)
    expect(session.snapshot.safeWindow).toBe(false)
    expect(session.snapshot.wrongKey).toBeNull()
  })

  it('даёт предмету переопределить, какая клавиша считается верной', () => {
    const anyKey: Modifier = {
      id: 'any-key',
      hooks: { onKeyCheck: (ctx) => { ctx.accepted = true } },
    }
    const session = makeSession({ modifiers: [anyKey] })
    expect(session.pressKey('z', START + 1)).toEqual({
      kind: 'correct',
      char: 'a',
      wordScored: null,
      autofill: null,
    })
  })

  it('даёт предмету память и откат между вызовами', () => {
    const counter: Modifier = {
      id: 'counter',
      memory: { hits: 0 },
      hooks: {
        onCharCorrect: (ctx) => {
          ctx.item.memory.hits = (ctx.item.memory.hits ?? 0) + 1
          if (ctx.item.ready) ctx.item.fire(1_000)
        },
      },
    }
    const session = makeSession({ modifiers: [counter] })

    session.pressKey('a', START + 1)
    expect(session.snapshot.items[0]!.cooldownLeftMs).toBe(1_000)

    // Пока идёт откат, предмет виден как занятый и fire() не вызывает.
    session.pressKey('b', START + 2)
    expect(session.snapshot.items[0]!.cooldownLeftMs).toBe(999)
  })

  it('применяет модификаторы по порядку', () => {
    const order: string[] = []
    const first: Modifier = {
      id: 'first',
      hooks: { onCharCorrect: () => { order.push('first') } },
    }
    const second: Modifier = {
      id: 'second',
      hooks: { onCharCorrect: () => { order.push('second') } },
    }
    const session = makeSession({ modifiers: [first, second] })
    session.pressKey('a', START + 1)
    expect(order).toEqual(['first', 'second'])
  })
})
