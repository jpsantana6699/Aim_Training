interface Tone {
  from: number
  to: number
  duration: number
  type: OscillatorType
  gain: number
}

export class Sfx {
  private ctx: AudioContext | null = null

  constructor(private readonly volume: () => number) {}

  unlock() {
    try {
      this.ctx ??= new AudioContext()
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch {
      this.ctx = null
    }
  }

  context() {
    return this.ctx
  }

  hit() {
    this.play({ from: 1400, to: 900, duration: 0.06, type: 'triangle', gain: 0.35 })
  }

  miss() {
    this.play({ from: 180, to: 90, duration: 0.07, type: 'sine', gain: 0.25 })
  }

  tick() {
    this.play({ from: 660, to: 660, duration: 0.08, type: 'square', gain: 0.08 })
  }

  go() {
    this.play({ from: 990, to: 1320, duration: 0.14, type: 'square', gain: 0.1 })
  }

  finish() {
    this.play({ from: 520, to: 1040, duration: 0.3, type: 'triangle', gain: 0.3 })
  }

  private play(tone: Tone) {
    const ctx = this.ctx
    const volume = this.volume()
    if (!ctx || volume <= 0) return
    const start = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = tone.type
    osc.frequency.setValueAtTime(tone.from, start)
    osc.frequency.exponentialRampToValueAtTime(tone.to, start + tone.duration)
    gain.gain.setValueAtTime(tone.gain * volume, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + tone.duration + 0.02)
  }
}
