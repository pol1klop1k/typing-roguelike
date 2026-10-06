import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useGameStore } from './state/gameStore'
import { AdminScreen } from './ui/screens/AdminScreen'
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

/** Адрес наладки. Полноценный роутер ради одного служебного экрана не нужен. */
const ADMIN_HASH = '#admin'

export function App() {
  const screen = useGameStore((state) => state.screen)
  const Screen = SCREENS[screen]
  const admin = useAdminHash()

  // Наладка живёт только в разработке: сохранение пишет файл через
  // дев-сервер, которого в собранной игре нет.
  if (admin && import.meta.env.DEV) return <AdminScreen />

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

/** Следит за адресной строкой, чтобы #admin открывался без перезагрузки. */
function useAdminHash(): boolean {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === ADMIN_HASH)

  useEffect(() => {
    const onHashChange = () => setIsAdmin(window.location.hash === ADMIN_HASH)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return isAdmin
}
