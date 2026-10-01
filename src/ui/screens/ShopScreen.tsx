import { motion } from 'motion/react'
import { useEffect } from 'react'
import { sfx } from '../../audio/sfx'
import { findItem, RARITY_TEXT } from '../../content/items'
import { findText } from '../../content/texts'
import { BALANCE } from '../../core/balance'
import { canAfford, hasFreeSlot } from '../../core/run'
import { useGameStore } from '../../state/gameStore'
import type { Language, Rarity } from '../../core/types'
import { CreditsMeter } from '../components/CreditsMeter'
import { ItemBar } from '../components/ItemBar'
import { TerminalButton } from '../components/TerminalButton'
import { TerminalFrame } from '../components/TerminalFrame'

/**
 * Класс ступени редкости. Сами эффекты лежат в index.css: там же keyframes
 * глитча для неучтённого, которые в Tailwind не выразить.
 */
const RARITY_TONE: Readonly<Record<Rarity, string>> = {
  serial: 'rarity-serial',
  offspec: 'rarity-offspec',
  prototype: 'rarity-prototype',
  classified: 'rarity-classified',
  unlogged: 'rarity-unlogged',
}

const LABELS = {
  ru: {
    title: 'СКЛАД',
    sub: 'Узел взят. Пока сеть пересобирает маршруты, у тебя есть минута на складе.',
    buy: 'Взять',
    noMoney: 'Не хватает',
    noSlot: 'Нет слота',
    reroll: 'Перетряхнуть',
    next: 'Дальше',
    empty: 'СКЛАД ПУСТ',
    emptyHint: 'Брать больше нечего. Уходи.',
    inventoryHint: 'Щёлкни по предмету, чтобы выбросить его и освободить слот.',
    nextLevel: 'Следующий узел',
    hint: 'Enter — дальше, R — перетряхнуть',
  },
  en: {
    title: 'DEPOT',
    sub: 'Node taken. While the network rebuilds its routes, you have a minute in the depot.',
    buy: 'Take',
    noMoney: 'Too expensive',
    noSlot: 'No slot',
    reroll: 'Reroll',
    next: 'Move on',
    empty: 'DEPOT EMPTY',
    emptyHint: 'Nothing left to take. Move on.',
    inventoryHint: 'Click an item to discard it and free the slot.',
    nextLevel: 'Next node',
    hint: 'Enter to move on, R to reroll',
  },
} as const

export function ShopScreen() {
  const run = useGameStore((state) => state.run)
  const language = useGameStore((state) => state.language)
  const buy = useGameStore((state) => state.buy)
  const drop = useGameStore((state) => state.drop)
  const reroll = useGameStore((state) => state.reroll)
  const nextLevel = useGameStore((state) => state.nextLevel)

  const labels = LABELS[language]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      sfx.unlock()
      if (event.key === 'Enter') nextLevel()
      if (event.key === 'r' || event.key === 'R' || event.key === 'к' || event.key === 'К') {
        sfx.reroll()
        reroll()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nextLevel, reroll])

  if (!run) return null

  const nextId = run.levels[run.levelIndex + 1]
  const nextText = nextId ? findText(nextId) : undefined
  const canReroll = canAfford(run, BALANCE.rerollCost)

  return (
    <TerminalFrame
      title="signal // depot"
      right={<CreditsMeter credits={run.credits} language={language} />}
    >
      <ItemBar items={run.items} language={language} onDrop={drop} />

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 sm:px-10">
        <div>
          <h2 className="glow text-2xl tracking-[0.25em] text-term-bright uppercase">{labels.title}</h2>
          <p className="mt-1 text-sm text-term-muted">{labels.sub}</p>
          <p className="mt-1 text-xs text-term-dim">{labels.inventoryHint}</p>
        </div>

        {run.offers.length === 0 ? (
          <div className="border border-term-line px-4 py-8 text-center">
            <p className="text-lg tracking-[0.25em] text-term-muted">{labels.empty}</p>
            <p className="mt-1 text-sm text-term-dim">{labels.emptyHint}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {run.offers.map((id, index) => (
              <OfferCard
                key={id}
                id={id}
                index={index}
                language={language}
                labels={labels}
                affordable={canAffordItem(run.credits, id)}
                roomLeft={hasFreeSlot(run)}
                onBuy={() => {
                  sfx.purchase()
                  buy(id)
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-term-line pt-5">
          <TerminalButton onClick={nextLevel}>
            {nextText ? `${labels.nextLevel}: ${nextText.variants[language].title}` : labels.next}
          </TerminalButton>
          <TerminalButton
            variant="ghost"
            disabled={!canReroll}
            onClick={() => {
              sfx.reroll()
              reroll()
            }}
          >
            {labels.reroll} [-{BALANCE.rerollCost}]
          </TerminalButton>
          <span className="text-xs tracking-widest text-term-dim uppercase">{labels.hint}</span>
        </div>
      </div>
    </TerminalFrame>
  )
}

function canAffordItem(credits: number, id: string): boolean {
  const item = findItem(id)
  return item ? credits >= item.price : false
}

function OfferCard({
  id,
  index,
  language,
  labels,
  affordable,
  roomLeft,
  onBuy,
}: {
  id: string
  index: number
  language: Language
  labels: (typeof LABELS)[Language]
  affordable: boolean
  roomLeft: boolean
  onBuy: () => void
}) {
  const item = findItem(id)
  if (!item) return null

  const text = item.text[language]
  const blocked = !affordable || !roomLeft
  const reason = !roomLeft ? labels.noSlot : !affordable ? labels.noMoney : labels.buy

  return (
    <motion.div
      className={`flex flex-col gap-3 border p-4 ${
        blocked ? 'border-term-line/60 opacity-50' : 'border-term-line hover:border-term'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: blocked ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.2 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="glow-soft text-lg font-bold text-term-bright">{item.glyph}</span>
        <span className="text-sm text-term-amber">{item.price}</span>
      </div>

      <div>
        {/* data-text нужен глитчу: двойники надписи рисуются из него. */}
        <div
          className={`text-[0.65rem] tracking-[0.2em] ${RARITY_TONE[item.rarity]}`}
          data-text={RARITY_TEXT[item.rarity][language]}
        >
          {RARITY_TEXT[item.rarity][language]}
        </div>
        {/* Регистр названия авторский и ломать его uppercase нельзя: lowkey
            пишется строчными, CapsGod - горбом. */}
        <div className="mt-1 text-sm tracking-[0.15em] text-term">{text.name}</div>
        <p className="mt-1 text-xs leading-relaxed text-term-muted">{text.description}</p>
      </div>

      <TerminalButton className="mt-auto" disabled={blocked} onClick={onBuy}>
        {reason}
      </TerminalButton>
    </motion.div>
  )
}
