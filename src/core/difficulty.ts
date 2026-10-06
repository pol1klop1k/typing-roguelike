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
 * Порядок вывода чисел важен и однажды уже был другим:
 *
 *   1. требуемая скорость - растёт экспоненциально по номеру узла;
 *   2. длительность - задана отдельной кривой, СВОЕЙ, а не выведенной;
 *   3. объём работы - сколько знаков даёт требуемая скорость за эту
 *      длительность;
 *   4. цель - счёт идеальной игры на этом объёме.
 *
 * Раньше длительность выводилась из объёма, а объём упирался в длину
 * фрагмента, и кривая ломалась молча: на последней десятке узлов цель
 * переставала расти совсем, потому что упиралась в потолок текста. Теперь
 * длина текста на цель не влияет вовсе - наоборот, текст собирается под
 * неё (см. buildLevelText в content/texts.ts).
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

/** Параметры кривой. Ровно то, что крутится в админке. */
export interface CurveParams {
  readonly wpmFactorFrom: number
  readonly wpmGrowthPerNode: number
  readonly bossFactor: number
  readonly actLength: number
}

/**
 * Требуемая скорость на шаге забега: доля от заявленной игроком.
 *
 * Доля растёт экспоненциально, а на боссе получает надбавку. Почему именно
 * так, а не линейно, подробно объяснено в balance.ts.
 */
export function requiredWpm(baseWpm: BaseWpm, step: number, totalSteps: number): number {
  return Math.max(1, Math.round(baseWpm * wpmFactor(step, totalSteps)))
}

/**
 * То же самое, но от ЯВНЫХ параметров, а не от balance.ts.
 *
 * Нужна админке: она показывает таблицу будущей кривой по ещё не
 * сохранённым числам. Без этой функции пришлось бы завести вторую копию
 * формулы в интерфейсе, а копия формулы рано или поздно расходится
 * с оригиналом.
 */
export function requiredWpmWith(
  params: CurveParams,
  baseWpm: BaseWpm,
  step: number,
  totalSteps: number,
): number {
  return Math.max(1, Math.round(baseWpm * wpmFactorWith(params, step, totalSteps)))
}

/**
 * Босс — последний узел каждого акта, а также последний узел забега, даже
 * если акт вышел неполным. Игрок обязан видеть, что упирается не в случайный
 * узел, а в рубеж.
 */
export function isBossStep(
  step: number,
  totalSteps: number,
  actLength: number = BALANCE.actLength,
): boolean {
  if (step === totalSteps - 1) return true
  return (step + 1) % actLength === 0
}

/**
 * Узел, с которого требуемая скорость впервые превышает заявленную игроком.
 *
 * Считается перебором, а не формулой: с надбавкой за босса кривая перестала
 * быть монотонной, и первым порог переступает именно босс, а не узел за ним.
 */
export function wallStep(totalSteps: number): number {
  for (let step = 0; step < totalSteps; step++) {
    if (wpmFactor(step, totalSteps) >= 1) return step
  }
  return Math.max(0, totalSteps - 1)
}

/** Доля от заявленной скорости на этом шаге, вместе с надбавкой за босса. */
function wpmFactor(step: number, totalSteps: number): number {
  return wpmFactorWith(BALANCE, step, totalSteps)
}

/**
 * Та же доля, но от явных параметров.
 *
 * Рост геометрический по НОМЕРУ узла, а не по доле пройденного забега:
 * иначе удлинение забега молча меняло бы крутизну каждого отдельного шага,
 * а крутить хочется именно шаг.
 */
export function wpmFactorWith(params: CurveParams, step: number, totalSteps: number): number {
  const factor = params.wpmFactorFrom * Math.pow(params.wpmGrowthPerNode, step)
  return isBossStep(step, totalSteps, params.actLength) ? factor * params.bossFactor : factor
}

/**
 * Длительность узла. Своя кривая, не выведенная из требуемой скорости.
 *
 * Узлы укорачиваются к финалу, но полого: это форма узла, а не его
 * сложность. Сложность целиком лежит на требуемой скорости.
 */
