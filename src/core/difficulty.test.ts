import { describe, expect, it } from 'vitest'
import { BALANCE } from './balance'
import {
  bareCharsAt,
  isBossStep,
  levelDurationMs,
  levelTextCharsAt,
  perfectScoreThrough,
  planLevel,
  requiredWpm,
  requiredWpmWith,
  rewardAt,
  wallStep,
} from './difficulty'

const TOTAL = BALANCE.runLength
const BASE = 40
const TEXT =
  'День 412. Сеть молчит третью неделю. В подвале станции я нашел терминал, который еще ' +
  'помнит, как включаться. Провода целы, питание идет, на экране мигает курсор. Я не знаю, ' +
  'кому пишу. Если кто-то жив и слышит этот сигнал, пусть ответит любым словом. Я готов ждать.'

/**
 * Пара соседних узлов, на которых нет боссов. По таким парам читается сама
 * кривая: надбавка за босса её ломает и мерить по ней нечего.
 */
function plainPair(from: number): [number, number] {
  for (let step = from; step + 1 < TOTAL; step++) {
    if (!isBossStep(step, TOTAL) && !isBossStep(step + 1, TOTAL)) return [step, step + 1]
  }
  throw new Error('в забеге не нашлось двух соседних узлов без босса')
}

describe('боссы', () => {
  it('стоят на последнем узле каждого акта', () => {
    expect(isBossStep(BALANCE.actLength - 1, TOTAL)).toBe(true)
    expect(isBossStep(BALANCE.actLength * 2 - 1, TOTAL)).toBe(true)
  })

  it('не стоят внутри акта', () => {
    expect(isBossStep(0, TOTAL)).toBe(false)
    expect(isBossStep(BALANCE.actLength, TOTAL)).toBe(false)
  })

  it('закрывают забег, даже если последний акт вышел неполным', () => {
    // Иначе финал забега ничем не отличался бы от рядового узла.
    expect(isBossStep(6, 7)).toBe(true)
  })

  it('требуют заметно больше соседей по кривой', () => {
    const boss = BALANCE.actLength - 1
    expect(requiredWpm(BASE, boss, TOTAL)).toBeGreaterThan(requiredWpm(BASE, boss - 1, TOTAL))
    // Спад после босса и есть передышка: игрок обязан её почувствовать.
    expect(requiredWpm(BASE, boss + 1, TOTAL)).toBeLessThan(requiredWpm(BASE, boss, TOTAL))
  })
})

describe('кривая требуемой скорости', () => {
  it('начинается ниже заявленной скорости и заканчивается заметно выше', () => {
    expect(requiredWpm(BASE, 0, TOTAL)).toBeLessThan(BASE)
    expect(requiredWpm(BASE, TOTAL - 1, TOTAL)).toBeGreaterThan(BASE * 2)
  })

  it('растёт на всём забеге, если убрать надбавку за босса', () => {
    let prev = 0
    for (let step = 0; step < TOTAL; step++) {
      if (isBossStep(step, TOTAL)) continue
      const wpm = requiredWpm(BASE, step, TOTAL)
      expect(wpm).toBeGreaterThanOrEqual(prev)
      prev = wpm
    }
  })

  it('растёт долями, а не прибавками: это и есть экспонента', () => {
    // Отношение соседних узлов постоянно, разность - нет. Именно поэтому
    // поздние узлы ощущаются так же, как ранние, хотя цифры выросли втрое.
    const [earlyFrom, earlyTo] = plainPair(0)
    const [lateFrom, lateTo] = plainPair(TOTAL - BALANCE.actLength)
    const earlyRatio = requiredWpm(BASE, earlyTo, TOTAL) / requiredWpm(BASE, earlyFrom, TOTAL)
    const lateRatio = requiredWpm(BASE, lateTo, TOTAL) / requiredWpm(BASE, lateFrom, TOTAL)
    expect(lateRatio).toBeCloseTo(earlyRatio, 1)
  })

  it('ставит стену на один и тот же узел любому игроку', () => {
    // Смысл доли: медленный и быстрый упираются в собственный предел вместе.
    const wall = wallStep(TOTAL)
    for (const preset of BALANCE.presets) {
      expect(requiredWpm(preset, wall, TOTAL)).toBeGreaterThanOrEqual(preset)
      if (wall > 0) expect(requiredWpm(preset, wall - 1, TOTAL)).toBeLessThan(preset)
    }
  })

  it('никогда не опускается ниже одного слова в минуту', () => {
    expect(requiredWpm(1, 0, TOTAL)).toBeGreaterThanOrEqual(1)
  })
})

