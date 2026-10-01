/**
 * Наладка: экран, на котором правятся цены, редкости, названия и числа.
 *
 * Открывается по адресу #admin и только в режиме разработки: сохранение
 * пишет файл через дев-сервер, а в собранной игре такого эндпоинта нет.
 *
 * Экран сознательно нарисован как таблица, а не как красивые карточки.
 * Балансировка - это сравнение чисел между собой, и всё, что мешает видеть
 * соседние строки разом, работает против задачи.
 */
import { useMemo, useState } from 'react'
import { BOSSES } from '../../content/bosses'
import { ITEMS, RARITY_TEXT, type ItemParam } from '../../content/items'
import type { Tuning } from '../../content/tuning'
import { BALANCE, type BalanceNumberKey } from '../../core/balance'
import {
  isBossStep,
  rewardAtWith,
  requiredWpmWith,
  type CurveParams,
  type RewardParams,
} from '../../core/difficulty'
import { RARITY_ORDER, type Language, type Rarity } from '../../core/types'
import { TerminalButton } from '../components/TerminalButton'
import { TerminalFrame } from '../components/TerminalFrame'

/**
 * Ручки кривой сложности. Тот же вид, что у ручек предметов, поэтому
 * рисуются тем же кодом.
 *
 * Главная здесь - wpmGrowthPerNode: именно она задаёт крутизну. Остальные
 * определяют, откуда кривая стартует и какой формы получается узел.
 */
const DIFFICULTY_PARAMS: readonly ItemParam[] = [
  {
    key: 'wpmGrowthPerNode',
    text: { ru: 'Множитель за узел', en: 'Growth per node' },
    step: 0.005,
    min: 1,
  },
  {
    key: 'wpmFactorFrom',
    text: { ru: 'Старт, доля от твоей скорости', en: 'Start, share of your speed' },
    step: 0.05,
    min: 0.05,
  },
  { key: 'bossFactor', text: { ru: 'Надбавка боссу', en: 'Boss bonus' }, step: 0.05, min: 1 },
  { key: 'actLength', text: { ru: 'Узлов в акте', en: 'Nodes per act' }, step: 1, min: 1 },
  {
    key: 'levelDurationFromMs',
    text: { ru: 'Таймер первого узла, мс', en: 'First node timer, ms' },
    step: 1_000,
    min: 10_000,
  },
  {
    key: 'levelDurationToMs',
    text: { ru: 'Таймер последнего узла, мс', en: 'Last node timer, ms' },
    step: 1_000,
    min: 10_000,
  },
  {
    key: 'levelTextReserve',
    text: { ru: 'Запас текста', en: 'Text reserve' },
    step: 0.05,
    min: 1,
  },
]

/**
 * Ручки экономики. Первые две задают базу за узел, вторые две - надбавку за
 * запас времени.
 *
 * Надбавка платится по часам уровня: замедление времени приносит деньги.
 * Поэтому потолок здесь не украшение, а предохранитель от билда, который
 * иначе печатал бы кредиты (см. docs/economy.md).
 */
const ECONOMY_PARAMS: readonly ItemParam[] = [
  { key: 'rewardBase', text: { ru: 'База за первый узел', en: 'Base reward' }, step: 1, min: 0 },
  {
    key: 'rewardPerStep',
    text: { ru: 'Прибавка за узел', en: 'Growth per node' },
    step: 0.05,
    min: 0,
  },
  {
    key: 'rewardTimeSecPerCredit',
    text: { ru: 'Секунд запаса за кредит', en: 'Seconds per credit' },
    step: 0.5,
    min: 0,
  },
  {
    key: 'rewardTimeMax',
    text: { ru: 'Потолок надбавки', en: 'Bonus cap' },
    step: 1,
    min: 0,
  },
]

/** Узлы, по которым читается кривая: начало, середины актов и все боссы. */
const PREVIEW_STEPS = [0, 4, 9, 19, 29, 39, 49]

const RARITY_TONE: Readonly<Record<Rarity, string>> = {
  serial: 'rarity-serial',
  offspec: 'rarity-offspec',
  prototype: 'rarity-prototype',
  classified: 'rarity-classified',
  unlogged: 'rarity-unlogged',
}

/** Правки одной редкости в том виде, в каком их держит экран. */
interface RarityDraft {
  weight: number
  basePrice: number
  label: Record<Language, string>
}

/** Правки одного предмета в том виде, в каком их держит экран. */
interface ItemDraft {
  rarity: Rarity
  /** null - цену не задавали, предмет стоит как его редкость. */
  price: number | null
  name: Record<Language, string>
  description: Record<Language, string>
}

