/**
 * Сложность узла выводится из одного числа — требуемой скорости.
 *
 * Раньше у каждого текста были свои подобранные руками таймер и цель.
 * Как только сложность стала зависеть от места в забеге, эти числа начали
 * противоречить друг другу: один и тот же текст на втором и на седьмом узле
 * обязан требовать разного. Поэтому текст теперь несёт только содержание,
 * а таймер и цель вычисляются здесь.
 *
 * Смысл требуемой скорости буквальный: это скорость, на которой игрок
 * добивает цель к самому сигналу. Отсюда читается вся кривая забега:
 *
 *   требуемая скорость НИЖЕ твоей  -> есть запас на ошибки;
 *   требуемая скорость РАВНА твоей -> нужна почти безошибочная игра;
 *   требуемая скорость ВЫШЕ твоей  -> без предметов узел не берётся.
 *
 * Кривая задана долей от заявленной скорости, поэтому пересекает её всегда
 * на одном и том же узле, какую бы скорость игрок ни назвал. Дальше забег
 * выигрывается снаряжением, а не пальцами.
 *
 * Второй принцип: цель задаётся ОБЪЁМОМ РАБОТЫ, а не долей текста.
 * Фрагменты лора различаются по длине втрое, и «напечатай половину»
 * означало бы уровень на пятнадцать секунд для одного текста и на полторы
 * минуты для другого. Объём работы делает длительность узла предсказуемой,
 * а разницу между узлами создаёт только скорость.
 */
import { BALANCE } from './balance'
import { scoreWord } from './scoring'
import { splitWords } from './typing'
import type { BaseWpm } from './types'

/** Готовые числа уровня. Ровно то, что нужно LevelSession. */
export interface LevelPlan {
  readonly durationMs: number
  readonly targetScore: number
  /** Скорость, на которой цель добивается точно к сигналу. */
  readonly requiredWpm: number
  readonly reward: number
}

/**
 * Требуемая скорость на шаге забега: доля от заявленной игроком, линейно
 * растущая от первого узла к последнему. Равномерный подъём читается как
 * честный, а рывок в конце — как подстава.
 */
export function requiredWpm(baseWpm: BaseWpm, step: number, totalSteps: number): number {
  const factor = lerp(BALANCE.wpmFactorFrom, BALANCE.wpmFactorTo, progress(step, totalSteps))
  return Math.max(1, Math.round(baseWpm * factor))
}

/** Узел, с которого требуемая скорость превышает заявленную игроком. */
export function wallStep(totalSteps: number): number {
  const span = BALANCE.wpmFactorTo - BALANCE.wpmFactorFrom
  if (span <= 0) return totalSteps
  const t = (1 - BALANCE.wpmFactorFrom) / span
  return Math.ceil(t * (totalSteps - 1))
}

/**
 * Сколько знаков нужно напечатать на этом шаге. Растёт медленно: основную
 * сложность несёт скорость, объём лишь не даёт поздним узлам выродиться
 * в двадцатисекундные спринты.
 */
export function workCharsAt(step: number, totalSteps: number): number {
  return Math.round(lerp(BALANCE.workFrom, BALANCE.workTo, progress(step, totalSteps)))
}

/** Награда за узел. Поздние узлы платят больше — иначе магазин отстаёт. */
export function rewardAt(step: number): number {
  return BALANCE.rewardBase + Math.floor(step * BALANCE.rewardPerStep)
}

/**
 * Граница работы: последнее слово, которое игрок должен успеть закрыть.
 *
 * Текст никогда не расходуется целиком. Оставленный хвост — это запас на
 * ошибки: после промаха множитель падает, и до цели приходится печатать
 * дальше, чем планировалось. Без хвоста типичным поражением стало бы
 * «текст кончился», а это худшее из возможных объяснений проигрыша.
 */
function workBoundary(text: string, workChars: number): { chars: number; score: number } {
  const words = splitWords(text)
  const limit = Math.min(workChars, Math.floor(text.length * BALANCE.maxTypedFraction))

  let score = 0
  let mult = BALANCE.multStart
  let chars = 0

  for (const word of words) {
    const next = score + scoreWord((word.end - word.start) * BALANCE.chipsPerChar, mult)
    // Первое слово берём всегда, иначе на коротком тексте цель вышла бы нулевой.
    if (word.end > limit && chars > 0) break
    score = next
    chars = word.end
    mult += BALANCE.multPerWord
    if (chars >= limit) break
  }

  return { chars, score }
}

/** Полный набор чисел для узла забега. */
export function planLevel(
  text: string,
  baseWpm: BaseWpm,
  step: number,
  totalSteps: number,
): LevelPlan {
  const wpm = requiredWpm(baseWpm, step, totalSteps)
  const { chars, score } = workBoundary(text, workCharsAt(step, totalSteps))

  // wpm -> знаки в секунду по стандарту «5 знаков = слово».
  const charsPerSecond = (wpm * 5) / 60
  const seconds = (chars / charsPerSecond) * BALANCE.durationSlack

  return {
    durationMs:
      Math.round((seconds * 1000) / BALANCE.durationRoundMs) * BALANCE.durationRoundMs,
    targetScore: score,
    requiredWpm: wpm,
    reward: rewardAt(step),
  }
}

function progress(step: number, totalSteps: number): number {
  if (totalSteps <= 1) return 0
  return Math.min(1, Math.max(0, step / (totalSteps - 1)))
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