describe('объём работы и награда', () => {
  it('растут от первого узла к последнему', () => {
    expect(bareCharsAt(BASE, TOTAL - 1, TOTAL)).toBeGreaterThan(bareCharsAt(BASE, 0, TOTAL))
    expect(rewardAt(TOTAL - 1)).toBeGreaterThan(rewardAt(0))
  })

  it('дают поздним узлам больше работы за меньшее время', () => {
    const first = planLevel(TEXT, BASE, 0, TOTAL)
    const last = planLevel(TEXT, BASE, TOTAL - 1, TOTAL)
    expect(last.targetScore).toBeGreaterThan(first.targetScore)
    expect(last.durationMs).toBeLessThan(first.durationMs)
  })

  it('задают длительность своей кривой, а не выводят её из скорости', () => {
    // Если длительность снова начнёт выводиться из требуемой скорости,
    // поздние узлы выродятся в спринты на пару секунд.
    expect(levelDurationMs(0, TOTAL)).toBe(BALANCE.levelDurationFromMs)
    expect(levelDurationMs(TOTAL - 1, TOTAL)).toBe(BALANCE.levelDurationToMs)
  })

  it('держит длительность в разумных пределах на всех узлах', () => {
    // Защита от нелепых значений в наладке: узел не должен ни вырождаться
    // в спринт на пять секунд, ни растягиваться в марафон.
    for (let step = 0; step < TOTAL; step++) {
      expect(levelDurationMs(step, TOTAL)).toBeGreaterThanOrEqual(10_000)
      expect(levelDurationMs(step, TOTAL)).toBeLessThanOrEqual(70_000)
    }
  })
})

describe('цель', () => {
  it('растёт от акта к акту на всём забеге', () => {
    // ГЛАВНЫЙ регрессионный тест. Раньше объём работы упирался в длину
    // фрагмента, и на последней десятке узлов цель переставала расти совсем:
    // узлы 40 и 50 требовали ровно одинакового счёта.
    for (let step = 0; step + BALANCE.actLength < TOTAL; step++) {
      const here = planLevel(TEXT, BASE, step, TOTAL).targetScore
      const actLater = planLevel(TEXT, BASE, step + BALANCE.actLength, TOTAL).targetScore
      expect(actLater).toBeGreaterThan(here)
    }
  })

  it('вырастает за забег на порядки, а не в разы', () => {
    const first = planLevel(TEXT, BASE, 0, TOTAL).targetScore
    const last = planLevel(TEXT, BASE, TOTAL - 1, TOTAL).targetScore
    // Счёт квадратичен по знакам, поэтому цель растёт как квадрат скорости.
    expect(last / first).toBeGreaterThan(100)
  })

  it('не упирается в длину текста', () => {
    // Симуляция обязана идти по кругу: короткий фрагмент не имеет права
    // ограничивать сложность узла.
    const short = 'ab cd'
    const withinText = perfectScoreThrough(short, short.length)
    expect(perfectScoreThrough(short, short.length * 20)).toBeGreaterThan(withinText * 10)
  })

  it('берёт только целые слова', () => {
    // Иначе цель оказалась бы недостижимой ровно на половину слова.
    expect(perfectScoreThrough('abcdef gh', 3)).toBe(perfectScoreThrough('abcdef gh', 7))
  })
})

describe('текст узла', () => {
  it('заказывается с запасом поверх того, что нужно голым рукам', () => {
    // Запас существует ради билдов через время: игрок печатает медленнее,
    // но дольше, и не должен упираться в конец фрагмента.
    for (const step of [0, TOTAL - 1]) {
      expect(levelTextCharsAt(BASE, step, TOTAL)).toBeGreaterThan(bareCharsAt(BASE, step, TOTAL))
    }
  })
})

describe('кривая от явных параметров', () => {
  it('совпадает с кривой из баланса', () => {
    // Админка считает превью этой функцией. Разойдётся - и таблица начнёт
    // врать о том, что получится после сохранения.
    for (const step of [0, 7, BALANCE.actLength - 1, TOTAL - 1]) {
      expect(requiredWpmWith(BALANCE, BASE, step, TOTAL)).toBe(requiredWpm(BASE, step, TOTAL))
    }
  })

  it('слушается множителя сложности', () => {
    const gentle = { ...BALANCE, wpmGrowthPerNode: 1.02 }
    const steep = { ...BALANCE, wpmGrowthPerNode: 1.12 }
    expect(requiredWpmWith(steep, BASE, TOTAL - 1, TOTAL)).toBeGreaterThan(
      requiredWpmWith(gentle, BASE, TOTAL - 1, TOTAL),
    )
    // Первый узел от множителя не зависит: он задан стартовой долей.
    expect(requiredWpmWith(steep, BASE, 0, TOTAL)).toBe(requiredWpmWith(gentle, BASE, 0, TOTAL))
  })
})
