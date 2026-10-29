import type { Renderer } from '../renderer'
import type { Metric, Mode, ModeContext, Vec } from '../types'
import { Clock, ShotStats, distance, format } from './shared'

export interface Target extends Vec {
  radius: number
}

export abstract class SequenceMode implements Mode {
  protected readonly clock: Clock
  protected readonly stats = new ShotStats()
  protected target: Target = { x: 0, y: 0, radius: 0 }

  constructor(
    protected readonly ctx: ModeContext,
    duration: number,
  ) {
    this.clock = new Clock(duration)
  }

  protected abstract next(): Target

  start() {
    this.target = this.next()
  }

  update(dt: number, _aim: Vec) {
    this.clock.update(dt)
  }

  shoot(aim: Vec) {
    if (distance(this.target, aim) > this.target.radius) {
      this.miss(aim)
      return
    }
    this.stats.hit(this.clock.elapsed)
    this.ctx.fx.hit(this.target, this.target.radius)
    this.ctx.sfx.hit()
    this.target = this.next()
  }

  draw(r: Renderer) {
    r.target(this.target, this.target.radius, this.ctx.targetColor())
  }

  hud() {
    return {
      score: format.points(this.stats.score()),
      detail: `${format.percent(this.stats.accuracy)} · ${this.stats.hits} acertos`,
      timeLeft: this.clock.left,
    }
  }

  isFinished() {
    return this.clock.finished
  }

  result() {
    return {
      score: this.stats.score(),
      rating: this.stats.rating(this.clock.duration),
      metrics: this.metrics(),
    }
  }

  protected metrics(): Metric[] {
    const { stats } = this
    return [
      { label: 'Acertos', value: String(stats.hits) },
      { label: 'Precisão', value: format.percent(stats.accuracy) },
      { label: 'Tempo médio por alvo', value: format.ms(stats.averageInterval * 1000) },
      { label: 'Erros', value: String(stats.shots - stats.hits) },
    ]
  }

  protected miss(aim: Vec) {
    this.stats.miss()
    this.ctx.fx.miss(aim)
    this.ctx.sfx.miss()
  }

  protected randomPoint(halfWidth: number, halfHeight: number, awayFrom: Vec, minDistance: number): Vec {
    let candidate = { x: 0, y: 0 }
    for (let attempt = 0; attempt < 20; attempt++) {
      candidate = {
        x: (this.ctx.random() * 2 - 1) * halfWidth,
        y: (this.ctx.random() * 2 - 1) * halfHeight,
      }
      if (distance(candidate, awayFrom) >= minDistance) break
    }
    return candidate
  }
}
