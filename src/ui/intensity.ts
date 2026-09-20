/**
 * Визуальный язык силы игрока. Две независимые оси, а не одна.
 *
 *   множитель -> цвет и свечение
 *   комбо     -> размер и вспышка
 *
 * Разделение не формальное: комбо обнуляется от любой ошибки, а множитель
 * только проседает на 0.6. После промаха цифра остаётся горячей по цвету,
 * но теряет размер - и это ровно та информация, которая нужна игроку.
 *
 * Цвет множителя повторяет то, что уже делает звук: чем выше множитель,
 * тем выше тон. Теперь то же самое видно глазами.
 *
 * Красный не используется ни на одной оси: он занят ошибками.
 */

// ---------------------------------------------------------------- множитель

export interface MultTier {
  readonly level: 0 | 1 | 2 | 3
  readonly min: number
  readonly color: string
  /** Верхняя ступень светится заметно сильнее обычного. */
  readonly glow: string
}

const MULT_TIERS: readonly MultTier[] = [
  { level: 0, min: 1, color: 'text-term', glow: 'glow' },
  { level: 1, min: 2, color: 'text-term-bright', glow: 'glow' },
  { level: 2, min: 3.5, color: 'text-term-amber', glow: 'glow' },
  { level: 3, min: 5, color: 'text-term-hot', glow: 'glow-hot' },
]

export function multTier(mult: number): MultTier {
  let current = MULT_TIERS[0]!
  for (const tier of MULT_TIERS) {
    if (mult >= tier.min) current = tier
  }
  return current
}

// -------------------------------------------------------------------- комбо

export interface ComboTier {
  readonly level: 0 | 1 | 2 | 3
  readonly min: number
  /** Кегль суммы в вылетающих очках. Ровная лесенка с шагом 0.375rem. */
  readonly popupSize: string
  readonly hudSize: string
  /** Верхняя ступень дышит в панели. */
  readonly pulse: boolean
  /** Верхняя ступень получает вспышку, дрожь и отдельный звук. */
  readonly epic: boolean
}

const COMBO_TIERS: readonly ComboTier[] = [
  {
    level: 0,
    min: 0,
    popupSize: 'text-[1.875rem] sm:text-[2.25rem]',
    hudSize: 'text-2xl',
    pulse: false,
    epic: false,
  },
  {
    level: 1,
    min: 20,
    popupSize: 'text-[2.25rem] sm:text-[2.75rem]',
    hudSize: 'text-3xl',
    pulse: false,
    epic: false,
  },
  {
    level: 2,
    min: 50,
    popupSize: 'text-[2.625rem] sm:text-[3.25rem]',
    hudSize: 'text-4xl',
    pulse: false,
    epic: false,
  },
  {
    level: 3,
    min: 100,
    popupSize: 'text-[3rem] sm:text-[3.75rem]',
    hudSize: 'text-5xl',
    pulse: true,
    epic: true,
  },
]

export function comboTier(combo: number): ComboTier {
  let current = COMBO_TIERS[0]!
  for (const tier of COMBO_TIERS) {
    if (combo >= tier.min) current = tier
  }
  return current
}

/** Комбо, с которого начинается следующая ступень. Null на последней. */
export function nextTierAt(combo: number): number | null {
  const next = COMBO_TIERS.find((tier) => tier.min > combo)
  return next ? next.min : null
}
