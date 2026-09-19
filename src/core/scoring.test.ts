import { describe, expect, it } from 'vitest'
import { BALANCE } from './balance'
import {
  computeAccuracy,
  computeCpm,
  computeWpm,
  nextMult,
  scoreWord,
  timePenaltyMs,
} from './scoring'

describe('scoreWord', () => {
  it('умножает символы на множитель', () => {
    expect(scoreWord(50, 1)).toBe(50)
    expect(scoreWord(50, 2.4)).toBe(120)
  })

  it('округляет дробный результат', () => {
    expect(scoreWord(30, 1.2)).toBe(36)
    expect(scoreWord(35, 1.1)).toBe(39) // 38.5 -> 39
  })
})

describe('nextMult', () => {
  it('растёт только за чистое слово', () => {
    expect(nextMult(1, true)).toBeCloseTo(1 + BALANCE.multPerWord)
    expect(nextMult(1.6, false)).toBe(1.6)
  })
})

describe('timePenaltyMs', () => {
  it('дорожает с каждой ошибкой и упирается в потолок', () => {
    expect(timePenaltyMs(1)).toBe(1_000)
    expect(timePenaltyMs(2)).toBe(2_000)
    expect(timePenaltyMs(3)).toBe(3_000)
    expect(timePenaltyMs(5)).toBe(5_000)
    expect(timePenaltyMs(6)).toBe(BALANCE.errorPenaltyMaxMs)
    expect(timePenaltyMs(50)).toBe(BALANCE.errorPenaltyMaxMs)
  })
})

describe('метрики скорости', () => {
  it('считает знаки и слова в минуту', () => {
    expect(computeCpm(300, 60_000)).toBe(300)
    expect(computeWpm(300, 60_000)).toBe(60)
    expect(computeCpm(150, 30_000)).toBe(300)
  })

  it('не делит на ноль до старта уровня', () => {
    expect(computeCpm(0, 0)).toBe(0)
    expect(computeWpm(0, 0)).toBe(0)
  })
})

describe('computeAccuracy', () => {
  it('считает долю верных нажатий', () => {
    expect(computeAccuracy(90, 10)).toBe(90)
    expect(computeAccuracy(100, 0)).toBe(100)
  })

  it('на пустом вводе не падает и даёт сто процентов', () => {
    expect(computeAccuracy(0, 0)).toBe(100)
  })
})
