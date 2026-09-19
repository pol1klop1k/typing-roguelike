/**
 * Формула счёта и производные метрики. Чистая арифметика без состояния.
 *
 * Идея та же, что у подсчёта руки в Balatro: символы копятся посимвольно,
 * но превращаются в очки разом, в момент завершения слова. Это даёт и
 * внятную математику, и точку, куда вешать эффектную анимацию.
 */
import { BALANCE } from './balance'

/** Очки за завершённое слово. */
export function scoreWord(chips: number, mult: number): number {
  return Math.round(chips * mult)
}

/** Множитель после завершения слова. Растёт только за чистое слово. */
export function nextMult(mult: number, cleanWord: boolean): number {
  return cleanWord ? mult + BALANCE.multPerWord : mult
}

/**
 * Штраф времени за ошибку номер `errorIndex` (нумерация с 1).
 * Каждая следующая ошибка дороже предыдущей — после первого промаха
 * игрок начинает нервничать, и это ровно то напряжение, которое нужно.
 */
export function timePenaltyMs(errorIndex: number): number {
  const raw = BALANCE.errorPenaltyBaseMs + (errorIndex - 1) * BALANCE.errorPenaltyStepMs
  return Math.min(raw, BALANCE.errorPenaltyMaxMs)
}

/** Знаков в минуту. */
export function computeCpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  return Math.round(correctChars / (elapsedMs / 60_000))
}

/** Слов в минуту по общепринятому «5 знаков = слово». */
export function computeWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  return Math.round(correctChars / 5 / (elapsedMs / 60_000))
}

/** Точность в процентах, 0..100. */
export function computeAccuracy(correctChars: number, errors: number): number {
  const total = correctChars + errors
  if (total === 0) return 100
  return Math.round((correctChars / total) * 100)
}
