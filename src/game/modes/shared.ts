import type { Vec } from '../types'

export class Clock {
  elapsed = 0

  constructor(readonly duration: number) {}

  update(dt: number) {
    this.elapsed = Math.min(this.duration, this.elapsed + dt)
  }

  get left() {
    return this.duration - this.elapsed
  }

  get finished() {
    return this.elapsed >= this.duration
  }
}

export class ShotStats {
  hits = 0
  shots = 0
  private lastHitAt = 0
  private intervals: number[] = []

  hit(elapsed: number) {
    this.hits += 1
    this.shots += 1
    this.intervals.push(elapsed - this.lastHitAt)
    this.lastHitAt = elapsed
  }

  miss() {
    this.shots += 1
  }

  get accuracy() {
    return this.shots ? this.hits / this.shots : 0
  }

  get averageInterval() {
    return this.intervals.length ? this.intervals.reduce((sum, value) => sum + value, 0) / this.intervals.length : 0
  }

  score() {
    return Math.round(this.hits * 100 * this.accuracy)
  }

  rating(duration: number) {
    return (this.hits / duration) * this.accuracy
  }
}

export function distance(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function approach(current: number, target: number, step: number) {
  if (current < target) return Math.min(target, current + step)
  return Math.max(target, current - step)
}

export const format = {
  points: (value: number) => `${value.toLocaleString('pt-BR')} pts`,
  percent: (ratio: number) => `${Math.round(ratio * 100)}%`,
  ms: (value: number) => `${Math.round(value)} ms`,
  seconds: (value: number) => `${value.toFixed(1).replace('.', ',')}s`,
}
