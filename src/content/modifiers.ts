/**
 * Предметы, эффекты боссов и модификаторы уровней.
 *
 * В прототипе список пуст по договорённости: механики добавляются только
 * после согласования с продуктовым менеджером. Файл существует, чтобы
 * показать форму, в которой они будут появляться, и чтобы ядро уже сейчас
 * умело их принимать.
 *
 * Ниже закомментированы примеры. Это НЕ реализованные фичи, а образцы
 * синтаксиса: ни один из них не включён в игру.
 */
import type { Modifier } from '../core/effects'

export const ACTIVE_MODIFIERS: readonly Modifier[] = []

/*
// Предмет: множитель растёт быстрее.
const overclock: Modifier = {
  id: 'overclock',
  name: 'Разгон',
  description: 'Каждое чистое слово даёт дополнительный множитель.',
  hooks: {
    onWordComplete: (ctx) => {
      if (ctx.cleanWord) ctx.mult += 0.3
    },
  },
}

// Предмет: заглавные буквы дороже.
const shiftKey: Modifier = {
  id: 'shift-key',
  name: 'Верхний регистр',
  description: 'Заглавные буквы приносят втрое больше символов.',
  hooks: {
    onCharCorrect: (ctx) => {
      if (ctx.isUpperCase) ctx.chips *= 3
    },
  },
}

// Предмет: ошибки стоят дешевле.
const shockAbsorber: Modifier = {
  id: 'shock-absorber',
  name: 'Амортизатор',
  description: 'Штраф времени за ошибку уменьшен вдвое.',
  hooks: {
    onTimePenalty: (ctx) => {
      ctx.penaltyMs = Math.round(ctx.penaltyMs / 2)
    },
  },
}

// Босс: ICE не пропускает цифры.
const iceWall: Modifier = {
  id: 'ice-wall',
  name: 'ICE',
  description: 'Цифры не приносят символов.',
  hooks: {
    onCharCorrect: (ctx) => {
      if (ctx.isDigit) ctx.chips = 0
    },
  },
}
*/
