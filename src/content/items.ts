/**
 * Предметы. Чистые данные: поведение описано хуками, всё остальное — текст,
 * цена и иконка для магазина.
 *
 * Ядро знает про предмет только id и хуки (см. core/effects.ts). Название и
 * описание живут здесь, потому что это текст для игрока, а не правило игры.
 *
 * Все числа эффектов берутся из balance.ts. Балансить предметы нужно там,
 * а не здесь: здесь описано ЧТО делает предмет, а не НАСКОЛЬКО сильно.
 */
import { BALANCE, type BalanceNumberKey } from '../core/balance'
import type { Modifier } from '../core/effects'
import type { ShopEntry } from '../core/run'
import { RARITY_ORDER, type Language, type Rarity } from '../core/types'
// Импорт со side-эффектом, и порядок здесь принципиален: модуль накладывает
// правки админки на balance.ts, а описания ниже собираются из этих чисел.
import { TUNING } from './tuning'

/**
 * Названия редкостей. Это текст для игрока, поэтому он живёт здесь, а не
 * в ядре: ядро знает только идентификатор.
 *
 * Лестница описывает не ценность вещи, а её отношения с учётом. Мир
 * пересчитан и разложен по ведомостям, и сила предмета ровно в том, какого
 * учёта он избежал.
 */
const RARITY_TEXT_DEFAULT: Readonly<Record<Rarity, Readonly<Record<Language, string>>>> = {
  serial: { ru: 'СЕРИЙНОЕ', en: 'SERIAL' },
  offspec: { ru: 'НЕШТАТНОЕ', en: 'OFF-SPEC' },
  prototype: { ru: 'ОПЫТНОЕ', en: 'PROTOTYPE' },
  classified: { ru: 'ЗАКРЫТОЕ', en: 'CLASSIFIED' },
  unlogged: { ru: 'НЕУЧТЕННОЕ', en: 'UNLOGGED' },
}

export const RARITY_TEXT: Readonly<Record<Rarity, Readonly<Record<Language, string>>>> =
  Object.fromEntries(
    RARITY_ORDER.map((rarity) => [
      rarity,
      { ...RARITY_TEXT_DEFAULT[rarity], ...(TUNING.rarities?.[rarity]?.label ?? {}) },
    ]),
  ) as Record<Rarity, Record<Language, string>>

/**
 * Числовая ручка предмета: ключ в balance.ts и подпись для админки.
 *
 * Предмет объявляет ручки сам, поэтому админка не знает ни одного предмета
 * поимённо и не нуждается в правке, когда появляется новый.
 */
export interface ItemParam {
  readonly key: BalanceNumberKey
  readonly text: Readonly<Record<Language, string>>
  /** Шаг поля ввода. Целые ручки идут по единице, дробные по десятой. */
  readonly step: number
  readonly min: number
}

/**
 * Клетка значка предмета: короткий текст и то, погашен он или ещё нет.
 *
 * Значок нужен предметам, у которых есть своё состояние на уровне. Панель
 * предметов рисует клетки, НЕ зная, что они значат: смысл знает только сам
 * предмет, поэтому он и собирает их из своей памяти.
 */
export interface BadgeCell {
  readonly text: string
  readonly done: boolean
}

export interface ItemDefinition extends ShopEntry {
  readonly id: string
  /** Итоговая цена: своя, если задана, иначе базовая цена редкости. */
  readonly price: number
  readonly rarity: Rarity
  /** Второй экземпляр ничего не даёт — витрина его не предложит. */
  readonly unique?: boolean
  /** Иконка в панели предметов. Ретро-терминал: короткий токен, не картинка. */
  readonly glyph: string
  readonly text: Readonly<Record<Language, { readonly name: string; readonly description: string }>>
  /** Числовые ручки предмета, которые видно в админке. */
  readonly params?: readonly ItemParam[]
  /**
   * Что показать в панели предметов поверх иконки. Память приходит из среза
   * уровня; вне уровня её нет, и значок не рисуется.
   */
  readonly badge?: (memory: Readonly<Record<string, number>>) => readonly BadgeCell[]
  readonly modifier: Modifier
}

/**
 * Предмет, каким он объявлен в коде. Цена необязательна: без неё предмет
 * стоит столько, сколько стоит его ступень редкости.
 */
interface ItemSpec extends Omit<ItemDefinition, 'price'> {
  readonly price?: number
}

/**
 * Алфавиты лотереи. Буквы, и только строчные: знаки препинания и цифры на
 * разных раскладках набираются по-разному, а лотерея обязана быть выполнимой
 * вслепую, без разглядывания клавиатуры.
 */
