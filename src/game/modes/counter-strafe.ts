import { FIELD, type Renderer } from '../renderer'
import type { Metric, Vec } from '../types'
import { approach, distance, format } from './shared'
import { SequenceMode, type Target } from './sequence'

const WALL_HALF = 420
const WALL_PARALLAX = 1
const TARGET_RADIUS = 18
const PLAYER_LIMIT = 300
const MAX_SPEED = 250
const ACCEL = 1700
const FRICTION = 700
export const ACCURATE_SPEED = MAX_SPEED * 0.34
const MIN_SPREAD = 30
const EXTRA_SPREAD = 60

export class CounterStrafe extends SequenceMode {
  private readonly player = { x: 0, vx: 0 }
  private side = 1
  private revealedAt: number | null = null
  private peekTimes: number[] = []
  private movingShots = 0

  update(dt: number, aim: Vec) {
    super.update(dt, aim)
    this.movePlayer(dt)
    if (this.revealedAt === null && !this.covered(this.target.x)) this.revealedAt = this.clock.elapsed
  }

  shoot(aim: Vec) {
    const moving = Math.abs(this.player.vx) > ACCURATE_SPEED
    if (moving) this.movingShots += 1
    const shot = moving ? this.spread(aim) : aim
    if (this.covered(shot.x) || distance(this.target, shot) > this.target.radius) {
      this.miss(shot)
      return
    }
    this.peekTimes.push(this.clock.elapsed - (this.revealedAt ?? this.clock.elapsed))
    super.shoot(shot)
  }

  draw(r: Renderer) {
    r.ground(this.target.y + this.target.radius * 8)
    r.target(this.target, this.target.radius, this.ctx.targetColor())
    const wall = this.wallCenter()
    r.block(wall - WALL_HALF, -FIELD.height, WALL_HALF * 2, FIELD.height * 2, '#1b1b25', '#34344a')
    r.meter(Math.abs(this.player.vx) / MAX_SPEED, ACCURATE_SPEED / MAX_SPEED)
  }

  viewOffset() {
    return { x: this.player.x, y: 0 }
  }

  hud() {
    return { ...super.hud(), detail: `Peek ${this.side > 0 ? '→ D' : 'A ←'} · ${format.percent(this.stats.accuracy)}` }
  }

  protected next(): Target {
    this.side = this.ctx.random() < 0.7 ? -this.side : this.side
    this.revealedAt = null
    return {
      x: this.side * (WALL_HALF - 160 + this.ctx.random() * 110),
      y: -70 + this.ctx.random() * 80,
      radius: TARGET_RADIUS,
    }
  }

  protected metrics(): Metric[] {
    const { stats } = this
    const still = stats.shots ? 1 - this.movingShots / stats.shots : 0
    const peek = this.peekTimes.length ? this.peekTimes.reduce((a, b) => a + b, 0) / this.peekTimes.length : 0
    return [
      { label: 'Abates', value: String(stats.hits) },
      { label: 'Precisão', value: format.percent(stats.accuracy) },
      { label: 'Tiros parado', value: format.percent(still) },
      { label: 'Tempo médio após o peek', value: format.ms(peek * 1000) },
    ]
  }

  private movePlayer(dt: number) {
    const { player, ctx } = this
    const input = (ctx.keys.has('KeyD') ? 1 : 0) - (ctx.keys.has('KeyA') ? 1 : 0)
    player.vx = approach(player.vx, input * MAX_SPEED, (input === 0 ? FRICTION : ACCEL) * dt)
    player.x += player.vx * dt
    if (Math.abs(player.x) >= PLAYER_LIMIT) {
      player.x = Math.sign(player.x) * PLAYER_LIMIT
      player.vx = 0
    }
  }

  private wallCenter() {
    return -this.player.x * WALL_PARALLAX
  }

  private covered(x: number) {
    return Math.abs(x - this.wallCenter()) < WALL_HALF
  }

  private spread(aim: Vec): Vec {
    const ratio = Math.abs(this.player.vx) / MAX_SPEED
    const angle = this.ctx.random() * Math.PI * 2
    const size = (MIN_SPREAD + EXTRA_SPREAD * ratio) * Math.sqrt(this.ctx.random())
    return { x: aim.x + Math.cos(angle) * size, y: aim.y + Math.sin(angle) * size }
  }
}
