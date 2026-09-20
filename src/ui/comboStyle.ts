/**
 * Ступени комбо: единый визуальный язык для вылетающих очков и верхней панели.
 *
 * Комбо считается в символах, а не в словах, поэтому пороги крупные:
 * одно слово даёт примерно 6 комбо, строка текста - около сорока.
 *
 * Эскалация идёт по трём каналам сразу - размер, цвет и пульсация.
 * Одного размера мало: во время печати периферийное зрение ловит смену
 * цвета лучше, чем изменение кегля.
 *
 * Красный сознательно не используется: он занят ошибками, и смешивать
 * "ты молодец" с "ты промахнулся" в одном цвете нельзя.
 */
import type { Language } from '../core/types'

export interface ComboTier {
  readonly level: 0 | 1 | 2 | 3
  /** Минимальное комбо для этой ступени. */
  readonly min: number
  readonly color: string
  readonly popupSize: string
  readonly hudSize: string
  /** Верхняя ступень дышит, чтобы её нельзя было не заметить. */
  readonly pulse: boolean
  readonly name: Readonly<Record<Language, string>>
}

const TIERS: readonly ComboTier[] = [
  {
    level: 0,
    min: 0,
    color: 'text-term-bright',
    popupSize: 'text-4xl sm:text-5xl',
    hudSize: 'text-2xl',
    pulse: false,
    name: { ru: '', en: '' },
  },
  {
    level: 1,
    min: 20,
    color: 'text-term',
    popupSize: 'text-5xl sm:text-6xl',
    hudSize: 'text-3xl',
    pulse: false,
    name: { ru: 'разгон', en: 'spin-up' },
  },
  {
    level: 2,
    min: 50,
    color: 'text-term-amber',
    popupSize: 'text-6xl sm:text-7xl',
    hudSize: 'text-4xl',
    pulse: false,
    name: { ru: 'перегрев', en: 'overheat' },
  },
  {
    level: 3,
    min: 100,
    color: 'text-term-amber',
    popupSize: 'text-6xl sm:text-7xl',
    hudSize: 'text-5xl',
    pulse: true,
    name: { ru: 'предел', en: 'redline' },
  },
]

export function comboTier(combo: number): ComboTier {
  let current = TIERS[0]!
  for (const tier of TIERS) {
    if (combo >= tier.min) current = tier
  }
  return current
}

/** Комбо, с которого начинается следующая ступень. Null на последней. */
export function nextTierAt(combo: number): number | null {
  const next = TIERS.find((tier) => tier.min > combo)
  return next ? next.min : null
}