type SaveState = 'idle' | 'saving' | 'saved' | 'failed' | 'restored' | 'noBackup'

export function AdminScreen() {
  const [rarities, setRarities] = useState<Record<Rarity, RarityDraft>>(readRarities)
  const [items, setItems] = useState<Record<string, ItemDraft>>(readItems)
  const [numbers, setNumbers] = useState<Record<string, number>>(readNumbers)
  const [save, setSave] = useState<SaveState>('idle')

  /** Кривая по ЧЕРНОВИКУ: превью обязано показывать то, что ещё не сохранено. */
  const curve: CurveParams = {
    wpmFactorFrom: numbers.wpmFactorFrom ?? BALANCE.wpmFactorFrom,
    wpmGrowthPerNode: numbers.wpmGrowthPerNode ?? BALANCE.wpmGrowthPerNode,
    bossFactor: numbers.bossFactor ?? BALANCE.bossFactor,
    actLength: numbers.actLength ?? BALANCE.actLength,
  }

  /** Награда по ЧЕРНОВИКУ, ровно как кривая: превью считается по нему же. */
  const rewardParams: RewardParams = {
    rewardBase: numbers.rewardBase ?? BALANCE.rewardBase,
    rewardPerStep: numbers.rewardPerStep ?? BALANCE.rewardPerStep,
  }
  const rewardCap = numbers.rewardTimeMax ?? BALANCE.rewardTimeMax

  /** Доля ступени на витрине: вес сам по себе ни о чём не говорит. */
  const shares = useMemo(() => {
    const total = ITEMS.reduce((sum, item) => sum + rarities[items[item.id]!.rarity]!.weight, 0)
    const byRarity = {} as Record<Rarity, number>
    for (const rarity of RARITY_ORDER) {
      const count = ITEMS.filter((item) => items[item.id]!.rarity === rarity).length
      byRarity[rarity] = total > 0 ? (count * rarities[rarity]!.weight * 100) / total : 0
    }
    return byRarity
  }, [rarities, items])

  async function onSave() {
    setSave('saving')
    const ok = await writeTuning(buildTuning(rarities, items, numbers))
    setSave(ok ? 'saved' : 'failed')
  }

  async function onReset() {
    setSave('saving')
    const ok = await writeTuning({})
    setSave(ok ? 'saved' : 'failed')
  }

  async function onRestore() {
    setSave('saving')
    setSave((await post('/__tuning/restore')) ? 'restored' : 'noBackup')
  }

  return (
    <TerminalFrame title="signal // tuning" right={`${ITEMS.length} предметов`}>
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-6 sm:px-10">
        <header>
          <h2 className="glow text-2xl tracking-[0.25em] text-term-bright uppercase">НАЛАДКА</h2>
          <p className="mt-1 text-sm text-term-muted">
            Значения сохраняются в src/content/tuning.json и переживают перезапуск. Пустая цена
            означает, что предмет стоит столько же, сколько его ступень.
          </p>
        </header>

        <section>
          <SectionTitle>Сложность</SectionTitle>
          <div className="flex flex-wrap gap-4">
            {DIFFICULTY_PARAMS.map((param) => (
              <Field key={param.key} label={param.text.ru}>
                <NumberInput
                  value={numbers[param.key] ?? 0}
                  min={param.min}
                  step={param.step}
                  onChange={(value) => setNumbers((prev) => ({ ...prev, [param.key]: value }))}
                />
              </Field>
            ))}
          </div>

          <p className="mt-4 mb-2 text-xs text-term-dim">
            Требуемая скорость без предметов. Звёздочка - босс. Таблица считается по числам
            выше, ещё до сохранения: крутилка без неё бесполезна, эффект множителя виден
            только здесь.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <Row header>
                <Cell head>Заявлено</Cell>
                {PREVIEW_STEPS.map((step) => (
                  <Cell key={step} head>
                    {step + 1}
                    {isBossStep(step, BALANCE.runLength, curve.actLength) ? '*' : ''}
                  </Cell>
                ))}
                <Cell head>Стена</Cell>
              </Row>
            </thead>
            <tbody>
              {BALANCE.presets.map((preset) => (
                <Row key={preset}>
                  <Cell>
                    <span className="text-term-bright">{preset} wpm</span>
                  </Cell>
                  {PREVIEW_STEPS.map((step) => (
                    <Cell key={step}>
                      {requiredWpmWith(curve, preset, step, BALANCE.runLength)}
                    </Cell>
                  ))}
                  <Cell>
                    <span className="text-term-muted">узел {wallNode(curve, preset)}</span>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <SectionTitle>Экономика</SectionTitle>
          <div className="flex flex-wrap gap-4">
            {ECONOMY_PARAMS.map((param) => (
              <Field key={param.key} label={param.text.ru}>
                <NumberInput
                  value={numbers[param.key] ?? 0}
                  min={param.min}
                  step={param.step}
                  onChange={(value) => setNumbers((prev) => ({ ...prev, [param.key]: value }))}
                />
              </Field>
            ))}
          </div>

          <p className="mt-4 mb-2 text-xs text-term-dim">
            Сколько платит узел: база - надбавку игрок добирает запасом времени. Считается по
            числам выше, ещё до сохранения.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <Row header>
                <Cell head>Узел</Cell>
                {PREVIEW_STEPS.map((step) => (
                  <Cell key={step} head>
                    {step + 1}
                  </Cell>
                ))}
                <Cell head>За забег</Cell>
              </Row>
            </thead>
            <tbody>
              <Row>
                <Cell>
                  <span className="text-term-bright">кредитов</span>
                </Cell>
                {PREVIEW_STEPS.map((step) => (
                  <Cell key={step}>
                    {rewardAtWith(rewardParams, step)}
                    <span className="text-term-dim">..{rewardAtWith(rewardParams, step) + rewardCap}</span>
                  </Cell>
                ))}
                <Cell>
                  <span className="text-term-muted">{runIncome(rewardParams, rewardCap)}</span>
                </Cell>
              </Row>
            </tbody>
          </table>
        </section>

        <section>
          <SectionTitle>Боссы</SectionTitle>
          {BOSSES.map((boss) => (
            <div key={boss.id} className="mb-4 flex flex-wrap items-end gap-4">
              <Field label="Босс">
                <span className="text-term-bright">{boss.id}</span>
              </Field>
              <Field label="Узел">
                <span className="text-term-bright">{boss.step + 1}</span>
              </Field>
              {(boss.params ?? []).map((param) => (
                <Field key={param.key} label={param.text.ru}>
                  <NumberInput
                    value={numbers[param.key] ?? 0}
                    min={param.min}
                    step={param.step}
                    onChange={(value) => setNumbers((prev) => ({ ...prev, [param.key]: value }))}
                  />
                </Field>
              ))}
            </div>
          ))}
          <p className="text-xs text-term-dim">
            Интервал и длительность гашения равны между собой не случайно: так на экране всегда
            ровно одно погашенное слово. Разведешь числа - появятся секунды, когда текст виден
            целиком.
          </p>
        </section>

        <section>
          <SectionTitle>Ступени редкости</SectionTitle>
          <table className="w-full border-collapse text-sm">
            <thead>
              <Row header>
                <Cell head>Ступень</Cell>
                <Cell head>Название RU</Cell>
                <Cell head>Название EN</Cell>
                <Cell head>Вес</Cell>
                <Cell head>Базовая цена</Cell>
                <Cell head>Доля витрины</Cell>
              </Row>
            </thead>
            <tbody>
              {RARITY_ORDER.map((rarity) => {
                const draft = rarities[rarity]!
                const patch = (next: Partial<RarityDraft>) =>
                  setRarities((prev) => ({ ...prev, [rarity]: { ...prev[rarity]!, ...next } }))

                return (
                  <Row key={rarity}>
                    <Cell>
                      <span className={RARITY_TONE[rarity]} data-text={draft.label.ru}>
                        {draft.label.ru}
                      </span>
                    </Cell>
                    <Cell>
                      <TextInput
                        value={draft.label.ru}
                        onChange={(value) => patch({ label: { ...draft.label, ru: value } })}
                      />
                    </Cell>
                    <Cell>
                      <TextInput
                        value={draft.label.en}
                        onChange={(value) => patch({ label: { ...draft.label, en: value } })}
                      />
                    </Cell>
                    <Cell>
                      <NumberInput
                        value={draft.weight}
                        min={0}
                        step={1}
                        onChange={(weight) => patch({ weight })}
                      />
                    </Cell>
                    <Cell>
                      <NumberInput
                        value={draft.basePrice}
                        min={0}
                        step={1}
                        onChange={(basePrice) => patch({ basePrice })}
                      />
                    </Cell>
                    <Cell>
                      <span className="text-term-muted">{shares[rarity]!.toFixed(1)}%</span>
                    </Cell>
                  </Row>
                )
              })}
            </tbody>
          </table>
        </section>

        <section>
          <SectionTitle>Предметы</SectionTitle>
          <div className="flex flex-col gap-4">
            {ITEMS.map((item) => {
              const draft = items[item.id]!
              const patch = (next: Partial<ItemDraft>) =>
                setItems((prev) => ({ ...prev, [item.id]: { ...prev[item.id]!, ...next } }))

              return (
                <div key={item.id} className="border border-term-line p-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <Field label="Иконка">
                      <span className="glow-soft text-lg font-bold text-term-bright">
                        {item.glyph}
                      </span>
                    </Field>

                    <Field label="Название RU">
                      <TextInput
                        value={draft.name.ru}
                        onChange={(value) => patch({ name: { ...draft.name, ru: value } })}
                      />
                    </Field>

                    <Field label="Название EN">
                      <TextInput
                        value={draft.name.en}
                        onChange={(value) => patch({ name: { ...draft.name, en: value } })}
                      />
                    </Field>

                    <Field label="Редкость">
                      <select
                        value={draft.rarity}
                        onChange={(event) => patch({ rarity: event.target.value as Rarity })}
                        className="border border-term-line bg-term-panel px-2 py-1 text-term outline-none focus:border-term"
                      >
                        {RARITY_ORDER.map((rarity) => (
                          <option key={rarity} value={rarity}>
                            {rarities[rarity]!.label.ru}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label={`Цена (ступень: ${rarities[draft.rarity]!.basePrice})`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draft.price ?? ''}
                          placeholder={String(rarities[draft.rarity]!.basePrice)}
                          onChange={(event) =>
                            patch({
                              price: event.target.value === '' ? null : Number(event.target.value),
                            })
                          }
                          className="w-24 border border-term-line bg-term-panel px-2 py-1 text-term outline-none focus:border-term"
                        />
                        {draft.price !== null ? (
                          <button
                            type="button"
                            onClick={() => patch({ price: null })}
                            className="text-xs text-term-dim underline hover:text-term"
                          >
                            по ступени
                          </button>
                        ) : null}
                      </div>
                    </Field>
                  </div>

                  {item.params?.length ? (
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-term-line pt-3">
                      {item.params.map((param) => (
                        <Field key={param.key} label={param.text.ru}>
                          <NumberInput
                            value={numbers[param.key] ?? 0}
                            min={param.min}
                            step={param.step}
                            onChange={(value) =>
                              setNumbers((prev) => ({ ...prev, [param.key]: value }))
                            }
                          />
                        </Field>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-2 border-t border-term-line pt-3">
                    <Field label="Описание RU">
                      <TextInput
                        wide
                        value={draft.description.ru}
                        onChange={(value) =>
                          patch({ description: { ...draft.description, ru: value } })
                        }
                      />
                    </Field>
                    <Field label="Описание EN">
                      <TextInput
                        wide
                        value={draft.description.en}
                        onChange={(value) =>
                          patch({ description: { ...draft.description, en: value } })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-4 border-t border-term-line bg-term-bg py-4">
          <TerminalButton onClick={() => void onSave()}>Сохранить</TerminalButton>
          <TerminalButton variant="ghost" onClick={() => void onRestore()}>
            Шаг назад
          </TerminalButton>
          <TerminalButton variant="ghost" onClick={() => void onReset()}>
            Сбросить всё к коду
          </TerminalButton>
          <a href="#" className="text-xs tracking-widest text-term-dim uppercase hover:text-term">
            Вернуться в игру
          </a>
          <SaveHint state={save} />
        </div>
      </div>
    </TerminalFrame>
  )
}

function SaveHint({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  if (state === 'saving') return <span className="text-xs text-term-muted">Сохраняю...</span>
  if (state === 'saved') {
    return (
      <span className="text-xs text-term">
        Записано в tuning.json. Страница сейчас перезагрузится сама.
      </span>
    )
  }
  if (state === 'restored') {
    return (
      <span className="text-xs text-term">
        Вернул наладку, какой она была до последнего сохранения.
      </span>
    )
  }
  if (state === 'noBackup') {
    return <span className="text-xs text-term-amber">Возвращать нечего: сохранений ещё не было.</span>
  }
  return (
    <span className="text-xs text-term-red">
      Не записалось. Сохранение работает только в npm run dev.
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-sm tracking-[0.25em] text-term-bright uppercase">{children}</h3>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.65rem] tracking-[0.15em] text-term-dim uppercase">{label}</span>
      {children}
    </label>
  )
}

function Row({ children, header }: { children: React.ReactNode; header?: boolean }) {
  return <tr className={header ? '' : 'border-t border-term-line'}>{children}</tr>
}

function Cell({ children, head }: { children: React.ReactNode; head?: boolean }) {
  const tone = head ? 'text-[0.65rem] tracking-[0.15em] text-term-dim uppercase' : ''
  return <td className={`py-2 pr-4 text-left align-middle ${tone}`}>{children}</td>
}

function TextInput({
  value,
  onChange,
  wide,
}: {
  value: string
  onChange: (value: string) => void
  wide?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`border border-term-line bg-term-panel px-2 py-1 text-term outline-none focus:border-term ${
        wide ? 'w-full min-w-[32rem]' : 'w-40'
      }`}
    />
  )
}

function NumberInput({
  value,
  onChange,
  min,
  step,
}: {
  value: number
  onChange: (value: number) => void
  min: number
  step: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(event) => {
        const next = Number(event.target.value)
        if (Number.isFinite(next)) onChange(next)
      }}
      className="w-28 border border-term-line bg-term-panel px-2 py-1 text-term outline-none focus:border-term"
    />
  )
}

/**
 * Экран читает ДЕЙСТВУЮЩИЕ значения, то есть уже с наложенной наладкой.
 * Поэтому отдельного «что сейчас в файле» держать не нужно: то, что видно,
 * и есть то, что работает.
 */
function readRarities(): Record<Rarity, RarityDraft> {
  return Object.fromEntries(
    RARITY_ORDER.map((rarity) => [
      rarity,
      {
        weight: BALANCE.rarityWeights[rarity],
        basePrice: BALANCE.rarityBasePrice[rarity],
        label: { ...RARITY_TEXT[rarity] },
      },
    ]),
  ) as Record<Rarity, RarityDraft>
}

function readItems(): Record<string, ItemDraft> {
  return Object.fromEntries(
    ITEMS.map((item) => [
      item.id,
      {
        rarity: item.rarity,
        // Цена считается своей только тогда, когда отличается от ступени:
        // иначе смена редкости не утянула бы за собой цену.
        price: item.price === BALANCE.rarityBasePrice[item.rarity] ? null : item.price,
        name: { ru: item.text.ru.name, en: item.text.en.name },
        description: { ru: item.text.ru.description, en: item.text.en.description },
      },
    ]),
  )
}

/**
 * Доход за весь забег: от игры ровно в требование до игры с потолком
 * надбавки на каждом узле. Одна цифра, по которой видно, хватит ли денег на
 * витрину вообще.
 */
function runIncome(params: RewardParams, cap: number): string {
  let low = 0
  for (let step = 0; step < BALANCE.runLength; step++) low += rewardAtWith(params, step)
  return `${low}..${low + cap * BALANCE.runLength}`
}

function readNumbers(): Record<string, number> {
  const keys: BalanceNumberKey[] = [
    ...DIFFICULTY_PARAMS.map((param) => param.key),
    ...ECONOMY_PARAMS.map((param) => param.key),
    ...BOSSES.flatMap((boss) => boss.params?.map((param) => param.key) ?? []),
    ...ITEMS.flatMap((item) => item.params?.map((param) => param.key) ?? []),
  ]
  return Object.fromEntries(keys.map((key) => [key, BALANCE[key] as number]))
}

/**
 * Узел, на котором требование впервые обгоняет заявленную скорость.
 *
 * Считается перебором по той же функции, что рисует таблицу: отдельная
 * формула разошлась бы с кривой при первой же правке.
 */
function wallNode(curve: CurveParams, preset: number): number {
  for (let step = 0; step < BALANCE.runLength; step++) {
    if (requiredWpmWith(curve, preset, step, BALANCE.runLength) >= preset) return step + 1
  }
  return BALANCE.runLength
}

function buildTuning(
  rarities: Record<Rarity, RarityDraft>,
  items: Record<string, ItemDraft>,
  numbers: Record<string, number>,
): Required<Tuning> {
  return {
    numbers: numbers as NonNullable<Tuning['numbers']>,
    rarities: Object.fromEntries(
      RARITY_ORDER.map((rarity) => [
        rarity,
        {
          weight: rarities[rarity]!.weight,
          basePrice: rarities[rarity]!.basePrice,
          label: rarities[rarity]!.label,
        },
      ]),
    ) as NonNullable<Tuning['rarities']>,
    items: Object.fromEntries(
      Object.entries(items).map(([id, draft]) => [
        id,
        {
          rarity: draft.rarity,
          // null не пишем вовсе: отсутствие ключа и значит «по ступени».
          ...(draft.price === null ? {} : { price: draft.price }),
          name: draft.name,
          description: draft.description,
        },
      ]),
    ),
  }
}

async function writeTuning(tuning: Tuning): Promise<boolean> {
  return post('/__tuning', JSON.stringify(tuning))
}

/** Дев-сервер пишет файл сам: браузер в файл не умеет. */
async function post(url: string, body?: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body }),
    })
    return response.ok
  } catch {
    return false
  }
}
