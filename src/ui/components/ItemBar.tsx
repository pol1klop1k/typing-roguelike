import { useEffect, useRef } from 'react'
import { sfx } from '../../audio/sfx'
import { findItem } from '../../content/items'
import { BALANCE } from '../../core/balance'
import type { ItemStatus, Language } from '../../core/types'

interface ItemBarProps {
  items: readonly string[]
  /** Статусы из среза уровня. Пусто вне уровня — тогда панель просто спокойна. */
  statuses?: readonly ItemStatus[]
  language: Language
  /** В магазине по предмету можно щёлкнуть, чтобы выбросить его из слота. */
  onDrop?: (index: number) => void
}

const LABELS = {
  ru: { slots: 'Предметы', empty: 'слот свободен', drop: 'выбросить' },
  en: { slots: 'Items', empty: 'empty slot', drop: 'discard' },
} as const

/**
 * Панель предметов.
 *
 * Стоит прямо под показателями и над текстом: боковое зрение во время
 * печати дотягивается сюда, не уводя взгляд с курсора. Слотов всегда
 * ровно столько, сколько их есть у игрока, — пустые видны как места,
 * которые ещё можно занять.
 *
 * Панель перерисовывается каждый кадр вместе со срезом уровня, поэтому
 * откат и вспышка считаются прямо из чисел, без собственных анимаций:
 * анимация, живущая отдельно от часов игры, рано или поздно с ними
 * разъезжается.
 */
export function ItemBar({ items, statuses = [], language, onDrop }: ItemBarProps) {
  const labels = LABELS[language]
  const slots = Array.from({ length: BALANCE.inventorySlots }, (_, index) => items[index] ?? null)

  // Звук готовности: ловим переход отката через ноль.
  const wasCoolingDown = useRef<boolean[]>([])
  useEffect(() => {
    statuses.forEach((status, index) => {
      const cooling = status.cooldownLeftMs > 0
      if (wasCoolingDown.current[index] && !cooling) sfx.itemReady()
      wasCoolingDown.current[index] = cooling
    })
  }, [statuses])

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-term-line px-4 py-2">
      <span className="hidden text-[0.65rem] tracking-[0.25em] text-term-muted uppercase sm:inline">
        {labels.slots}
      </span>
      <div className="flex gap-2">
        {slots.map((id, index) =>
          id === null ? (
            <EmptySlot key={`empty-${index}`} label={labels.empty} />
          ) : (
            <FilledSlot
              key={`${id}-${index}`}
              id={id}
              status={statuses[index]}
              language={language}
              dropLabel={labels.drop}
              {...(onDrop ? { onDrop: () => onDrop(index) } : {})}
            />
          ),
        )}
      </div>
    </div>
  )
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div
      title={label}
      className="flex h-11 w-16 items-center justify-center border border-dashed border-term-line/70 text-term-dim sm:w-20"
    >
      <span className="text-xs">+</span>
    </div>
  )
}

function FilledSlot({
  id,
  status,
  language,
  dropLabel,
  onDrop,
}: {
  id: string
  status: ItemStatus | undefined
  language: Language
  dropLabel: string
  onDrop?: () => void
}) {
  const item = findItem(id)
  if (!item) return null

  const text = item.text[language]
  const cooldownLeftMs = status?.cooldownLeftMs ?? 0
  const cooling = cooldownLeftMs > 0

  // Срабатывание: короткая вспышка, затухающая линейно.
  const sinceFired = status?.sinceFiredMs ?? null
  const flash =
    sinceFired !== null && sinceFired < BALANCE.itemFlashMs
      ? 1 - sinceFired / BALANCE.itemFlashMs
      : 0

  const tone = cooldownTone(cooldownLeftMs)
  const progress = status && status.cooldownTotalMs > 0 ? cooldownLeftMs / status.cooldownTotalMs : 0

  return (
    <button
      type="button"
      // Во время уровня слот ничего не делает и не должен перехватывать
      // фокус: весь ввод ловит глобальный обработчик клавиш.
      tabIndex={onDrop ? 0 : -1}
      {...(onDrop ? { onClick: onDrop, title: `${text.name} - ${dropLabel}` } : {})}
      className={`group relative flex h-11 w-16 flex-col items-center justify-center overflow-hidden border sm:w-20 ${
        onDrop ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{ borderColor: tone.border, color: tone.text }}
    >
      {/* Вспышка срабатывания поверх слота. */}
      <span
        className="pointer-events-none absolute inset-0 bg-term-bright"
        style={{ opacity: flash * 0.55 }}
      />

      <span className="glow-soft relative text-sm leading-none font-bold">{item.glyph}</span>
      <span className="relative mt-0.5 max-w-full truncate px-1 text-[0.55rem] tracking-wider text-term-muted uppercase">
        {text.name}
      </span>

      {/* Полоса отката: сколько ещё ждать. */}
      {cooling ? (
        <span
          className="absolute bottom-0 left-0 h-0.5"
          style={{ width: `${progress * 100}%`, backgroundColor: tone.text }}
        />
      ) : null}

      <Tooltip name={text.name} description={text.description} />
    </button>
  )
}

function Tooltip({ name, description }: { name: string; description: string }) {
  return (
    <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 hidden w-56 -translate-x-1/2 border border-term-line bg-term-bg p-2 text-left text-[0.7rem] leading-snug normal-case group-hover:block">
      <span className="block text-term-bright">{name}</span>
      <span className="mt-1 block text-term-muted">{description}</span>
    </span>
  )
}

/**
 * Цвета берутся из тех же токенов темы, что и весь интерфейс (index.css).
 * Продублировать их здесь значением значило бы завести второй источник
 * правды, который рано или поздно разъедется с первым.
 */
const palette = memoizeTokens()

function memoizeTokens() {
  let cache: { ready: { text: string; border: string }; cooling: { text: string; border: string } } | null = null
  return () => {
    if (cache) return cache
    const token = (name: string, fallback: string): string => {
      if (typeof window === 'undefined') return fallback
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      return value || fallback
    }
    const red = token('--color-term-red', '#ff5f56')
    cache = {
      ready: { text: token('--color-term', '#5cff9d'), border: token('--color-term-line', '#123326') },
      cooling: { text: red, border: red },
    }
    return cache
  }
}

/**
 * Цвет иконки по остатку отката.
 *
 * Пока ждать долго — ровный красный. За последние секунды цвет плавно
 * перетекает в обычный зелёный, поэтому момент готовности игрок ловит
 * периферийным зрением, не считая секунды.
 */
function cooldownTone(cooldownLeftMs: number): { text: string; border: string } {
  const { ready, cooling } = palette()
  if (cooldownLeftMs <= 0) return ready
  if (cooldownLeftMs >= BALANCE.cooldownWarnMs) return cooling

  const t = 1 - cooldownLeftMs / BALANCE.cooldownWarnMs
  return {
    text: mixHex(cooling.text, ready.text, t),
    border: mixHex(cooling.border, ready.border, t),
  }
}

function mixHex(from: string, to: string, t: number): string {
  const channel = (offset: number) => {
    const a = Number.parseInt(from.slice(offset, offset + 2), 16)
    const b = Number.parseInt(to.slice(offset, offset + 2), 16)
    return Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}
