import { motion } from 'motion/react'
import { memo, useMemo } from 'react'
import { pageIndexAt, pageStartWord, paginateWords } from '../../core/typing'
import type { WordSegment } from '../../core/typing'

interface TypingTextProps {
  words: readonly WordSegment[]
  cursor: number
  /** Игрок сейчас стоит на неверно нажатой клавише. */
  hasError: boolean
  /** Промах случился внутри окна безопасности и ничего не стоил. */
  safeWindow: boolean
  /**
   * Индексы слов, с которых снято питание, через запятую.
   *
   * Строка, а не массив, намеренно: компонент лежит под memo, а новый массив
   * на каждом кадре ломал бы сравнение пропсов и заставлял бы перерисовывать
   * триста букв шестьдесят раз в секунду.
   */
  blackouts: string
  /**
   * Что ядро дописало за игрока: `поколение:от:до:мс`, пусто - ничего.
   *
   * Поколение нужно, чтобы анимация переигрывалась на каждом новом
   * срабатывании: без него второй подряд дописанный диапазон переиспользовал
   * бы те же узлы и ничего бы не проиграл.
   */
  autofill: string
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
  blackouts,
  autofill,
}: TypingTextProps) {
  const pages = useMemo(() => paginateWords(words, PAGE_CHARS), [words])
  const index = pageIndexAt(pages, cursor)
  const page = pages[index] ?? []

  const dark = useMemo(
    () => new Set(blackouts.split(',').filter(Boolean).map(Number)),
    [blackouts],
  )

  const filled = useMemo(() => parseAutofill(autofill), [autofill])

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
      {page.map((word, offsetOnPage) => {
        // Индекс слова в тексте целиком, а не на странице: ядро нумерует
        // слова сквозным счётом, и страница этого счёта не сдвигает.
        const wordIndex = pageStartWord(pages, index) + offsetOnPage
        const blackout = dark.has(wordIndex)

        return (
          <span key={word.start} className="whitespace-pre">
            {[...word.text].map((char, offset) => {
              const charIndex = word.start + offset
              const state = charState(charIndex, cursor, hasError, safeWindow)
              const self = filled !== null && charIndex >= filled.from && charIndex < filled.to

              return (
                <Char
                  // Ключ с поколением только у дописанных букв: смена ключа
                  // пересоздаёт узел, и анимация играет с начала. У остальных
                  // букв ключ постоянный, иначе страница пересобиралась бы
                  // целиком на каждом срабатывании.
                  key={self ? `${charIndex}-${filled.gen}` : charIndex}
                  char={char}
                  state={state}
                  // Гасится только то, до чего игрок ещё не дошёл. Напечатанное
                  // остаётся видимым: буква, которую он угадал, зажигается.
                  blackout={blackout && charIndex >= cursor}
                  {...(self
                    ? { selfTypedDelayMs: (charIndex - filled.from) * filled.stepMs }
                    : {})}
                />
              )
            })}
          </span>
        )
      })}
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

/**
 * Разбирает строку дописывания. Строка, а не объект, потому что компонент
 * лежит под memo: новый объект на каждом кадре ломал бы сравнение пропсов.
 */
function parseAutofill(
  value: string,
): { gen: number; from: number; to: number; stepMs: number } | null {
  if (!value) return null

  const [gen, from, to, freezeMs] = value.split(':').map(Number)
  if (gen === undefined || from === undefined || to === undefined || freezeMs === undefined) {
    return null
  }
  if (to <= from) return null

  // Шаг равен длине остановки, поделённой на число букв: слово обязано
  // допечататься ровно к тому моменту, когда часы пойдут снова.
  return { gen, from, to, stepMs: freezeMs / (to - from) }
}

function Char({
  char,
  state,
  blackout,
  selfTypedDelayMs,
}: {
  char: string
  state: CharState
  blackout: boolean
  selfTypedDelayMs?: number
}) {
  // Пробел под курсором иначе не виден — подчёркиваем его нижним подчёркиванием.
  const visible = char === ' ' && state !== 'typed' && state !== 'pending' ? '_' : char
  // Метка нужна интерфейсу, чтобы привязать вылетающие очки к позиции курсора.
  const isCursor = state !== 'typed' && state !== 'pending'

  const self = selfTypedDelayMs !== undefined

  return (
    <span
      className={`${charClass(state, blackout)}${self ? ' autofilled' : ''}`}
      data-cursor={isCursor ? '' : undefined}
      {...(self ? { style: { animationDelay: `${selfTypedDelayMs}ms` } } : {})}
    >
      {visible}
    </span>
  )
}

/**
 * Погашенная буква и её исключения.
 *
 * Курсор под гашением остаётся виден, а вот его буква - нет. Без этого игрок
 * теряет не только слово, но и место в тексте, и уже не понимает, сколько
 * ему осталось: гасится текст, а не интерфейс.
 *
 * Промах ПРОЯВЛЯЕТ букву целиком. Это и есть выход из положения: не угадал -
 * плати ошибкой и смотри, что там было написано.
 */
function charClass(state: CharState, blackout: boolean): string {
  if (!blackout) return CLASSES[state]
  if (state === 'error' || state === 'safe') return CLASSES[state]
  if (state === 'current') return 'bg-term text-transparent'
  return `${CLASSES[state]} powerdown`
}
