import { describe, expect, it } from 'vitest'
import { findForbiddenChars, isLayoutMismatch, isTypableKey, splitWords, wordIndexAt } from './typing'

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