const LOTTERY_ALPHABET = {
  ru: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
  en: 'abcdefghijklmnopqrstuvwxyz',
} as const

/**
 * Алфавит выбирается по тексту узла, а не по языку интерфейса.
 *
 * Это не придирка: буква чужого алфавита не считается ошибкой вовсе (ядро
 * видит в ней не тот раскладку и не штрафует), поэтому лотерея из русских
 * букв на английском тексте собиралась бы бесплатно и убила бы весь смысл
 * предмета.
 */
function lotteryAlphabet(text: string): string {
  return /[а-яё]/i.test(text) ? LOTTERY_ALPHABET.ru : LOTTERY_ALPHABET.en
}

/** Ключи памяти лотереи: символ под номером и признак, что он зачтён. */
const lotterySymbolKey = (index: number) => `s${index}`
const lotteryDoneKey = (index: number) => `d${index}`

/**
 * Каталог, каким он объявлен в коде, без правок админки. Экспортируется
 * для тестов, которые проверяют замысел, а не текущую настройку.
 */
export const DEFAULT_ITEMS: readonly ItemSpec[] = [
  {
    id: 'falsestart',
    rarity: 'serial',
    glyph: 'x2',
    text: {
      ru: {
        name: 'Фальстарт',
        description: 'Уровень начинается сразу с множителя x2. Второй экземпляр поднимает старт ещё выше.',
      },
      en: {
        name: 'False Start',
        description: 'The level begins at x2 multiplier. A second copy raises the start even higher.',
      },
    },
    params: [
      { key: 'falseStartMult', text: { ru: 'Прибавка к старту', en: 'Start bonus' }, step: 0.5, min: 0 },
    ],
    modifier: {
      id: 'falsestart',
      hooks: {
        onLevelStart: (ctx) => {
          ctx.mult += BALANCE.falseStartMult
          ctx.item.fire()
        },
      },
    },
  },
  {
    id: 'carliccase',
    rarity: 'offspec',
    glyph: 'aA',
    // Второй экземпляр никогда не сработает: первый уже принял нажатие.
    unique: true,
    text: {
      ru: {
        name: 'Регистр',
        description: 'Заглавные буквы можно печатать строчными. Ошибкой это не считается.',
      },
      en: {
        name: 'Careless Case',
        description: 'Capital letters may be typed in lower case. It does not count as a mistake.',
      },
    },
    modifier: {
      id: 'carliccase',
      hooks: {
        onKeyCheck: (ctx) => {
          if (ctx.accepted) return
          // Работает только там, где разница ровно в регистре: подменять
          // букву на соседнюю по клавише предмет не должен.
          const lower = ctx.expected.toLowerCase()
          if (lower === ctx.expected || ctx.key !== lower) return

          ctx.accepted = true
          ctx.item.fire()
        },
      },
    },
  },
  {
    id: 'brutforce',
    price: 6,
    rarity: 'serial',
    glyph: '+++',
    text: {
      ru: {
        name: 'Перебор',
        description: `Каждый верный символ приносит на ${BALANCE.brutForceChips} символов больше.`,
      },
      en: {
        name: 'Brute Force',
        description: `Every correct keystroke is worth ${BALANCE.brutForceChips} more chips.`,
      },
    },
    params: [
      { key: 'brutForceChips', text: { ru: 'Символов за знак', en: 'Chips per keystroke' }, step: 1, min: 0 },
    ],
    modifier: {
      id: 'brutforce',
      hooks: {
        // Пассивный предмет: fire() не вызывает. Подсвечивать то, что
        // срабатывает на каждой букве, значит превратить панель в мигалку.
        onCharCorrect: (ctx) => {
          ctx.chips += BALANCE.brutForceChips
        },
      },
    },
  },
  {
    id: 'secondchance',
    rarity: 'prototype',
    glyph: '2ND',
    text: {
      ru: {
        name: 'Второй шанс',
        description: `Одна ошибка засчитывается как верная буква и не стоит ничего. Откат ${BALANCE.secondChanceCooldownMs / 1000} секунд.`,
      },
      en: {
        name: 'Second Chance',
        description: `One mistake is accepted as the correct letter and costs nothing. Cooldown ${BALANCE.secondChanceCooldownMs / 1000} seconds.`,
      },
    },
    params: [
      { key: 'secondChanceCooldownMs', text: { ru: 'Откат, мс', en: 'Cooldown, ms' }, step: 500, min: 0 },
    ],
    modifier: {
      id: 'secondchance',
      hooks: {
        onCharError: (ctx) => {
          if (ctx.forgiven || !ctx.item.ready) return
          ctx.forgiven = true
          ctx.item.fire(BALANCE.secondChanceCooldownMs)
        },
      },
    },
  },
  {
    id: 'capsgod',
    price: 6,
    rarity: 'offspec',
    glyph: 'CAP',
    text: {
      ru: {
        name: 'CapsGod',
        description:
          `Каждая заглавная, набранная в слове, умножает множитель этого слова на ${BALANCE.capsGodPerCap} за штуку: две заглавные дают x4, три x6. Считается нажатие, а не буква в тексте.`,
      },
      en: {
        name: 'CapsGod',
        description:
          `Every capital typed inside a word multiplies that word multiplier by ${BALANCE.capsGodPerCap} per capital: two capitals give x4, three give x6. It counts the keystroke, not the letter in the text.`,
      },
    },
    params: [
      { key: 'capsGodPerCap', text: { ru: 'Множитель за заглавную', en: 'Multiplier per capital' }, step: 0.5, min: 0 },
    ],
    modifier: {
      id: 'capsgod',
      memory: { caps: 0 },
      hooks: {
        onCharCorrect: (ctx) => {
          // Важно именно нажатие: заглавная, поставленная поверх строчной и
          // прощённая другим предметом, тоже идёт в счёт.
          if (ctx.key === ctx.key.toLowerCase()) return
          ctx.item.memory.caps = (ctx.item.memory.caps ?? 0) + 1
        },
        onScoreCalc: (ctx) => {
          const caps = ctx.item.memory.caps ?? 0
          ctx.item.memory.caps = 0
          if (caps <= 0) return

          ctx.wordMult *= BALANCE.capsGodPerCap * caps
          ctx.item.fire()
        },
      },
    },
  },
  {
    id: 'lowkey',
    rarity: 'offspec',
    // Второй экземпляр никогда не сработает: первый уже принял нажатие.
    unique: true,
    glyph: 'Aa',
    text: {
      ru: {
        name: 'lowkey',
        description: 'Строчные буквы можно печатать в любом регистре. Ошибкой это не считается.',
      },
      en: {
        name: 'lowkey',
        description: 'Lower case letters may be typed in any case. It does not count as a mistake.',
      },
    },
    modifier: {
      id: 'lowkey',
      hooks: {
        onKeyCheck: (ctx) => {
          if (ctx.accepted) return
          // Только для строчных букв: заглавную в тексте всё ещё надо брать
          // точно, иначе предмет отменил бы регистр целиком.
          if (ctx.expected.toUpperCase() === ctx.expected) return
          if (ctx.key.toLowerCase() !== ctx.expected) return

          ctx.accepted = true
          ctx.item.fire()
        },
      },
    },
  },
  {
    id: 'guillotine',
    rarity: 'classified',
    glyph: '1.5/t',
    text: {
      ru: {
        name: 'guillotine',
        description:
          `Множитель слова умножается на ${BALANCE.guillotineNumerator}, делённое на секунды, которые ушли на слово. Быстрее полутора секунд это прибавка, медленнее - урезание.`,
      },
      en: {
        name: 'guillotine',
        description:
          `The word multiplier is multiplied by ${BALANCE.guillotineNumerator} divided by the seconds the word took. Under a second and a half it is a bonus, over it is a cut.`,
      },
    },
    params: [
      { key: 'guillotineNumerator', text: { ru: 'Числитель', en: 'Numerator' }, step: 0.1, min: 0 },
      { key: 'guillotineFloorMs', text: { ru: 'Пол времени слова, мс', en: 'Word time floor, ms' }, step: 10, min: 1 },
    ],
    modifier: {
      id: 'guillotine',
      hooks: {
        onScoreCalc: (ctx) => {
          // Пол по времени нужен арифметике, а не балансу: слово из одного
          // знака закрывается почти мгновенно, и деление ушло бы в бесконечность.
          const seconds = Math.max(ctx.wordElapsedMs, BALANCE.guillotineFloorMs) / 1000
          const factor = BALANCE.guillotineNumerator / seconds
          ctx.wordMult *= factor

          // Ниже единицы предмет не помог, а урезал: вспышка красная.
          ctx.item.fire(0, factor < 1 ? 'harm' : 'plain')
        },
      },
    },
  },
  {
    id: 'freeze',
    rarity: 'unlogged',
    glyph: 'SLOW',
    text: {
      ru: {
        name: 'freeze',
        description:
          `Время уровня течет в ${BALANCE.freezeTimeScale} раза медленнее. Замедляется все разом: таймер, откаты предметов и время слова.`,
      },
      en: {
        name: 'freeze',
        description:
          `Level time runs ${BALANCE.freezeTimeScale} times slower. Everything slows together: the timer, item cooldowns and word timing.`,
      },
    },
    params: [
      { key: 'freezeTimeScale', text: { ru: 'Замедление времени', en: 'Time scale' }, step: 0.05, min: 0.1 },
    ],
    modifier: {
      id: 'freeze',
      hooks: {
        onLevelStart: (ctx) => {
          // Второй экземпляр замедляет ещё раз: 1.2 и 1.2 дают 1.44.
          ctx.timeScale *= BALANCE.freezeTimeScale
          ctx.item.fire()
        },
      },
    },
  },
  {
    id: 'autocomplete',
    rarity: 'unlogged',
    glyph: 'TAB',
    text: {
      ru: {
        name: 'autocomplete',
        description: `Каждый верно набранный символ с шансом ${Math.round(BALANCE.autocompleteChance * 100)}% дописывает слово до конца. Пока слово печатается само, время уровня стоит, а твои нажатия не считаются. Дописанные буквы приносят символы, как будто их напечатали идеально, но в скорость и точность не идут.`,
      },
      en: {
        name: 'autocomplete',
        description: `Every correct keystroke has a ${Math.round(BALANCE.autocompleteChance * 100)}% chance to finish the word for you. While the word types itself the level clock is stopped and your keystrokes do not count. The filled letters pay chips as if typed perfectly, but they do not count towards speed or accuracy.`,
      },
    },
    params: [
      {
        key: 'autocompleteChance',
        text: { ru: 'Шанс на символ', en: 'Chance per keystroke' },
        step: 0.01,
        min: 0,
      },
    ],
    modifier: {
      id: 'autocomplete',
      hooks: {
        onCharCorrect: (ctx) => {
          // На своей же работе предмет молчит. Иначе одно попадание дописало
          // бы слово, каждая дописанная буква бросила бы кубик снова, и текст
          // допечатался бы до конца сам.
          if (ctx.auto) return
          if (ctx.rng.next() >= BALANCE.autocompleteChance) return

          ctx.completeWord = true
          ctx.item.fire()
        },
      },
    },
  },
  {
    id: 'adrenaline',
    rarity: 'classified',
    glyph: 'ADR',
    text: {
      ru: {
        name: 'adrenaline',
        description: `Чем меньше на таймере времени, тем дороже каждый символ. На полном таймере прибавки нет, на нуле символы стоят в ${BALANCE.adrenalineMaxMult} раза больше. Растёт ровно вместе с потраченным временем.`,
      },
      en: {
        name: 'adrenaline',
        description: `The less time on the clock, the more every keystroke is worth. No bonus on a full timer, ${BALANCE.adrenalineMaxMult}x chips at zero. It grows evenly with the time you spend.`,
      },
    },
    params: [
      {
        key: 'adrenalineMaxMult',
        text: { ru: 'Множитель на нуле', en: 'Multiplier at zero' },
        step: 0.5,
        min: 1,
      },
    ],
    modifier: {
      id: 'adrenaline',
      hooks: {
        // Пассивный предмет: fire() не вызывает, как и «Перебор». Работу
        // видно по символам в слове, а мигать на каждой букве незачем.
        onCharCorrect: (ctx) => {
          const total = ctx.snapshot.totalTimeMs
          if (total <= 0) return

          const left = Math.max(0, Math.min(1, ctx.snapshot.timeLeftMs / total))
          const factor = 1 + (BALANCE.adrenalineMaxMult - 1) * (1 - left)
          // Округление не для баланса, а для честного показа: дробные символы
          // в панели «В слове» выглядели бы мусором.
          ctx.chips = Math.round(ctx.chips * factor)
        },
      },
    },
  },
  {
    id: 'lottery',
    rarity: 'classified',
    glyph: '777',
    text: {
      ru: {
        name: 'lottery',
        description: `В начале уровня разыгрывает ${BALANCE.lotterySymbols} случайных букв алфавита. Нажми каждую из них — и счёт вырастет на ${Math.round(BALANCE.lotteryTargetShare * 100)}% от цели узла. Считается само нажатие: буквы, которой нет в тексте, можно добиться ошибкой.`,
      },
      en: {
        name: 'lottery',
        description: `At the level start it draws ${BALANCE.lotterySymbols} random letters of the alphabet. Press every one of them and your score grows by ${Math.round(BALANCE.lotteryTargetShare * 100)}% of the node target. The keystroke is what counts: a letter absent from the text can be claimed with a mistake.`,
      },
    },
    params: [
      {
        key: 'lotterySymbols',
        text: { ru: 'Сколько букв', en: 'Letters drawn' },
        step: 1,
        min: 1,
      },
      {
        key: 'lotteryTargetShare',
        text: { ru: 'Доля цели за сбор', en: 'Share of target' },
        step: 0.05,
        min: 0,
      },
    ],
    badge: (memory) => {
      const cells: BadgeCell[] = []
      for (let index = 0; index < BALANCE.lotterySymbols; index++) {
        const code = memory[lotterySymbolKey(index)]
        if (code === undefined) continue
        cells.push({
          text: String.fromCharCode(code),
          done: memory[lotteryDoneKey(index)] === 1,
        })
      }
      return cells
    },
    modifier: {
      id: 'lottery',
      // Пусто до старта: буквы разыгрываются от сида уровня, а не объявляются
      // в коде. Значок до старта уровня просто ничего не рисует.
      memory: {},
      hooks: {
        onLevelStart: (ctx) => {
          const alphabet = [...lotteryAlphabet(ctx.text)]
          const drawn = ctx.rng.shuffle(alphabet).slice(0, BALANCE.lotterySymbols)

          drawn.forEach((char, index) => {
            ctx.item.memory[lotterySymbolKey(index)] = char.charCodeAt(0)
            ctx.item.memory[lotteryDoneKey(index)] = 0
          })
          ctx.item.fire()
        },
        // Именно onKeyCheck: он единственный видит КАЖДОЕ нажатие - и верное,
        // и промах, и добивку по инерции. Лотерея считает нажатия, а не
        // засчитанные символы, поэтому другие хуки ей не годятся.
        onKeyCheck: (ctx) => {
          if (ctx.item.memory.paid === 1) return

          // Регистр не важен: заставлять игрока помнить про Shift на букве,
          // которую он и так добывает ошибкой, - издевательство.
          const key = ctx.key.toLowerCase()
          let drawn = 0
          let left = 0
          let claimed = false

          for (let index = 0; index < BALANCE.lotterySymbols; index++) {
            const code = ctx.item.memory[lotterySymbolKey(index)]
            if (code === undefined) continue
            drawn++
            if (ctx.item.memory[lotteryDoneKey(index)] === 1) continue

            if (String.fromCharCode(code) === key) {
              ctx.item.memory[lotteryDoneKey(index)] = 1
              claimed = true
            } else {
              left++
            }
          }

          // Нелепое число в наладке не должно дарить счёт за первое нажатие:
          // без разыгранных букв собирать нечего.
          if (drawn === 0) return

          if (left > 0) {
            if (claimed) ctx.item.fire()
            return
          }

          ctx.item.memory.paid = 1
          ctx.bonusScore += Math.round(ctx.snapshot.targetScore * BALANCE.lotteryTargetShare)
          ctx.item.fire()
        },
      },
    },
  },
]

