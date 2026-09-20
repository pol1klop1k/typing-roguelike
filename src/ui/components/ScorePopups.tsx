import { AnimatePresence, motion } from 'motion/react'
import type { Language } from '../../core/types'
import { comboTier } from '../comboStyle'

export interface ScorePopup {
  readonly id: number
  readonly gained: number
  readonly chips: number
  readonly mult: number
  readonly combo: number
  /** Координаты курсора внутри области текста в момент начисления. */
  readonly x: number
  readonly y: number
}

const LABELS = { ru: 'комбо', en: 'combo' } as const

/**
 * Вылетающие очки за засчитанное слово.
 *
 * Появляются вплотную к курсору, а не в углу экрана: во время печати взгляд
 * прикован к текущему символу и ничего за его пределами просто не замечает.
 *
 * Размер и цвет суммы растут вместе с комбо, поэтому серия видна боковым
 * зрением, не отвлекая от текста.
 */
export function ScorePopups({
  popups,
  language,
}: {
  popups: readonly ScorePopup[]
  language: Language
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {popups.map((popup) => {
          const tier = comboTier(popup.combo)
          // На первой строке над курсором мало места: подъём ограничен,
          // иначе очки уезжают под верхнюю панель и их не видно.
          const lift = Math.min(64, Math.max(6, popup.y - 6))

          return (
            <motion.div
              key={popup.id}
              className="absolute -translate-x-1/2"
              style={{ left: popup.x, top: popup.y }}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -lift, scale: 1 }}
              exit={{ opacity: 0, y: -lift - 34, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              {tier.level > 0 ? (
                <div className={`text-center text-xs tracking-[0.25em] whitespace-nowrap uppercase ${tier.color}`}>
                  {LABELS[language]} {popup.combo} · {tier.name[language]}
                </div>
              ) : null}

              <div className={`glow text-center leading-none font-bold ${tier.popupSize} ${tier.color}`}>
                +{popup.gained.toLocaleString('ru-RU')}
              </div>

              <div className="mt-1 text-center text-sm tracking-[0.2em] whitespace-nowrap text-term-muted">
                {popup.chips} x {popup.mult.toFixed(1)}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
