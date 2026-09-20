import { describe, expect, it } from 'vitest'
import { BALANCE } from '../core/balance'
import { planLevel } from '../core/difficulty'
import { LevelSession } from '../core/level'
import { findForbiddenChars } from '../core/typing'
import type { Language, BaseWpm, TextVariant } from '../core/types'
import { findText, TEXTS } from './texts'

const LANGUAGES: readonly Language[] = ['ru', 'en']
const PRESETS: readonly BaseWpm[] = BALANCE.presets

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
  it('содержит запас, ощутимо больший длины забега', () => {
    // Иначе каждый забег будет показывать почти один и тот же набор.
    expect(TEXTS.length).toBeGreaterThan(BALANCE.runLength * 1.5)
  })

  it('не содержит повторяющихся идентификаторов', () => {
    expect(new Set(TEXTS.map((t) => t.id)).size).toBe(TEXTS.length)
  })

  it('не содержит повторяющихся номеров журнала', () => {
    expect(new Set(TEXTS.map((t) => t.order)).size).toBe(TEXTS.length)
  })

  it('находит текст по идентификатору', () => {
    expect(findText('signal')?.order).toBe(1)
    expect(findText('нет такого')).toBeUndefined()
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

    it('не содержит буквы ё: на части раскладок её нет там, где ждут', () => {
      expect(variant.body.toLowerCase()).not.toContain('ё')
    })
  })
})

/**
 * Проверяем не сами тексты, а то, что выведенные из них числа остаются
 * играбельными на любом узле любого пресета. Это защита от текста, который
 * технически корректен, но даёт уровень на шесть секунд или на три минуты.
 */
describe.each(PRESETS)('заявленные %i wpm дают вменяемые узлы', (preset) => {
  describe.each(TEXTS)('текст $id', (text) => {
    describe.each(LANGUAGES)('язык %s', (language) => {
      const variant = text.variants[language]

      it('цель достижима и оставляет хвост текста про запас', () => {
        for (const step of [0, BALANCE.runLength - 1]) {
          const plan = planLevel(variant.body, preset, step, BALANCE.runLength)
          const snapshot = playPerfectly(variant, plan.targetScore)
          expect(snapshot.phase).toBe('won')

          const fraction = snapshot.cursor / variant.body.length
          expect(fraction).toBeLessThanOrEqual(BALANCE.maxTypedFraction + 0.05)
        }
      })

      it('таймер укладывается в разумную длину уровня на всех шагах', () => {
        for (let step = 0; step < BALANCE.runLength; step++) {
          const plan = planLevel(variant.body, preset, step, BALANCE.runLength)
          expect(plan.durationMs).toBeGreaterThanOrEqual(12_000)
          expect(plan.durationMs).toBeLessThanOrEqual(70_000)
        }
      })

      it('поздний узел требует больше работы за меньшее время', () => {
        const first = planLevel(variant.body, preset, 0, BALANCE.runLength)
        const last = planLevel(variant.body, preset, BALANCE.runLength - 1, BALANCE.runLength)

        // Главное: требуемая скорость растёт. Это и есть сложность.
        expect(last.requiredWpm).toBeGreaterThan(first.requiredWpm)
        // Работы больше, времени меньше. Объём мог упереться в длину текста,
        // поэтому «не меньше», а не «строго больше».
        expect(last.targetScore).toBeGreaterThanOrEqual(first.targetScore)
        expect(last.durationMs).toBeLessThanOrEqual(first.durationMs)
        expect(last.reward).toBeGreaterThan(first.reward)
      })
    })
  })
})
