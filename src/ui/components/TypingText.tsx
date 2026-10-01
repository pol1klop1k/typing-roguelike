import { motion } from 'motion/react'
import { memo, useMemo } from 'react'
import { pageIndexAt, paginateWords } from '../../core/typing'
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
 * Сколько знаков показывать за раз.
 *
 * Текст уровня может быть в несколько тысяч знаков: он собирается под
 * требуемый объём работы и с запасом на билды через время. Показывать его
 * целиком нельзя - это и стена, в которой не найти курсор, и несколько
 * тысяч узлов DOM на каждый кадр.
 *
 * Разбивка именно на СТРАНИЦЫ, а не окно, которое ползёт за курсором.
 * Ползущее окно выбрасывало слова спереди, остаток каждый раз
 * переворачивался по-новому, и текст ехал у игрока под пальцами. Читать
 * при этом невозможно: глаз ищет строку заново после каждого слова.
 *
 * Величина подобрана под прежнюю длину фрагмента: примерно столько текста
 * умещалось на экране до того, как уровни стали длинными.
 */
const PAGE_CHARS = 280

/**
 * Текст уровня с посимвольной подсветкой.
 *
 * Слова рендерятся отдельными блоками, поэтому перенос строки никогда
 * не разрывает слово пополам, даже при посимвольной разметке.
 *
 * Показывается одна страница, и она стоит неподвижно, пока игрок не
 * доберётся до её конца. Дойдя, экран моргает, как старый монитор, и
 * страница сменяется - смена подана событием, а не тихой подменой букв.
 *
 * Индексы символов абсолютные (из WordSegment.start), поэтому подсветка и
 * метка курсора работают так же, как при полном рендере.
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
  const pages = useMemo(() => paginateWords(words, PAGE_CHARS), [words])
  const index = pageIndexAt(pages, cursor)
  const page = pages[index] ?? []

  return (
    <motion.div
      // Ключ по номеру страницы: смена страницы пересобирает блок, и
      // вспышка проигрывается ровно один раз, от самой смены.
      key={index}
      className="flex flex-wrap text-xl leading-relaxed sm:text-2xl sm:leading-relaxed"
      initial={{ opacity: 0.06, scaleY: 1.08 }}
      animate={{ opacity: [0.06, 1, 0.3, 1], scaleY: [1.08, 1, 1.02, 1] }}
      transition={{ duration: 0.3, times: [0, 0.35, 0.62, 1], ease: 'linear' }}
    >
      {page.map((word) => (
        <span key={word.start} className="whitespace-pre">
          {[...word.text].map((char, offset) => {
            const charIndex = word.start + offset
            const state = charState(charIndex, cursor, hasError, safeWindow)
            return <Char key={charIndex} char={char} state={state} />
          })}
        </span>
      ))}
    </motion.div>
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
