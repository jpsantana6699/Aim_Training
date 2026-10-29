import { gradeClass } from '../grade'
import type { History } from '../history'
import { MODES, formatScore, sessionDuration } from '../game/modes'
import type { ModeId } from '../game/types'
import { DURATIONS, sensitivityLabel, type Settings } from '../settings'
import { GEAR_ICON, MODE_ICONS, MUSIC_ICON } from './icons'

export interface HomeActions {
  play(id: ModeId): void
  setDuration(duration: number): void
  openSettings(): void
  toggleMusic(): void
}

export function setupHome(root: HTMLElement, actions: HomeActions) {
  root.querySelector('[data-open-settings]')!.innerHTML = GEAR_ICON
  root.querySelector('[data-open-settings]')!.addEventListener('click', actions.openSettings)
  root.querySelector('[data-sens-chip]')!.addEventListener('click', actions.openSettings)
  root.querySelector('[data-toggle-music]')!.innerHTML = MUSIC_ICON
  root.querySelector('[data-toggle-music]')!.addEventListener('click', actions.toggleMusic)
  root.querySelector('[data-touch-notice]')!.toggleAttribute('hidden', !matchMedia('(pointer: coarse)').matches)
  root.querySelector('[data-modes]')!.addEventListener('click', event => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-mode]')
    if (card) actions.play(card.dataset.mode as ModeId)
  })
  root.querySelector('[data-durations]')!.addEventListener('click', event => {
    const option = (event.target as HTMLElement).closest<HTMLElement>('[data-duration]')
    if (option) actions.setDuration(Number(option.dataset.duration))
  })
}

export function renderHome(root: HTMLElement, settings: Settings, history: History) {
  root.querySelector('[data-toggle-music]')!.setAttribute('aria-pressed', String(settings.music))
  root.querySelector('[data-sens-chip]')!.innerHTML = `Sensi <b>${sensitivityLabel(settings)}</b> · trocar`
  root.querySelector('[data-durations]')!.innerHTML = DURATIONS.map(
    duration => `
      <button class="segmented__option" role="radio" data-duration="${duration}" aria-checked="${duration === settings.duration}">
        ${duration}s
      </button>`,
  ).join('')
  root.querySelector('[data-modes]')!.innerHTML = MODES.map(info => {
    const duration = sessionDuration(info, settings.duration)
    const best = history.best(info.id, duration, info.lowerIsBetter)
    const plays = history.count(info.id, duration)
    const record = best
      ? `<span class="grade ${gradeClass(best.grade)}">${best.grade}</span><span>Recorde <b>${formatScore(info, best.score)}</b></span>`
      : '<span class="mode-card__empty">Sem recorde ainda</span>'
    return `
      <button class="mode-card" data-mode="${info.id}">
        <span class="mode-card__icon">${MODE_ICONS[info.id]}</span>
        <span class="mode-card__name">${info.name}</span>
        <span class="mode-card__tagline">${info.tagline}</span>
        <span class="mode-card__record">${record}</span>
        <span class="mode-card__footer">
          <span>${info.timed ? `${duration}s` : '5 rodadas'}${plays ? ` · ${plays} ${plays === 1 ? 'partida' : 'partidas'}` : ''}</span>
          <span class="mode-card__play">Jogar →</span>
        </span>
      </button>`
  }).join('')
}
