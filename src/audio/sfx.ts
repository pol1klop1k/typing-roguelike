/**
 * Звук игры. Ничего не загружается с диска: все сигналы синтезируются
 * на лету через Web Audio.
 *
 * Для ретро-терминала это не экономия, а точность: нужны пищалки и щелчки,
 * а не студийные сэмплы. Заодно ноль ассетов и ноль вопросов с лицензиями.
 *
 * Браузер не даёт запустить звук до первого действия пользователя, поэтому
 * контекст создаётся лениво и будится через unlock().
 */

type Wave = OscillatorType

class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(enabled ? 0.9 : 0, this.ctx.currentTime, 0.01)
    }
  }

  /** Вызывается по первому клику или нажатию клавиши. */
  unlock(): void {
    const ctx = this.ensureContext()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    if (typeof window === 'undefined') return null

    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null

    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = this.enabled ? 0.9 : 0
    master.connect(ctx.destination)

    // Короткий буфер белого шума для механических щелчков.
    const length = Math.floor(ctx.sampleRate * 0.03)
    const noise = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
    }

    this.ctx = ctx
    this.master = master
    this.noise = noise
    return ctx
  }

  private tone(
    frequency: number,
    durationSec: number,
    options: { wave?: Wave; gain?: number; delaySec?: number; slideTo?: number } = {},
  ): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.master || !this.enabled) return

    const start = ctx.currentTime + (options.delaySec ?? 0)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = options.wave ?? 'square'
    osc.frequency.setValueAtTime(frequency, start)
    if (options.slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(options.slideTo, start + durationSec)
    }

    const peak = options.gain ?? 0.12
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec)

    osc.connect(gain).connect(this.master)
    osc.start(start)
    osc.stop(start + durationSec + 0.02)
  }

  private click(gainValue: number, frequency: number): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.master || !this.noise || !this.enabled) return

    const source = ctx.createBufferSource()
    source.buffer = this.noise

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = 1.2

    const gain = ctx.createGain()
    gain.gain.value = gainValue

    source.connect(filter).connect(gain).connect(this.master)
    source.start()
  }

  /** Обычное нажатие клавиши. Должно быть почти незаметным. */
  key(): void {
    this.click(0.16, 1_600 + Math.random() * 500)
  }

  /** Промах: низкий неприятный зуммер. */
  error(): void {
    this.click(0.3, 320)
    this.tone(150, 0.16, { wave: 'sawtooth', gain: 0.16, slideTo: 90 })
  }

  /**
   * Промах внутри окна безопасности. Слышно, что мимо, но без наказания:
   * глухой щелчок вместо зуммера.
   */
  safeMiss(): void {
    this.click(0.2, 700)
  }

  /** Слово превратилось в очки. Чем выше множитель, тем выше нота. */
  word(mult: number): void {
    const step = Math.min(12, Math.round((mult - 1) / 0.2))
    this.tone(520 * 2 ** (step / 12), 0.09, { wave: 'triangle', gain: 0.1 })
  }

  /** Тик отсчёта 3-2-1. */
  countdown(): void {
    this.tone(620, 0.1, { gain: 0.1 })
  }

  /** Отсчёт закончился, уровень пошёл. */
  go(): void {
    this.tone(980, 0.18, { gain: 0.12 })
  }

  /** Секунда на исходе. */
  lowTime(): void {
    this.tone(1_200, 0.05, { gain: 0.07 })
  }

  win(): void {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      this.tone(freq, 0.22, { wave: 'triangle', gain: 0.13, delaySec: index * 0.09 })
    })
  }

  lose(): void {
    ;[392, 311.13, 233.08].forEach((freq, index) => {
      this.tone(freq, 0.32, { wave: 'sawtooth', gain: 0.11, delaySec: index * 0.14 })
    })
  }
}

export const sfx = new Sfx()