/**
 * Каталог с наложенными правками админки.
 *
 * Порядок внутри важен: сначала редкость, потому что от неё зависит цена.
 */
export const ITEMS: readonly ItemDefinition[] = DEFAULT_ITEMS.map((spec) => {
  const tuning = TUNING.items?.[spec.id]
  const rarity = tuning?.rarity ?? spec.rarity
  const price = tuning?.price ?? spec.price ?? BALANCE.rarityBasePrice[rarity]

  return {
    ...spec,
    rarity,
    price,
    text: {
      ru: mergeText(spec.text.ru, tuning, 'ru'),
      en: mergeText(spec.text.en, tuning, 'en'),
    },
  }
})

function mergeText(
  base: { readonly name: string; readonly description: string },
  tuning: import('./tuning').ItemTuning | undefined,
  language: Language,
): { name: string; description: string } {
  return {
    name: tuning?.name?.[language] ?? base.name,
    description: tuning?.description?.[language] ?? base.description,
  }
}

export function findItem(id: string): ItemDefinition | undefined {
  return ITEMS.find((item) => item.id === id)
}

/** Модификаторы для ядра в том порядке, в каком предметы лежат в инвентаре. */
export function modifiersFor(ids: readonly string[]): Modifier[] {
  return ids.flatMap((id) => {
    const item = findItem(id)
    return item ? [item.modifier] : []
  })
}
