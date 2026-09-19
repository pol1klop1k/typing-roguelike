import { AnimatePresence, motion } from 'motion/react'

export interface ScorePopup {
  readonly id: number
  readonly gained: number
  readonly chips: number
  readonly mult: number
}

/** Вылетающие очки за засчитанное слово. Главный «праздник» уровня. */
export function ScorePopups({ popups }: { popups: readonly ScorePopup[] }) {
  return (
    <div className="pointer-events-none absolute top-0 right-4 z-30 h-0">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            className="absolute right-0 whitespace-nowrap text-right"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -34, scale: 1 }}
            exit={{ opacity: 0, y: -70, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <div className="glow text-2xl text-term-bright">+{popup.gained.toLocaleString('ru-RU')}</div>
            <div className="text-[0.7rem] tracking-widest text-term-muted">
              {popup.chips} x {popup.mult.toFixed(1)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
