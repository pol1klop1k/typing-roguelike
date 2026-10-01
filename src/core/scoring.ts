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

/** Награда за взятый узел, разложенная на слагаемые для экрана итогов. */
export interface Payout {
  /** База за место узла в забеге. */
  readonly base: number
  /** Надбавка за незакончившееся время. */
  readonly timeBonus: number
  readonly total: number
}

/**
 * Награда за узел: база плюс надбавка за запас времени.
 *
 * Надбавка считается по часам УРОВНЯ, то есть по той самой цифре, которую
 * игрок видел на таймере. Это осознанное расхождение со скоростью и
 * точностью, которые считаются по реальным часам (см. правило 4 в
 * architecture.md): платить за что-то, кроме числа на экране, значит врать
 * игроку. Побочный эффект - замедление времени приносит деньги. Это законная
 * выгода билда, оплаченная слотами инвентаря и ограниченная потолком.
 *
 * Функция чистая и ничего не знает про победу: за поражение её просто не
 * вызывают.
 */
export function levelPayout(base: number, timeLeftMs: number): Payout {
  // Ноль в наладке превратил бы деление в бесконечность, а надбавку - в
  // потолок на каждом узле. Считаем это отключённой надбавкой.
  const perCredit = BALANCE.rewardTimeSecPerCredit * 1_000
  const earned = perCredit <= 0 ? 0 : Math.floor(timeLeftMs / perCredit)
  const timeBonus = Math.max(0, Math.min(BALANCE.rewardTimeMax, earned))

  return { base, timeBonus, total: base + timeBonus }
}
