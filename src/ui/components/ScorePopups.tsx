import { AnimatePresence, motion } from 'motion/react'
import { comboTier, multTier } from '../intensity'

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

/**
 * Вылетающие очки за засчитанное слово.
 *
 * Появляются вплотную к курсору, а не в углу экрана: во время печати взгляд
 * прикован к текущему символу и ничего за его пределами просто не замечает.
 *
 * Две оси сразу: цвет и свечение показывают множитель, размер и вспышка -
 * комбо. После ошибки цифра остаётся горячей, но теряет размер, и по одному
 * этому видно, что именно случилось.
 */
export function ScorePopups({ popups }: { popups: readonly ScorePopup[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {popups.map((popup) => {
          const tier = comboTier(popup.combo)
          const heat = multTier(popup.mult)
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
              <div className="relative">
                {tier.epic ? <EpicBurst /> : null}

                <motion.div
                  className={`${tier.epic ? 'glow-hot' : heat.glow} text-center leading-none font-bold ${tier.popupSize} ${heat.color}`}
                  animate={
                    tier.epic
                      ? { x: [0, -7, 7, -5, 5, -3, 3, 0], rotate: [0, -3.5, 3.5, -2, 2, -1, 0] }
                      : { x: 0, rotate: 0 }
                  }
                  transition={
                    tier.epic
                      ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0 }
                  }
                >
                  +{popup.gained.toLocaleString('ru-RU')}
                </motion.div>
              </div>

              <div className="mt-1 text-center text-sm tracking-[0.2em] whitespace-nowrap text-term-muted">
                {popup.chips} <span className={heat.color}>x {popup.mult.toFixed(1)}</span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/** Вспышка на верхней ступени комбо: две расходящиеся волны и сияние. */
function EpicBurst() {
  return (
    <>
      <motion.span
        className="pointer-events-none absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-term-amber blur-2xl"
        initial={{ scale: 0.2, opacity: 0.9 }}
        animate={{ scale: 2.8, opacity: 0 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
      <motion.span
        className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-term-amber"
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
      <motion.span
        className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-term-bright"
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 3.2, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.12 }}
      />
    </>
  )
}
