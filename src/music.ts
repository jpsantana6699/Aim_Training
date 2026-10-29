const BPM = 112
const STEP = 60 / BPM / 4
const STEPS_PER_BAR = 16
const LOOKAHEAD = 0.15
const TICK_MS = 25

const CHORDS = [
  { root: 45, tones: [57, 60, 64] },
  { root: 41, tones: [57, 60, 65] },
  { root: 48, tones: [55, 60, 64] },
  { root: 43, tones: [55, 59, 62] },
]

const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 2, 3]

export class Music {
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private timer = 0
  private step = 0
  private nextTime = 0

  constructor(private readonly context: () => AudioContext | null) {}

  get playing() {
    return this.timer !== 0
  }

  start(volume: number) {
    const ctx = this.context()
    if (!ctx || this.playing) return
    this.master = ctx.createGain()
    this.master.gain.setValueAtTime(0, ctx.currentTime)
    this.master.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 1.5)
    this.master.connect(ctx.destination)
    this.noise ??= createNoise(ctx)
    this.step = 0
    this.nextTime = ctx.currentTime + 0.05
    this.timer = window.setInterval(() => this.schedule(ctx), TICK_MS)
  }

  stop() {
    const ctx = this.context()
    window.clearInterval(this.timer)
    this.timer = 0
    if (!ctx || !this.master) return
    const master = this.master
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
    window.setTimeout(() => master.disconnect(), 500)
    this.master = null
  }

  setVolume(volume: number) {
    const ctx = this.context()
    if (ctx && this.master) this.master.gain.setTargetAtTime(volume * 0.5, ctx.currentTime, 0.1)
  }

  private schedule(ctx: AudioContext) {
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(ctx, this.step, this.nextTime)
      this.step += 1
      this.nextTime += STEP
    }
  }

  private playStep(ctx: AudioContext, step: number, time: number) {
    const inBar = step % STEPS_PER_BAR
    const bar = Math.floor(step / STEPS_PER_BAR)
    const chord = CHORDS[bar % CHORDS.length]
    const intro = bar < 2
    if (inBar === 0) this.pad(ctx, chord.tones, time)
    if (inBar % 4 === 0) this.kick(ctx, time)
    if (!intro && (inBar === 4 || inBar === 12)) this.snare(ctx, time)
    if (inBar % 2 === 1) this.hat(ctx, time, inBar % 4 === 3 ? 0.06 : 0.035)
    if (inBar % 2 === 0) this.bass(ctx, chord.root + (inBar % 8 === 6 ? 12 : 0), time)
    if (!intro) this.arp(ctx, arpNote(chord.tones, ARP_PATTERN[inBar]), time, bar % 8 >= 4)
  }

  private voice(ctx: AudioContext, type: OscillatorType, frequency: number, time: number, duration: number, gain: number, cutoff: number) {
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const amp = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, time)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(cutoff, time)
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(gain, time + 0.01)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    osc.connect(filter).connect(amp).connect(this.master!)
    osc.start(time)
    osc.stop(time + duration + 0.05)
  }

  private bass(ctx: AudioContext, note: number, time: number) {
    this.voice(ctx, 'sawtooth', midi(note), time, STEP * 1.8, 0.22, 420)
  }

  private arp(ctx: AudioContext, note: number, time: number, bright: boolean) {
    this.voice(ctx, 'square', midi(note), time, STEP * 0.9, 0.05, bright ? 2600 : 1500)
  }

  private pad(ctx: AudioContext, tones: number[], time: number) {
    const duration = STEP * STEPS_PER_BAR
    for (const tone of tones) this.voice(ctx, 'triangle', midi(tone - 12), time, duration, 0.05, 900)
  }

  private kick(ctx: AudioContext, time: number) {
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12)
    amp.gain.setValueAtTime(0.7, time)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.25)
    osc.connect(amp).connect(this.master!)
    osc.start(time)
    osc.stop(time + 0.3)
  }

  private snare(ctx: AudioContext, time: number) {
    this.noiseHit(ctx, time, 0.18, 0.25, 'bandpass', 1800)
  }

  private hat(ctx: AudioContext, time: number, gain: number) {
    this.noiseHit(ctx, time, 0.04, gain, 'highpass', 7000)
  }

  private noiseHit(ctx: AudioContext, time: number, duration: number, gain: number, type: BiquadFilterType, frequency: number) {
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const amp = ctx.createGain()
    source.buffer = this.noise
    filter.type = type
    filter.frequency.value = frequency
    amp.gain.setValueAtTime(gain, time)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    source.connect(filter).connect(amp).connect(this.master!)
    source.start(time)
    source.stop(time + duration)
  }
}

function arpNote(tones: number[], index: number) {
  return tones[index % tones.length] + (index >= tones.length ? 12 : 0)
}

function midi(note: number) {
  return 440 * 2 ** ((note - 69) / 12)
}

function createNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}
