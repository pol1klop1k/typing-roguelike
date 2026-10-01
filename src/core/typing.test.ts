import { describe, expect, it } from 'vitest'
import {
  findForbiddenChars,
  isLayoutMismatch,
  isTypableKey,
  pageIndexAt,
  pageStartWord,
  paginateWords,
  splitWords,
  wordIndexAt,
} from './typing'

describe('splitWords', () => {
  it('прикрепляет хвостовой пробел к слову слева', () => {
    expect(splitWords('ab cd').map((w) => w.text)).toEqual(['ab ', 'cd'])
  })

  it('не теряет и не дублирует ни одного символа', () => {
    const text = 'Привет, мир!  Это  тест 42.'
    const words = splitWords(text)
    expect(words.map((w) => w.text).join('')).toBe(text)
    words.forEach((word, index) => {
      expect(word.start).toBe(index === 0 ? 0 : words[index - 1]!.end)
    })
    expect(words.at(-1)!.end).toBe(text.length)
  })

  it('на пустом тексте возвращает пустой список', () => {
    expect(splitWords('')).toEqual([])
  })
})

describe('wordIndexAt', () => {
  it('находит слово, которому принадлежит курсор', () => {
    const words = splitWords('ab cd ef')
    expect(wordIndexAt(words, 0)).toBe(0)
    expect(wordIndexAt(words, 2)).toBe(0) // пробел принадлежит первому слову
    expect(wordIndexAt(words, 3)).toBe(1)
    expect(wordIndexAt(words, 7)).toBe(2)
  })
})

describe('isLayoutMismatch', () => {
  it('ловит латиницу вместо кириллицы и наоборот', () => {
    expect(isLayoutMismatch('п', 'g')).toBe(true)
    expect(isLayoutMismatch('g', 'п')).toBe(true)
  })

  it('не считает обычную опечатку сменой раскладки', () => {
    expect(isLayoutMismatch('п', 'р')).toBe(false)
    expect(isLayoutMismatch('g', 'h')).toBe(false)
  })

  it('не срабатывает на пробелах, цифрах и знаках', () => {
    expect(isLayoutMismatch(' ', 'g')).toBe(false)
    expect(isLayoutMismatch('4', 'g')).toBe(false)
    expect(isLayoutMismatch('п', '.')).toBe(false)
  })
})

describe('isTypableKey', () => {
  it('пропускает символы и отсеивает служебные клавиши', () => {
    expect(isTypableKey('a')).toBe(true)
    expect(isTypableKey('Я')).toBe(true)
    expect(isTypableKey(' ')).toBe(true)
    expect(isTypableKey('Shift')).toBe(false)
    expect(isTypableKey('ArrowLeft')).toBe(false)
    expect(isTypableKey('Backspace')).toBe(false)
  })
})

describe('findForbiddenChars', () => {
  it('находит типографские символы, которые не набрать одной клавишей', () => {
    expect(findForbiddenChars('«цитата»')).toEqual(['«', '»'])
    expect(findForbiddenChars('тире — здесь')).toEqual(['—'])
  })

  it('пропускает обычную клавиатурную пунктуацию', () => {
    expect(findForbiddenChars('Привет, мир! Это - тест 42.')).toEqual([])
  })
})

describe('страницы текста', () => {
  const words = splitWords('раз два три четыре пять шесть')

  it('не превышают заданную длину', () => {
    const pages = paginateWords(words, 10)
    // Исключения ровно два: слово длиннее страницы рвать нельзя, а
    // последняя страница могла впитать короткий хвост.
    for (const page of pages.slice(0, -1)) {
      const chars = page.reduce((sum, word) => sum + (word.end - word.start), 0)
      if (page.length > 1) expect(chars).toBeLessThanOrEqual(10)
    }
  })

  it('приклеивает короткий хвост к предыдущей странице', () => {
    // Смена страницы - вспышка на весь экран, и на огрызок её тратить незачем.
    const pages = paginateWords(splitWords('аааа бббб вввв гггг д'), 10)
    const last = pages[pages.length - 1]!
    const chars = last.reduce((sum, word) => sum + (word.end - word.start), 0)
    expect(chars).toBeGreaterThan(10 / 4)
  })

  it('сохраняют все слова и их порядок', () => {
    expect(paginateWords(words, 10).flat()).toEqual(words)
  })

  it('переводят номер слова страницы в сквозной номер', () => {
    // Показ текста гасит слова по номерам из ядра, а они сквозные. Ошибка
    // здесь погасила бы не то слово сразу после смены страницы.
    const pages = paginateWords(words, 10)
    expect(pageStartWord(pages, 0)).toBe(0)
    for (let index = 1; index < pages.length; index++) {
      expect(pageStartWord(pages, index)).toBe(
        pageStartWord(pages, index - 1) + pages[index - 1]!.length,
      )
    }
    // За последней страницей - все слова текста.
    expect(pageStartWord(pages, pages.length)).toBe(words.length)
  })

  it('не зависят от курсора: страница всегда одна и та же', () => {
    // Иначе текст шевелился бы под пальцами игрока.
    expect(paginateWords(words, 10)).toEqual(paginateWords(words, 10))
  })

  it('дают слову длиннее страницы отдельную страницу, а не рвут его', () => {
    const long = splitWords('коротко невероятноуженевместимоедлинноеслово')
    const pages = paginateWords(long, 8)
    expect(pages.flat()).toEqual(long)
    expect(pages.every((page) => page.length >= 1)).toBe(true)
  })

  it('на пустом тексте не падает', () => {
    expect(paginateWords([], 10)).toEqual([])
    expect(pageIndexAt([], 0)).toBe(0)
  })
})

describe('номер страницы под курсором', () => {
  const words = splitWords('раз два три четыре пять шесть')
  const pages = paginateWords(words, 8)

  it('в начале текста показывает первую страницу', () => {
    expect(pageIndexAt(pages, 0)).toBe(0)
  })

  it('переключается ровно на конце страницы, а не раньше', () => {
    const firstEnd = pages[0]![pages[0]!.length - 1]!.end
    expect(pageIndexAt(pages, firstEnd - 1)).toBe(0)
    expect(pageIndexAt(pages, firstEnd)).toBe(1)
  })

  it('на дописанном тексте остаётся на последней странице', () => {
    const total = words[words.length - 1]!.end
    expect(pageIndexAt(pages, total)).toBe(pages.length - 1)
  })
})
