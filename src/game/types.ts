import type { Effects } from './effects'
import type { Renderer } from './renderer'
import type { Sfx } from '../audio'

export type ModeId = 'gridshot' | 'flick' | 'headshot' | 'spidershot' | 'tracking' | 'counterstrafe' | 'reaction'

export interface Vec {
  x: number
  y: number
}

export interface Metric {
  label: string
  value: string
}

export interface ModeResult {
  score: number
  rating: number
  metrics: Metric[]
}

export interface HudState {
  score: string
  detail: string
  timeLeft: number | null
}

export interface ModeContext {
  sfx: Sfx
  fx: Effects
  keys: ReadonlySet<string>
  random: () => number
  now: () => number
  targetColor: () => string
}

export interface Mode {
  start(): void
  update(dt: number, aim: Vec): void
  shoot(aim: Vec): void
  draw(r: Renderer): void
  hud(): HudState
  isFinished(): boolean
  result(): ModeResult
  viewOffset?(): Vec
}

export interface ModeInfo {
  id: ModeId
  name: string
  tagline: string
  description: string
  controls: string[]
  timed: boolean
  usesPointerLock: boolean
  lowerIsBetter: boolean
  unit: 'pts' | '%' | 'ms'
  thresholds: readonly number[]
  create(ctx: ModeContext, duration: number): Mode
}
