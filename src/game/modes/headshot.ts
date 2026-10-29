import type { Renderer } from '../renderer'
import type { Vec } from '../types'
import { format } from './shared'
import { SequenceMode, type Target } from './sequence'

const HEAD_LINE = -40
const SPREAD_X = 520
const MIN_JUMP = 160
const NEAR_RADIUS = 17
const FAR_RADIUS = 9

export class Headshot extends SequenceMode {
  private bodyShots = 0

  protected next(): Target {
    const depth = this.ctx.random()
    const radius = FAR_RADIUS + (NEAR_RADIUS - FAR_RADIUS) * depth
    let x = this.target.x
    for (let attempt = 0; attempt < 20 && Math.abs(x - this.target.x) < MIN_JUMP; attempt++) {
      x = (this.ctx.random() * 2 - 1) * SPREAD_X
    }
    return { x, y: HEAD_LINE, radius }
  }

  draw(r: Renderer) {
    const { target } = this
    r.ground(HEAD_LINE)
    const body = bodyOf(target)
    r.block(body.x, body.y, body.width, body.height, '#3a3a48')
    r.target(target, target.radius, this.ctx.targetColor())
  }

  protected miss(aim: Vec) {
    if (insideBody(this.target, aim)) this.bodyShots += 1
    super.miss(aim)
  }

  protected metrics() {
    const { stats } = this
    return [
      { label: 'Headshots', value: String(stats.hits) },
      { label: 'Precisão', value: format.percent(stats.accuracy) },
      { label: 'Tiros no corpo', value: String(this.bodyShots) },
      { label: 'Tempo médio por alvo', value: format.ms(stats.averageInterval * 1000) },
    ]
  }
}

function bodyOf(head: Target) {
  const width = head.radius * 2.6
  return { x: head.x - width / 2, y: head.y + head.radius * 1.1, width, height: head.radius * 7 }
}

function insideBody(head: Target, aim: Vec) {
  const body = bodyOf(head)
  return aim.x >= body.x && aim.x <= body.x + body.width && aim.y >= body.y && aim.y <= body.y + body.height
}
