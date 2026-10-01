/**
 * Боссы. Как и предметы, это чистые данные: объект с хуками из core/effects.
 *
 * Разница с предметом одна - боссом не владеет игрок. Босс закреплён за узлом
 * и приходит вместе с ним, поэтому у него нет ни цены, ни редкости, ни слота
 * в инвентаре. Всё остальное работает так же: ядро знает про него только
 * идентификатор и хуки.
 *
 * Почему босс первого акта не представляется игроку - в docs/bosses.md.
 */
import { BALANCE } from '../core/balance'
import type { Modifier } from '../core/effects'
import type { ItemParam } from './items'
// Импорт со side-эффектом: модуль накладывает правки админки на balance.ts.
// Числа ниже читаются при сборке модуля, поэтому порядок принципиален.
import './tuning'

export interface BossDefinition {
  readonly id: string
  /** Узел забега, на котором он стоит. Индекс шага, то есть узел 10 это 9. */
  readonly step: number
  /** Числовые ручки, которые видно в админке. */
  readonly params?: readonly ItemParam[]
  readonly modifier: Modifier
}

export const BOSSES: readonly BossDefinition[] = [
  {
    id: 'nurse',
    step: 9,
    params: [
      {
        key: 'nurseIntervalMs',
        text: { ru: 'Раз в сколько гасит, мс', en: 'Blackout interval, ms' },
        step: 500,
        min: 500,
      },
      {
        key: 'nurseBlackoutMs',
        text: { ru: 'На сколько гасит, мс', en: 'Blackout duration, ms' },
        step: 500,
        min: 500,
      },
      {
        key: 'nurseLookahead',
        text: { ru: 'Насколько слов вперёд', en: 'Words ahead' },
        step: 1,
        min: 1,
      },
    ],
    modifier: {
      id: 'nurse',
      hooks: {
        // Откат предмета здесь работает интервалом: ready гасит лишние кадры,
        // а fire(интервал) назначает следующее гашение. Своего счётчика
        // времени у босса нет намеренно - он разъехался бы с часами уровня
        // при первом же замедлении.
        onTick: (ctx) => {
          if (!ctx.item.ready) return

          // Слово под курсором не гасится: игрок его уже начал и буквы
          // помнит. Гасится то, до чего он дойдёт через секунду-другую.
          const lookahead = Math.max(1, Math.round(BALANCE.nurseLookahead))
          const target = ctx.snapshot.wordIndex + 1 + ctx.rng.int(0, lookahead - 1)
          if (target >= ctx.snapshot.wordCount) return

          ctx.blackout.push({ wordIndex: target, durationMs: BALANCE.nurseBlackoutMs })
          ctx.item.fire(BALANCE.nurseIntervalMs)
        },
      },
    },
  },
]

/** Босс этого узла, если он там есть. */
export function bossFor(step: number): BossDefinition | undefined {
  return BOSSES.find((boss) => boss.step === step)
}
