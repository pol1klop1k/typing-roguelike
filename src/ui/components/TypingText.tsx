import { memo } from 'react'
import type { WordSegment } from '../../core/typing'

interface TypingTextProps {
  words: readonly WordSegment[]
  cursor: number
  /** Игрок сейчас стоит на неверно нажатой клавише. */
  hasError: boolean
  /** Промах случился внутри окна безопасности и ничего не стоил. */
  safeWindow: boolean
}

/**
 * Текст уровня с посимвольной подсветкой.
 *
 * Слова рендерятся отдельными блоками, поэтому перенос строки никогда
 * не разрывает слово пополам, даже при посимвольной разметке.
 *
 * memo здесь не украшение: таймер перерисовывает экран каждый кадр,
 * а этот текст должен обновляться только при движении курсора.
 */
export const TypingText = memo(function TypingText({
  words,
  cursor,
  hasError,
  safeWindow,
}: TypingTextProps) {
  return (
    <div className="flex flex-wrap text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">
      {words.map((word) => (
        <span key={word.start} className="whitespace-pre">
          {[...word.text].map((char, offset) => {
            const index = word.start + offset
            const state = charState(index, cursor, hasError, safeWindow)
            return <Char key={index} char={char} state={state} />
          })}
        </span>
      ))}
    </div>
  )
})

type CharState = 'typed' | 'current' | 'error' | 'safe' | 'pending'

function charState(
  index: number,
  cursor: number,
  hasError: boolean,
  safeWindow: boolean,
): CharState {
  if (index < cursor) return 'typed'
  if (index > cursor) return 'pending'
  if (!hasError) return 'current'
  // Жёлтый вместо красного - промах внутри окна ничего не стоил.
  // Цвет объясняет механику без единой строчки текста.
  return safeWindow ? 'safe' : 'error'
}

const CLASSES: Record<CharState, string> = {
  typed: 'text-term-dim',
  pending: 'text-term-muted',
  current: 'bg-term text-term-bg',
  error: 'bg-term-red text-term-bg',
  safe: 'bg-term-amber text-term-bg',
}

function Char({ char, state }: { char: string; state: CharState }) {
  // Пробел под курсором иначе не виден — подчёркиваем его нижним подчёркиванием.
  const visible = char === ' ' && state !== 'typed' && state !== 'pending' ? '_' : char
  // Метка нужна интерфейсу, чтобы привязать вылетающие очки к позиции курсора.
  const isCursor = state !== 'typed' && state !== 'pending'
  return (
    <span className={CLASSES[state]} data-cursor={isCursor ? '' : undefined}>
      {visible}
    </span>
  )
}
