import { describe, expect, it } from 'vitest'
import { BALANCE } from '../core/balance'
import { LevelSession } from '../core/level'
import { findForbiddenChars } from '../core/typing'
import type { Language, TextVariant } from '../core/types'
import { findText, TEXTS } from './texts'

const LANGUAGES: readonly Language[] = ['ru', 'en']

/** Прогоняет текст через настоящее ядро без ограничения по времени. */
function playPerfectly(variant: TextVariant, targetScore: number) {
  const session = new LevelSession({
    text: variant.body,
    targetScore,
    durationMs: Number.MAX_SAFE_INTEGER,
    reward: 0,
  })
  session.start(0)
  session.tick(BALANCE.countdownMs)

  let now = BALANCE.countdownMs
  for (const char of variant.body) {
    session.pressKey(char, ++now)
    if (session.snapshot.phase !== 'running') break
  }
  return session.snapshot
}

describe('каталог текстов', () => {
  it('выстроен по возрастанию сложности: это порядок уровней забега', () => {
    const rank = { easy: 0, normal: 1, hard: 2 }
    const ranks = TEXTS.map((t) => rank[t.difficulty])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('содержит все три сложности', () => {
    expect(new Set(TEXTS.map((t) => t.difficulty))).toEqual(new Set(['easy', 'normal', 'hard']))
  })

  it('не содержит повторяющихся идентификаторов', () => {
    expect(new Set(TEXTS.map((t) => t.id)).size).toBe(TEXTS.length)
  })

  it('находит текст по идентификатору', () => {
    expect(findText('signal')?.difficulty).toBe('easy')
    expect(findText('нет такого')).toBeUndefined()
  })

  it('повышает награду вместе со сложностью', () => {
    const rewards = TEXTS.map((t) => t.reward)
    expect(rewards).toEqual([...rewards].sort((a, b) => a - b))
  })
})

describe.each(TEXTS)('текст $id', (text) => {
  describe.each(LANGUAGES)('язык %s', (language) => {
    const variant = text.variants[language]

    it('заполнен', () => {
      expect(variant.title.length).toBeGreaterThan(0)
      expect(variant.body.length).toBeGreaterThan(50)
    })

    it('набирается с обычной клавиатуры', () => {
      expect(findForbiddenChars(variant.body)).toEqual([])
      expect(findForbiddenChars(variant.title)).toEqual([])
    })

    it('не содержит двойных пробелов и пробелов по краям', () => {
      expect(variant.body).toBe(variant.body.trim())
      expect(variant.body).not.toContain('  ')
    })

    it('достижим: идеальный прогон добирает цель', () => {
      const snapshot = playPerfectly(variant, variant.targetScore)
      expect(snapshot.phase).toBe('won')
    })

    it('честен: цель берётся примерно на половине текста, а не мгновенно', () => {
      const snapshot = playPerfectly(variant, variant.targetScore)
      const fraction = snapshot.cursor / variant.body.length
      expect(fraction).toBeGreaterThan(0.45)
      expect(fraction).toBeLessThan(0.8)
    })

    it('требует вменяемой скорости печати', () => {
      const snapshot = playPerfectly(variant, variant.targetScore)
      const minutes = variant.durationMs / 60_000
      const requiredCpm = snapshot.cursor / minutes
      // примерно от 19 до 48 слов в минуту при идеальной точности
      expect(requiredCpm).toBeGreaterThan(95)
      expect(requiredCpm).toBeLessThan(240)
    })

    it('укладывается в разумную длину уровня', () => {
      expect(variant.durationMs).toBeGreaterThanOrEqual(25_000)
      expect(variant.durationMs).toBeLessThanOrEqual(70_000)
    })
  })
})
