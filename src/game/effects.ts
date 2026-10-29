import type { Renderer } from './renderer'
import type { Vec } from './types'

interface Effect {
  kind: 'hit' | 'miss'
  pos: Vec
  radius: number
  age: number
  life: number
}

export class Effects {
  private items: Effect[] = []

  hit(pos: Vec, radius: number) {
    this.items.push({ kind: 'hit', pos, radius, age: 0, life: 0.25 })
  }

  miss(pos: Vec) {
    this.items.push({ kind: 'miss', pos, radius: 0, age: 0, life: 0.6 })
  }

  update(dt: number) {
    this.items = this.items.filter(item => (item.age += dt) < item.life)
  }

  clear() {
    this.items = []
  }

  draw(r: Renderer) {
    for (const item of this.items) {
      const progress = item.age / item.life
      if (item.kind === 'hit') r.ring(item.pos, item.radius * (1 + progress * 0.8), '#ffffff', 1 - progress, 3)
      else r.dot(item.pos, 3, '#9a9aa8', 1 - progress)
    }
  }
}
