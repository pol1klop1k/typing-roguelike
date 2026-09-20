/**
 * Ступени комбо: единый визуальный язык для вылетающих очков и верхней панели.
 *
 * Комбо считается в символах, а не в словах, поэтому пороги крупные:
 * одно слово даёт примерно 6 комбо, строка текста - около сорока.
 *
 * Ступень не подписана словами: её сообщают размер, цвет и - на верхней
 * ступени - отдельный эффект. Текст во время печати всё равно не читается,
 * взгляд занят набором.
 *
 * Красный сознательно не используется: он занят ошибками, и смешивать
 * "ты молодец" с "ты промахнулся" в одном цвете нельзя.
 */

export interface ComboTier {
  readonly level: 0 | 1 | 2 | 3
  /** Минимальное комбо для этой ступени. */
  readonly min: number
  readonly color: string
  /** Кегль суммы в вылетающих очках. Шаг лесенки ровный, 0.375rem. */
  readonly popupSize: string
  readonly hudSize: string
  /** Верхняя ступень дышит в панели, чтобы её нельзя было не заметить. */
  readonly pulse: boolean
  /** Верхняя ступень получает вспышку и тряску в вылетающих очках. */
  readonly epic: boolean
}

const TIERS: readonly ComboTier[] = [
  {
    level: 0,
    min: 0,
    color: 'text-term-bright',
    popupSize: 'text-[1.875rem] sm:text-[2.25rem]',
    hudSize: 'text-2xl',
    pulse: false,
    epic: false,
  },
  {
    level: 1,
    min: 20,
    color: 'text-term',
    popupSize: 'text-[2.25rem] sm:text-[2.75rem]',
    hudSize: 'text-3xl',
    pulse: false,
    epic: false,
  },
  {
    level: 2,
    min: 50,
    color: 'text-term-amber',
    popupSize: 'text-[2.625rem] sm:text-[3.25rem]',
    hudSize: 'text-4xl',
    pulse: false,
    epic: false,
  },
  {
    level: 3,
    min: 100,
    color: 'text-term-amber',
    popupSize: 'text-[3rem] sm:text-[3.75rem]',
    hudSize: 'text-5xl',
    pulse: true,
    epic: true,
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
