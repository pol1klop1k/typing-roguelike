/**
 * Наладка: правки баланса, сделанные в админке.
 *
 * Зачем это существует. Балансить игру должен продуктовый менеджер, а не
 * тот, кто умеет править TypeScript. Поэтому цены, редкости, названия и
 * числовые ручки предметов можно менять на экране `#admin`, а сохранение
 * пишет их в tuning.json рядом с этим файлом.
 *
 * Как это устроено. balance.ts и items.ts по-прежнему объявляют ВЕСЬ набор
 * ручек и их значения по умолчанию: tuning.json не заводит новых сущностей,
 * он подставляет другие значения уже объявленным. Если ключа в файле нет,
 * работает значение из кода.
 *
 * Порядок применения важен. Правки накладываются в момент загрузки этого
 * модуля, до того как кто-либо прочитает числа. Поэтому items.ts импортирует
 * tuning.ts, а не наоборот: ES-модули гарантируют, что зависимость
 * выполнится раньше. Тесты получают те же правки через setupFiles
 * в vite.config.ts - иначе набор тестов проверял бы не ту игру, в которую
 * играет человек.
 */
import { overrideBalance, type BalanceNumberKey } from '../core/balance'
import type { Language, Rarity } from '../core/types'
import raw from './tuning.json'

/** Правки одного предмета. Любое поле можно не указывать. */
export interface ItemTuning {
  readonly price?: number
  readonly rarity?: Rarity
  readonly name?: Partial<Record<Language, string>>
  readonly description?: Partial<Record<Language, string>>
}

/** Правки одной ступени редкости. */
export interface RarityTuning {
  readonly weight?: number
  readonly basePrice?: number
  readonly label?: Partial<Record<Language, string>>
}

/** Всё содержимое tuning.json. */
export interface Tuning {
  readonly numbers?: Partial<Record<BalanceNumberKey, number>>
  readonly rarities?: Partial<Record<Rarity, RarityTuning>>
  readonly items?: Readonly<Record<string, ItemTuning>>
}

export const TUNING: Tuning = raw as Tuning

/**
 * Числа баланса уходят в ядро сразу, ещё до сборки списка предметов.
 *
 * Это не просто «пораньше»: описания предметов собираются из чисел баланса
 * прямо в строковых шаблонах. Примени правки позже - и предмет рассказывал
 * бы игроку про старое значение.
 */
overrideBalance({
  numbers: TUNING.numbers ?? {},
  rarityWeights: mapRarities((tuning) => tuning.weight),
  rarityBasePrice: mapRarities((tuning) => tuning.basePrice),
})

/** Собирает из правок редкостей таблицу одного поля, пропуская пустые. */
function mapRarities(pick: (tuning: RarityTuning) => number | undefined): Partial<Record<Rarity, number>> {
  const result: Partial<Record<Rarity, number>> = {}

  for (const [rarity, tuning] of Object.entries(TUNING.rarities ?? {})) {
    const value = pick(tuning)
    if (typeof value === 'number' && Number.isFinite(value)) result[rarity as Rarity] = value
  }

  return result
}
