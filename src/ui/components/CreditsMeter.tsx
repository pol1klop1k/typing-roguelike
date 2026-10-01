import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Language } from '../../core/types'

interface CreditsMeterProps {
  credits: number
  language: Language
  /**
   * С какого числа начать накрутку. Нужно экрану итогов: кредиты там уже
   * начислены, а игрок должен увидеть, как счётчик добирает награду.
   */
  countFrom?: number
}

const LABELS = {
  ru: { credits: 'Кредиты' },
  en: { credits: 'Credits' },
} as const

/** Знак кредита. Валюта сети, а не деньги: обезличенный символ из таблицы. */
export const CREDIT_GLYPH = '¤'

/** Сколько длится накрутка счётчика. */
const ROLL_MS = 700

/**
 * Кошелёк игрока в шапке терминала.
 *
 * Стоит на всех экранах забега и всегда на одном месте: кредиты — это то,
 * из чего игрок строит билд, и они не должны появляться только в магазине.
 * Число не подменяется молча, а накручивается: смена суммы — событие, и
 * игрок обязан заметить его, даже если смотрел в другую часть экрана.
 */
export function CreditsMeter({ credits, language, countFrom }: CreditsMeterProps) {
  const shown = useRolling(credits, countFrom ?? credits)

  return (
    <span className="flex items-baseline gap-2">
      <span className="hidden text-[0.7rem] tracking-[0.25em] text-term-dim uppercase sm:inline">
        {LABELS[language].credits}
      </span>
      <motion.span
        // Рывок вешается на итоговую сумму, а не на показанную: иначе он
        // повторялся бы на каждом кадре накрутки.
        key={credits}
        className="glow flex items-baseline gap-1 text-term-amber"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 16 }}
      >
        <span className="text-sm opacity-60">{CREDIT_GLYPH}</span>
        <span className="text-xl leading-none tabular-nums">{shown}</span>
      </motion.span>
    </span>
  )
}

/**
 * Число, которое доезжает до цели за ROLL_MS вместо мгновенной подмены.
 *
 * Считается по реальным часам через requestAnimationFrame, а не пачкой
 * таймеров: накрутка обязана оставаться гладкой на любой частоте кадров.
 */
function useRolling(target: number, from: number): number {
  const [shown, setShown] = useState(from)
  // Ссылка обновляется в теле компонента, чтобы прерванная накрутка
  // продолжалась с того числа, которое игрок видит, а не с начального.
  const shownRef = useRef(from)
  shownRef.current = shown

  useEffect(() => {
    const start = shownRef.current
    if (start === target) return

    let frame = 0
    const startedAt = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - startedAt) / ROLL_MS)
      const eased = 1 - (1 - k) ** 3
      setShown(Math.round(start + (target - start) * eased))
      if (k < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return shown
}
