import { FIELD } from '../renderer'
import { SequenceMode } from './sequence'

const RADIUS = 20
const MARGIN = 60
const MIN_JUMP = 200

export class Flick extends SequenceMode {
  protected next() {
    const point = this.randomPoint(FIELD.width / 2 - MARGIN, FIELD.height / 2 - MARGIN, this.target, MIN_JUMP)
    return { ...point, radius: RADIUS }
  }
}
