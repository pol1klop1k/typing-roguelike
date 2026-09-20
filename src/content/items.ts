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
import { BALANCE } from '../core/balance'
import type { Modifier } from '../core/effects'
import type { ShopEntry } from '../core/run'
import type { Language } from '../core/types'

export interface ItemDefinition extends ShopEntry {
  readonly id: string
  readonly price: number
  /** Второй экземпляр ничего не даёт — витрина его не предложит. */
  readonly unique?: boolean
  /** Иконка в панели предметов. Ретро-терминал: короткий токен, не картинка. */
  readonly glyph: string
  readonly text: Readonly<Record<Language, { readonly name: string; readonly description: string }>>
  readonly modifier: Modifier
}

export const ITEMS: readonly ItemDefinition[] = [
  {
    id: 'falsestart',
    price: 3,
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
    price: 5,
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
    price: 8,
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
]

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
