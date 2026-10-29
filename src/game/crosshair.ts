import type { Settings } from '../settings'

type Bar = [x: number, y: number, width: number, height: number]

const OUTLINE = 'rgba(0,0,0,0.9)'

export function drawCrosshair(g: CanvasRenderingContext2D, cx: number, cy: number, settings: Settings) {
  const style = settings.crosshairStyle
  if (style === 'cross' || style === 'crossdot') drawBars(g, crossBars(cx, cy, settings, 4), settings)
  if (style === 'tshape') drawBars(g, crossBars(cx, cy, settings, 3), settings)
  if (style === 'plus') drawBars(g, plusBars(cx, cy, settings), settings)
  if (style === 'circle' || style === 'circledot') drawRing(g, cx, cy, settings)
  if (style === 'chevron') drawChevron(g, cx, cy, settings)
  if (style === 'dot' || style === 'crossdot' || style === 'circledot') drawDot(g, cx, cy, settings)
}

function crossBars(cx: number, cy: number, settings: Settings, arms: 3 | 4): Bar[] {
  const { crosshairSize: size, crosshairThickness: t, crosshairGap: gap } = settings
  const half = t / 2
  const bars: Bar[] = [
    [cx - gap - size, cy - half, size, t],
    [cx + gap, cy - half, size, t],
    [cx - half, cy + gap, t, size],
  ]
  if (arms === 4) bars.push([cx - half, cy - gap - size, t, size])
  return bars
}

function plusBars(cx: number, cy: number, settings: Settings): Bar[] {
  const { crosshairSize: size, crosshairThickness: t } = settings
  return [
    [cx - size, cy - t / 2, size * 2, t],
    [cx - t / 2, cy - size, t, size * 2],
  ]
}

function drawBars(g: CanvasRenderingContext2D, bars: Bar[], settings: Settings) {
  if (settings.crosshairOutline) {
    g.fillStyle = OUTLINE
    for (const [x, y, w, h] of bars) g.fillRect(x - 1, y - 1, w + 2, h + 2)
  }
  g.fillStyle = settings.crosshairColor
  for (const [x, y, w, h] of bars) g.fillRect(x, y, w, h)
}

function drawDot(g: CanvasRenderingContext2D, cx: number, cy: number, settings: Settings) {
  const radius = settings.crosshairStyle === 'dot' ? Math.max(1.5, settings.crosshairSize * 0.3) : Math.max(1.5, settings.crosshairThickness)
  g.beginPath()
  g.arc(cx, cy, radius, 0, Math.PI * 2)
  if (settings.crosshairOutline) {
    g.lineWidth = 2
    g.strokeStyle = OUTLINE
    g.stroke()
  }
  g.fillStyle = settings.crosshairColor
  g.fill()
}

function drawRing(g: CanvasRenderingContext2D, cx: number, cy: number, settings: Settings) {
  g.beginPath()
  g.arc(cx, cy, settings.crosshairGap + settings.crosshairSize, 0, Math.PI * 2)
  strokePath(g, settings)
}

function drawChevron(g: CanvasRenderingContext2D, cx: number, cy: number, settings: Settings) {
  const { crosshairSize: size, crosshairGap: gap } = settings
  g.beginPath()
  g.moveTo(cx - size, cy + gap + size)
  g.lineTo(cx, cy + gap)
  g.lineTo(cx + size, cy + gap + size)
  strokePath(g, settings)
}

function strokePath(g: CanvasRenderingContext2D, settings: Settings) {
  g.lineJoin = 'miter'
  if (settings.crosshairOutline) {
    g.lineWidth = settings.crosshairThickness + 2
    g.strokeStyle = OUTLINE
    g.stroke()
  }
  g.lineWidth = settings.crosshairThickness
  g.strokeStyle = settings.crosshairColor
  g.stroke()
}
