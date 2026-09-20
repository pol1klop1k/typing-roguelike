/**
 * Визуальный язык силы игрока. Одна ось - множитель.
 *
 * Комбо сознательно не получает никакого оформления. Во время печати оно
 * игрока не занимает: это просто счётчик подряд идущих символов, на решения
 * он не влияет. Решает множитель - он определяет счёт, и именно его нужно
 * видеть боковым зрением, не отрываясь от текста.
 *
 * Шкала цвета повторяет шкалу звука: чем выше множитель, тем выше тон ноты
 * за слово и тем горячее цифра. Зелёный - яркий - белый.
 *
 * Янтарный из шкалы убран намеренно: рядом с белым калением он читался как
 * конкурирующая, а не предыдущая ступень. Красный не используется вовсе,
 * он занят ошибками.
 */

export interface MultTier {
  readonly level: 0 | 1 | 2 | 3
  readonly min: number
  readonly color: string
  readonly glow: string
  /** Кегль суммы в вылетающих очках. Ровная лесенка с шагом 0.25rem. */
  readonly popupSize: string
  readonly hudSize: string
  /** Верхняя ступень дышит в панели. */
  readonly pulse: boolean
  /** Верхняя ступень получает вспышку, дрожь и отдельный звук. */
  readonly epic: boolean
}

const TIERS: readonly MultTier[] = [
  {
    level: 0,
    min: 1,
    color: 'text-term',
    glow: 'glow',
    popupSize: 'text-[1.875rem] sm:text-[2.25rem]',
    hudSize: 'text-2xl',
    pulse: false,
    epic: false,
  },
  {
    level: 1,
    min: 2,
    color: 'text-term-bright',
    glow: 'glow',
    popupSize: 'text-[2.125rem] sm:text-[2.5rem]',
    hudSize: 'text-3xl',
    pulse: false,
    epic: false,
  },
  {
    level: 2,
    min: 3.5,
    color: 'text-term-hot',
    glow: 'glow',
    popupSize: 'text-[2.375rem] sm:text-[2.75rem]',
    hudSize: 'text-4xl',
    pulse: false,
    epic: false,
  },
  {
    level: 3,
    min: 5,
    color: 'text-term-hot',
    glow: 'glow-hot',
    popupSize: 'text-[2.625rem] sm:text-[3rem]',
    hudSize: 'text-5xl',
    pulse: true,
    epic: true,
  },
]

export function multTier(mult: number): MultTier {
  let current = TIERS[0]!
  for (const tier of TIERS) {
    if (mult >= tier.min) current = tier
  }
  return current
}

/** Множитель, с которого начинается следующая ступень. Null на последней. */
export function nextMultTierAt(mult: number): number | null {
  const next = TIERS.find((tier) => tier.min > mult)
  return next ? next.min : null
}
