/**
 * Разбор текста и распознавание нажатий. Чистые функции без состояния.
 */

/** Отрезок текста, который считается одним «словом» для начисления очков.
 *  Пробел после слова принадлежит этому же слову, поэтому очки прилетают
 *  ровно в тот момент, когда игрок нажал пробел. */
export interface WordSegment {
  /** Индекс первого символа слова в тексте. */
  readonly start: number
  /** Индекс за последним символом слова (включая хвостовой пробел). */
  readonly end: number
  readonly text: string
}

/**
 * Режет текст на слова так, что каждый символ принадлежит ровно одному слову.
 * "ко  ты" -> ["ко  ", "ты"]
 */
export function splitWords(text: string): WordSegment[] {
  const words: WordSegment[] = []
  let index = 0

  while (index < text.length) {
    // тело слова
    let end = index
    while (end < text.length && text[end] !== ' ') end++
    // хвостовые пробелы прилипают к слову слева
    while (end < text.length && text[end] === ' ') end++

    words.push({ start: index, end, text: text.slice(index, end) })
    index = end
  }

  return words
}

/** Индекс слова, которому принадлежит символ под курсором. */
export function wordIndexAt(words: readonly WordSegment[], cursor: number): number {
  for (let i = 0; i < words.length; i++) {
    const word = words[i]!
    if (cursor >= word.start && cursor < word.end) return i
  }
  return words.length - 1
}

const CYRILLIC = /^[Ѐ-ӿ]$/
const LATIN = /^[A-Za-z]$/

export type Script = 'cyrillic' | 'latin' | 'other'

export function scriptOf(char: string): Script {
  if (CYRILLIC.test(char)) return 'cyrillic'
  if (LATIN.test(char)) return 'latin'
  return 'other'
}

/**
 * Нажата буква из другого алфавита, чем ожидалось.
 * Почти всегда это значит, что у игрока не та раскладка, а не что он ошибся.
 */
export function isLayoutMismatch(expected: string, pressed: string): boolean {
  const expectedScript = scriptOf(expected)
  const pressedScript = scriptOf(pressed)
  if (expectedScript === 'other' || pressedScript === 'other') return false
  return expectedScript !== pressedScript
}

/**
 * Нажатие вообще является вводом символа?
 * Отсеивает Shift, F5, стрелки и прочее — они не должны считаться ошибкой.
 */
export function isTypableKey(key: string): boolean {
  return [...key].length === 1
}

/**
 * Символы, которые нельзя набрать на обычной клавиатуре одной клавишей.
 * Проверяется тестом: в текстах игры таких символов быть не должно,
 * иначе уровень станет непроходимым.
 */
export const FORBIDDEN_CHARS = ['«', '»', '“', '”', '‘', '’', '—', '–', '…', ' ', '\n', '\t']

export function findForbiddenChars(text: string): string[] {
  return FORBIDDEN_CHARS.filter((char) => text.includes(char))
}
