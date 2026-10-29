import type { Renderer } from '../renderer'
import type { Mode, ModeContext, Vec } from '../types'
import { Clock, ShotStats, distance, format } from './shared'

const RADIUS = 34
const SPACING_X = 130
const SPACING_Y = 120
const ACTIVE_TARGETS = 3
const CELLS = Array.from({ length: 9 }, (_, index) => ({
  x: ((index % 3) - 1) * SPACING_X,
  y: (Math.floor(index / 3) - 1) * SPACING_Y,
}))

export class Gridshot implements Mode {
  private readonly clock: Clock
  private readonly stats = new ShotStats()
  private active: number[] = []

  constructor(
    private readonly ctx: ModeContext,
    duration: number,
  ) {
    this.clock = new Clock(duration)
  }

  start() {
    while (this.active.length < ACTIVE_TARGETS) this.active.push(this.freeCell(-1))
  }

  update(dt: number) {
    this.clock.update(dt)
  }

  shoot(aim: Vec) {
    const index = this.active.findIndex(cell => distance(CELLS[cell], aim) <= RADIUS)
    if (index === -1) {
      this.stats.miss()
      this.ctx.fx.miss(aim)
      this.ctx.sfx.miss()
      return
    }
    const cell = this.active[index]
    this.stats.hit(this.clock.elapsed)
    this.ctx.fx.hit(CELLS[cell], RADIUS)
    this.ctx.sfx.hit()
    this.active[index] = this.freeCell(cell)
  }

  draw(r: Renderer) {
    for (const cell of this.active) r.target(CELLS[cell], RADIUS, this.ctx.targetColor())
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
    const { stats, clock } = this
    return {
      score: stats.score(),
      rating: stats.rating(clock.duration),
      metrics: [
        { label: 'Acertos', value: String(stats.hits) },
        { label: 'Precisão', value: format.percent(stats.accuracy) },
        { label: 'Alvos por segundo', value: (stats.hits / clock.duration).toFixed(2).replace('.', ',') },
        { label: 'Tempo médio por alvo', value: format.ms(stats.averageInterval * 1000) },
      ],
    }
  }

  private freeCell(previous: number) {
    const free = CELLS.map((_, index) => index).filter(index => index !== previous && !this.active.includes(index))
    return free[Math.floor(this.ctx.random() * free.length)]
  }
}
