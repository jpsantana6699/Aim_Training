import type { Settings } from '../settings'
import { drawCrosshair } from './crosshair'
import type { Vec } from './types'

export const FIELD = { width: 1200, height: 700 }

export interface View {
  width: number
  height: number
  scale: number
  cam: Vec
}

export function fitScale(width: number, height: number) {
  return Math.min(width / (FIELD.width + 200), height / (FIELD.height + 160))
}

export class Renderer {
  constructor(
    readonly g: CanvasRenderingContext2D,
    readonly view: View,
  ) {}

  toScreen(p: Vec): Vec {
    const { width, height, scale, cam } = this.view
    return { x: (p.x - cam.x) * scale + width / 2, y: (p.y - cam.y) * scale + height / 2 }
  }

  target(p: Vec, radius: number, color: string, highlighted = false) {
    const { g } = this
    const s = this.toScreen(p)
    const r = radius * this.view.scale
    const gradient = g.createRadialGradient(s.x - r * 0.35, s.y - r * 0.35, r * 0.1, s.x, s.y, r)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.25, color)
    gradient.addColorStop(1, shade(color))
    g.beginPath()
    g.arc(s.x, s.y, r, 0, Math.PI * 2)
    g.fillStyle = gradient
    g.shadowColor = color
    g.shadowBlur = highlighted ? 28 : 12
    g.fill()
    g.shadowBlur = 0
    if (highlighted) {
      g.lineWidth = 3
      g.strokeStyle = '#ffffff'
      g.stroke()
    }
  }

  ring(p: Vec, radius: number, color: string, alpha: number, lineWidth = 2) {
    const s = this.toScreen(p)
    this.g.globalAlpha = alpha
    this.g.beginPath()
    this.g.arc(s.x, s.y, radius * this.view.scale, 0, Math.PI * 2)
    this.g.lineWidth = lineWidth
    this.g.strokeStyle = color
    this.g.stroke()
    this.g.globalAlpha = 1
  }

  dot(p: Vec, radius: number, color: string, alpha: number) {
    const s = this.toScreen(p)
    this.g.globalAlpha = alpha
    this.g.beginPath()
    this.g.arc(s.x, s.y, radius, 0, Math.PI * 2)
    this.g.fillStyle = color
    this.g.fill()
    this.g.globalAlpha = 1
  }

  fill(color: string) {
    this.g.fillStyle = color
    this.g.fillRect(0, 0, this.view.width, this.view.height)
  }

  text(lines: { text: string; size: number; color?: string; weight?: number }[]) {
    const { g, view } = this
    const total = lines.reduce((sum, line) => sum + line.size * 1.3, 0)
    let y = view.height / 2 - total / 2
    g.textAlign = 'center'
    g.textBaseline = 'top'
    for (const line of lines) {
      g.font = `${line.weight ?? 700} ${line.size}px Unbounded, system-ui, sans-serif`
      g.fillStyle = line.color ?? '#ffffff'
      g.fillText(line.text, view.width / 2, y)
      y += line.size * 1.3
    }
  }

  background() {
    const { g, view } = this
    g.fillStyle = '#0b0b10'
    g.fillRect(0, 0, view.width, view.height)
    const step = 60
    const extentX = FIELD.width
    const extentY = FIELD.height
    g.lineWidth = 1
    g.strokeStyle = 'rgba(255,255,255,0.045)'
    g.beginPath()
    for (let x = -extentX; x <= extentX; x += step) {
      const a = this.toScreen({ x, y: -extentY })
      const b = this.toScreen({ x, y: extentY })
      g.moveTo(Math.round(a.x) + 0.5, a.y)
      g.lineTo(Math.round(b.x) + 0.5, b.y)
    }
    for (let y = -extentY; y <= extentY; y += step) {
      const a = this.toScreen({ x: -extentX, y })
      const b = this.toScreen({ x: extentX, y })
      g.moveTo(a.x, Math.round(a.y) + 0.5)
      g.lineTo(b.x, Math.round(b.y) + 0.5)
    }
    g.stroke()
    const topLeft = this.toScreen({ x: -FIELD.width / 2, y: -FIELD.height / 2 })
    g.strokeStyle = 'rgba(255,255,255,0.12)'
    g.strokeRect(topLeft.x, topLeft.y, FIELD.width * view.scale, FIELD.height * view.scale)
  }

  block(x: number, y: number, width: number, height: number, fill: string, edge?: string) {
    const { g } = this
    const topLeft = this.toScreen({ x, y })
    const w = width * this.view.scale
    const h = height * this.view.scale
    g.fillStyle = fill
    g.fillRect(topLeft.x, topLeft.y, w, h)
    if (!edge) return
    g.fillStyle = edge
    g.fillRect(topLeft.x, topLeft.y, 3, h)
    g.fillRect(topLeft.x + w - 3, topLeft.y, 3, h)
  }

  ground(y: number) {
    const { g, view } = this
    const screenY = Math.round(this.toScreen({ x: 0, y }).y) + 0.5
    g.strokeStyle = 'rgba(255,255,255,0.18)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(0, screenY)
    g.lineTo(view.width, screenY)
    g.stroke()
  }

  meter(ratio: number, threshold: number) {
    const { g, view } = this
    const width = Math.min(260, view.width * 0.4)
    const x = (view.width - width) / 2
    const y = view.height - 48
    g.fillStyle = 'rgba(255,255,255,0.08)'
    g.fillRect(x, y, width, 8)
    g.fillStyle = ratio <= threshold ? '#3ddc84' : '#ff5c5c'
    g.fillRect(x, y, width * Math.min(1, ratio), 8)
    g.fillStyle = '#ffffff'
    g.fillRect(x + width * threshold - 1, y - 4, 2, 16)
    g.font = '600 12px Montserrat, system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'bottom'
    g.fillStyle = ratio <= threshold ? '#3ddc84' : '#ff9a9a'
    g.fillText(ratio <= threshold ? 'PARADO · tiro preciso' : 'ANDANDO · tiro espalha', view.width / 2, y - 8)
  }

  crosshair(settings: Settings) {
    drawCrosshair(this.g, Math.round(this.view.width / 2), Math.round(this.view.height / 2), settings)
  }
}

function shade(hex: string) {
  const value = parseInt(hex.slice(1), 16)
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * 0.45)
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`
}
