import { gradeClass, type Grade } from '../grade'
import type { RoundRecord } from '../history'
import { formatScore } from '../game/modes'
import type { ModeInfo, ModeResult } from '../game/types'

export interface ResultsView {
  info: ModeInfo
  duration: number
  result: ModeResult
  grade: Grade
  previousBest: RoundRecord | null
  recent: RoundRecord[]
}

export function renderResults(root: HTMLElement, view: ResultsView) {
  const { info, duration, result, grade } = view
  root.innerHTML = `
    <div class="results__card">
      <p class="results__eyebrow">${info.name}${info.timed ? ` · ${duration}s` : ''}</p>
      <div class="results__main">
        <span class="grade grade--big ${gradeClass(grade)}">${grade}</span>
        <div>
          <p class="results__score">${formatScore(info, result.score)}</p>
          ${recordLine(view)}
        </div>
      </div>
      <dl class="results__metrics">
        ${result.metrics.map(metric => `<div><dt>${metric.label}</dt><dd>${metric.value}</dd></div>`).join('')}
      </dl>
      ${sparkline(view)}
      <div class="results__actions">
        <button class="button button--primary" data-action="replay">Jogar de novo <kbd>Espaço</kbd></button>
        <button class="button button--ghost" data-action="menu">Menu <kbd>Esc</kbd></button>
      </div>
    </div>`
}

function recordLine({ info, result, previousBest }: ResultsView) {
  if (!previousBest) return '<p class="results__record results__record--good">Primeiro recorde registrado</p>'
  const delta = result.score - previousBest.score
  const improved = info.lowerIsBetter ? delta < 0 : delta > 0
  if (improved) {
    return `<p class="results__record results__record--good">Novo recorde! Antes: ${formatScore(info, previousBest.score)}</p>`
  }
  const gap = formatScore(info, Math.abs(Math.round(delta * 10) / 10))
  return `<p class="results__record results__record--bad">Recorde: ${formatScore(info, previousBest.score)} · faltou ${gap}</p>`
}

function sparkline({ info, recent }: ResultsView) {
  if (recent.length < 2) return ''
  const width = 320
  const height = 64
  const scores = recent.map(record => record.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1
  const points = scores.map((score, index) => {
    const x = (index / (scores.length - 1)) * (width - 12) + 6
    const normalized = (score - min) / range
    const y = 6 + (info.lowerIsBetter ? normalized : 1 - normalized) * (height - 12)
    return { x, y }
  })
  const last = points[points.length - 1]
  return `
    <figure class="results__trend">
      <figcaption>Últimas ${recent.length} partidas</figcaption>
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${points.map(p => `${p.x},${p.y}`).join(' ')}" />
        <circle cx="${last.x}" cy="${last.y}" r="4" />
      </svg>
    </figure>`
}
