import { AnimatePresence, motion } from 'motion/react'
import { useGameStore } from './state/gameStore'
import { LevelScreen } from './ui/screens/LevelScreen'
import { MainMenu } from './ui/screens/MainMenu'
import { ResultsScreen } from './ui/screens/ResultsScreen'
import { ShopScreen } from './ui/screens/ShopScreen'

const SCREENS = {
  menu: MainMenu,
  level: LevelScreen,
  results: ResultsScreen,
  shop: ShopScreen,
}

export function App() {
  const screen = useGameStore((state) => state.screen)
  const Screen = SCREENS[screen]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        className="h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Screen />
      </motion.div>
    </AnimatePresence>
  )
}
