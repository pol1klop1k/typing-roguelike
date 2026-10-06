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

/**
 * Режет слова на страницы не длиннее maxChars, по границам слов.
 *
 * Нужно интерфейсу: текст уровня бывает в несколько тысяч знаков, а на
 * экран влезает абзац. Границы страниц НЕ зависят от курсора - страница
 * обязана быть одной и той же, сколько бы раз её ни перерисовали, иначе
 * текст начинает шевелиться под пальцами игрока.
 *
 * Слово длиннее страницы занимает свою страницу целиком: разрывать слово
 * нельзя, иначе игрок не поймёт, что печатает.
 */
export function paginateWords(
  words: readonly WordSegment[],
  maxChars: number,
): WordSegment[][] {
  const pages: WordSegment[][] = []
  let page: WordSegment[] = []
  let chars = 0

  for (const word of words) {
    const length = word.end - word.start
    if (chars > 0 && chars + length > maxChars) {
      pages.push(page)
      page = []
      chars = 0
    }
    page.push(word)
    chars += length
  }
  if (page.length > 0) pages.push(page)

  // Огрызок в конце приклеиваем к предыдущей странице. Смена страницы -
  // это вспышка на весь экран, и разменивать её на восемь знаков глупо.
  const tail = pages[pages.length - 1]
  if (pages.length > 1 && tail && chars < maxChars / 4) {
    pages.pop()
    pages[pages.length - 1]!.push(...tail)
  }

  return pages
}

/**
 * Номер страницы, на которой стоит курсор.
 *
 * Страница сменяется ровно в тот момент, когда курсор уходит за последний
 * её символ, то есть на границе слова. Дописав страницу до конца, игрок
 * попадает на начало следующей.
 */
export function pageIndexAt(pages: readonly WordSegment[][], cursor: number): number {
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index]!
    if (cursor < page[page.length - 1]!.end) return index
  }
  return Math.max(0, pages.length - 1)
}

/** Индекс слова, которому принадлежит символ под курсором. */
/**
 * Сквозной номер первого слова страницы.
 *
 * Нужен показу текста: ядро нумерует слова по всему тексту, а страница знает
 * только свой кусок. Без перевода номеров гашение слова попадало бы не на то
 * слово, стоило игроку перевернуть страницу.
 */
export function pageStartWord(pages: readonly WordSegment[][], pageIndex: number): number {
  let count = 0
  for (let index = 0; index < pageIndex && index < pages.length; index++) {
    count += pages[index]!.length
  }
  return count
}

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
