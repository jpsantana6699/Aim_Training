import { FIELD } from '../renderer'
import { SequenceMode } from './sequence'

const RADIUS = 26
const MARGIN = 70
const MIN_JUMP = 220

export class Spidershot extends SequenceMode {
  private atCenter = false

  protected next() {
    this.atCenter = !this.atCenter
    if (this.atCenter) return { x: 0, y: 0, radius: RADIUS }
    const point = this.randomPoint(FIELD.width / 2 - MARGIN, FIELD.height / 2 - MARGIN, { x: 0, y: 0 }, MIN_JUMP)
    return { ...point, radius: RADIUS }
  }
}
