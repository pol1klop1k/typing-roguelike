/**
 * Детерминированный генератор случайных чисел.
 *
 * В прототипе почти не используется, но забег в роглайте обязан быть
 * воспроизводимым по сиду: иначе невозможны ни daily-режим, ни честные
 * повторы, ни отладка «а как я вообще получил такой расклад».
 */
export interface Rng {
  /** Дробное число в [0, 1). */
  next(): number
  /** Целое в [min, max] включительно. */
  int(min: number, max: number): number
  /** Случайный элемент непустого списка. */
  pick<T>(items: readonly T[]): T
  /** Перемешанная копия списка. */
  shuffle<T>(items: readonly T[]): T[]
}

/** Превращает произвольную строку в числовой сид. */
export function seedFromString(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — быстрый и достаточно качественный ГСЧ для игровой логики. */
export function createRng(seed: number | string): Rng {
  let state = (typeof seed === 'string' ? seedFromString(seed) : seed) >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1))

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('rng.pick: пустой список')
    return items[int(0, items.length - 1)]!
  }

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i)
      const a = copy[i]!
      const b = copy[j]!
      copy[i] = b
      copy[j] = a
    }
    return copy
  }

  return { next, int, pick, shuffle }
}
