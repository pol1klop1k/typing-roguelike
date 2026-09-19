import { AnimatePresence, motion } from 'motion/react'

export interface ScorePopup {
  readonly id: number
  readonly gained: number
  readonly chips: number
  readonly mult: number
  /** Координаты курсора внутри области текста в момент начисления. */
  readonly x: number
  readonly y: number
}

/**
 * Вылетающие очки за засчитанное слово.
 *
 * Появляются вплотную к курсору, а не в углу экрана: во время печати взгляд
 * прикован к текущему символу и ничего за его пределами просто не замечает.
 */
export function ScorePopups({ popups }: { popups: readonly ScorePopup[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            className="absolute -translate-x-1/2"
            style={{ left: popup.x, top: popup.y }}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -62, scale: 1 }}
            exit={{ opacity: 0, y: -108, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            <div className="glow text-center text-5xl leading-none font-bold text-term-bright sm:text-6xl">
              +{popup.gained.toLocaleString('ru-RU')}
            </div>
            <div className="mt-1 text-center text-sm tracking-[0.2em] whitespace-nowrap text-term-amber">
              {popup.chips} x {popup.mult.toFixed(1)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