export function levelDurationMs(step: number, totalSteps: number): number {
  const raw = lerp(BALANCE.levelDurationFromMs, BALANCE.levelDurationToMs, progress(step, totalSteps))
  return Math.round(raw / BALANCE.durationRoundMs) * BALANCE.durationRoundMs
}

/**
 * Сколько знаков нужно напечатать на этом узле идеальной игрой голыми
 * руками. Из этого числа выводится и цель, и длина текста уровня.
 */
export function bareCharsAt(baseWpm: BaseWpm, step: number, totalSteps: number): number {
  const wpm = requiredWpm(baseWpm, step, totalSteps)
  const seconds = levelDurationMs(step, totalSteps) / 1000
  // wpm -> знаки в минуту по стандарту «5 знаков = слово».
  return Math.max(1, Math.round(((wpm * 5 * seconds) / 60) / BALANCE.durationSlack))
}

/**
 * База награды за узел. Поздние узлы платят больше — иначе магазин отстаёт.
 *
 * Это только база: сверху ложится надбавка за запас времени, и считает её
 * уже сам уровень (levelPayout в scoring.ts). Здесь надбавки нет намеренно -
 * план узла составляется до того, как игрок нажал первую клавишу.
 */
export function rewardAt(step: number): number {
  return rewardAtWith(BALANCE, step)
}

/** Параметры награды. Ровно то, что крутится в админке. */
export interface RewardParams {
  readonly rewardBase: number
  readonly rewardPerStep: number
}

/** То же от ЯВНЫХ параметров: админке нужен предпросмотр по несохранённым. */
export function rewardAtWith(params: RewardParams, step: number): number {
  return params.rewardBase + Math.floor(step * params.rewardPerStep)
}

/** Сколько знаков должно быть в тексте узла, с запасом на билды через время. */
export function levelTextCharsAt(baseWpm: BaseWpm, step: number, totalSteps: number): number {
  return Math.ceil(bareCharsAt(baseWpm, step, totalSteps) * BALANCE.levelTextReserve)
}

/** Предохранитель от нелепого множителя, выставленного в админке. */
const MAX_SIMULATED_WORDS = 200_000

/**
 * Счёт идеальной безошибочной игры на протяжении `chars` знаков.
 *
 * Слова берутся целиком: последнее, которое не влезает, не засчитывается,
 * иначе цель оказалась бы недостижимой ровно на половину слова.
 *
 * Симуляция идёт ПО КРУГУ, если знаков запрошено больше, чем есть в тексте.
 * Это принципиально: цель не имеет права упираться в длину фрагмента. Именно
 * такой потолок раньше останавливал рост сложности на последней десятке
 * узлов. Игроку кружить не придётся - текст уровня собирается под это же
 * число с запасом (см. levelTextCharsAt).
 */
export function perfectScoreThrough(text: string, chars: number): number {
  const words = splitWords(text)
  if (words.length === 0) return 0

  let score = 0
  let mult = BALANCE.multStart
  let typed = 0

  for (let index = 0; index < MAX_SIMULATED_WORDS; index++) {
    const word = words[index % words.length]!
    const length = word.end - word.start

    // Первое слово берём всегда, иначе на коротком тексте цель вышла бы нулевой.
    if (typed + length > chars && typed > 0) break

    score += scoreWord(length * BALANCE.chipsPerChar, mult)
    mult += BALANCE.multPerWord
    typed += length
  }

  return score
}

/** Полный набор чисел для узла забега. */
export function planLevel(
  text: string,
  baseWpm: BaseWpm,
  step: number,
  totalSteps: number,
): LevelPlan {
  return {
    durationMs: levelDurationMs(step, totalSteps),
    targetScore: perfectScoreThrough(text, bareCharsAt(baseWpm, step, totalSteps)),
    requiredWpm: requiredWpm(baseWpm, step, totalSteps),
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
