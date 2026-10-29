import type { Renderer } from '../renderer'
import type { Mode, ModeContext, Vec } from '../types'
import { Clock, approach, distance, format } from './shared'

const RADIUS = 24
const TARGET_LIMIT = 460
const TARGET_ACCEL = 2600
const BASE_Y = -30

export class Tracking implements Mode {
  private readonly clock: Clock
  private readonly target = { x: 0, y: BASE_Y, vx: 0, direction: 1, speed: 300, switchIn: 0 }
  private onTarget = false
  private timeOnTarget = 0
  private streak = 0
  private bestStreak = 0

  constructor(
    private readonly ctx: ModeContext,
    duration: number,
  ) {
    this.clock = new Clock(duration)
  }

  start() {
    this.planStrafe()
  }

  update(dt: number, aim: Vec) {
    this.clock.update(dt)
    this.moveTarget(dt)
    this.onTarget = distance(aim, this.target) <= RADIUS
    if (!this.onTarget) {
      this.streak = 0
      return
    }
    this.timeOnTarget += dt
    this.streak += dt
    this.bestStreak = Math.max(this.bestStreak, this.streak)
  }

  shoot() {}

  draw(r: Renderer) {
    r.target(this.target, RADIUS, this.ctx.targetColor(), this.onTarget)
  }

  hud() {
    return {
      score: `${format.percent(this.ratio())} na mira`,
      detail: this.onTarget ? 'Na mira' : 'Fora da mira',
      timeLeft: this.clock.left,
    }
  }

  isFinished() {
    return this.clock.finished
  }

  result() {
    const ratio = this.ratio()
    return {
      score: Math.round(ratio * 1000) / 10,
      rating: ratio * 100,
      metrics: [
        { label: 'Tempo na mira', value: format.percent(ratio) },
        { label: 'Maior sequência', value: format.seconds(this.bestStreak) },
        { label: 'Total na mira', value: format.seconds(this.timeOnTarget) },
      ],
    }
  }

  private ratio() {
    return this.clock.elapsed ? this.timeOnTarget / this.clock.elapsed : 0
  }

  private planStrafe() {
    const { target, ctx } = this
    target.direction = -target.direction
    target.switchIn = 0.18 + ctx.random() * 0.75
    target.speed = 220 + ctx.random() * 260
  }

  private moveTarget(dt: number) {
    const { target } = this
    target.switchIn -= dt
    if (target.switchIn <= 0) this.planStrafe()
    if (target.x > TARGET_LIMIT) target.direction = -1
    if (target.x < -TARGET_LIMIT) target.direction = 1
    target.vx = approach(target.vx, target.direction * target.speed, TARGET_ACCEL * dt)
    target.x += target.vx * dt
    const t = this.clock.elapsed
    target.y = BASE_Y + Math.sin(t * 1.3) * 45 + Math.sin(t * 0.37) * 25
  }
}
