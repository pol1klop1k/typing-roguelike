import { describe, expect, it } from 'vitest'
import { BALANCE } from '../core/balance'
import { bareCharsAt, levelTextCharsAt, planLevel } from '../core/difficulty'
import { LevelSession } from '../core/level'
import { findForbiddenChars } from '../core/typing'
import type { Language, BaseWpm } from '../core/types'
import { buildLevelText, findText, TEXTS } from './texts'

const LANGUAGES: readonly Language[] = ['ru', 'en']
const PRESETS: readonly BaseWpm[] = BALANCE.presets

/** Прогоняет текст через настоящее ядро без ограничения по времени. */
function playPerfectly(body: string, targetScore: number) {
  const session = new LevelSession({
    text: body,
    targetScore,
    durationMs: Number.MAX_SAFE_INTEGER,
    reward: 0,
  })
  session.start(0)
  session.tick(BALANCE.countdownMs)

  let now = BALANCE.countdownMs
  for (const char of body) {
    session.pressKey(char, ++now)
    if (session.snapshot.phase !== 'running') break
  }
  return session.snapshot
}

/** Текст узла в том виде, в каком его получит игрок. */
function levelBody(id: string, language: Language, preset: BaseWpm, step: number): string {
  return buildLevelText(id, language, levelTextCharsAt(preset, step, BALANCE.runLength))
}

describe('каталог текстов', () => {
  it('содержит линию слотов на весь забег', () => {
    // Забег - это вся сюжетная линия, поэтому слотов должно хватать на неё
    // целиком. Количество текстов тут ни при чём: важно число слотов.
    expect(new Set(TEXTS.map((t) => t.slot)).size).toBeGreaterThanOrEqual(BALANCE.runLength)
  })

  it('нумерует слоты подряд от первого, без дыр', () => {
    // Дыра в нумерации означала бы пропущенный журнал в середине истории.
    const slots = [...new Set(TEXTS.map((t) => t.slot))].sort((a, b) => a - b)
    expect(slots).toEqual(slots.map((_, i) => i + 1))
  })

  it('не содержит повторяющихся идентификаторов', () => {
    expect(new Set(TEXTS.map((t) => t.id)).size).toBe(TEXTS.length)
  })

  it('находит текст по идентификатору', () => {
    expect(findText('signal')?.slot).toBe(1)
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
      it('текста хватает на любом узле, даже если игрок тянет время', () => {
        // Идеальная игра голыми руками - это максимум, который вообще можно
        // израсходовать. Текста обязано быть не меньше, иначе билд через
        // замедление времени упирался бы в конец фрагмента при живом таймере.
        for (const step of [0, BALANCE.runLength - 1]) {
          const body = levelBody(text.id, language, preset, step)
          expect(body.length).toBeGreaterThanOrEqual(bareCharsAt(preset, step, BALANCE.runLength))
        }
      })

      it('цель достижима идеальной игрой', () => {
        const body = levelBody(text.id, language, preset, 0)
        const plan = planLevel(body, preset, 0, BALANCE.runLength)
        expect(playPerfectly(body, plan.targetScore).phase).toBe('won')
      })

      it('поздний узел требует больше работы за меньшее время', () => {
        const last = BALANCE.runLength - 1
        const first = planLevel(levelBody(text.id, language, preset, 0), preset, 0, BALANCE.runLength)
        const final = planLevel(levelBody(text.id, language, preset, last), preset, last, BALANCE.runLength)

        expect(final.requiredWpm).toBeGreaterThan(first.requiredWpm)
        // Теперь строго больше: цель больше не упирается в длину текста.
        expect(final.targetScore).toBeGreaterThan(first.targetScore)
        expect(final.durationMs).toBeLessThan(first.durationMs)
        expect(final.reward).toBeGreaterThan(first.reward)
      })
    })
  })
})

describe('сборка текста узла', () => {
  it('начинается с выбранного варианта', () => {
    const chosen = findText('signal')!.variants.ru.body
    expect(buildLevelText('signal', 'ru', 2_000).startsWith(chosen)).toBe(true)
  })

  it('добирает длину остальными вариантами того же слота', () => {
    const body = buildLevelText('signal', 'ru', 1_200)
    expect(body.length).toBeGreaterThanOrEqual(1_200)

    // Продолжение берётся из соседей по слоту, а не из чужой истории.
    const siblings = TEXTS.filter((t) => t.slot === 1 && t.id !== 'signal')
    expect(siblings.some((t) => body.includes(t.variants.ru.body))).toBe(true)
  })

  it('не выходит за пределы слота', () => {
    const body = buildLevelText('signal', 'ru', 4_000)
    const strangers = TEXTS.filter((t) => t.slot !== 1)
    expect(strangers.some((t) => body.includes(t.variants.ru.body))).toBe(false)
  })

  it('короткому узлу отдаёт запись целиком и ничего не клеит', () => {
    const chosen = findText('signal')!.variants.ru.body
    expect(buildLevelText('signal', 'ru', 10)).toBe(chosen)
  })

  it('не порождает двойных пробелов на швах', () => {
    expect(buildLevelText('signal', 'ru', 4_000)).not.toContain('  ')
  })

  it('детерминирован: один и тот же узел собирается одинаково', () => {
    expect(buildLevelText('signal', 'ru', 3_000)).toBe(buildLevelText('signal', 'ru', 3_000))
  })

  it('на неизвестном тексте отдаёт пустую строку, а не падает', () => {
    expect(buildLevelText('нет такого', 'ru', 500)).toBe('')
  })
})
