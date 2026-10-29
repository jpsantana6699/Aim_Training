import './styles.css'
import { Sfx } from './audio'
import { Engine } from './game/engine'
import { findMode, sessionDuration } from './game/modes'
import type { ModeId, ModeInfo, ModeResult } from './game/types'
import { gradeFor } from './grade'
import { History } from './history'
import { Music } from './music'
import { loadSettings, saveSettings, type Settings } from './settings'
import { browserStore } from './storage'
import { renderHome, setupHome } from './ui/home'
import { renderResults } from './ui/results'
import { setupSettings } from './ui/settings-dialog'

type ScreenName = 'home' | 'play' | 'results'

const RESULTS_KEY_DELAY = 400
const RECENT_COUNT = 15

const store = browserStore()
const history = new History(store)
let settings = loadSettings(store)
const sfx = new Sfx(() => settings.volume)
const music = new Music(() => sfx.context())
let current: ScreenName = 'home'
let lastMode: ModeId = 'gridshot'
let resultsShownAt = 0

const screens: Record<ScreenName, HTMLElement> = {
  home: document.getElementById('home')!,
  play: document.getElementById('play')!,
  results: document.getElementById('results')!,
}

const engine = new Engine(screens.play, {
  settings: () => settings,
  sfx,
  onFinish: showResults,
  onExit: goHome,
})

const settingsDialog = setupSettings(document.getElementById('settings') as HTMLDialogElement, {
  current: () => settings,
  change: next => {
    updateSettings(next)
    renderHome(screens.home, settings, history)
  },
  clearHistory: () => {
    history.clear()
    renderHome(screens.home, settings, history)
  },
})

setupHome(screens.home, {
  play,
  setDuration: duration => {
    updateSettings({ ...settings, duration })
    renderHome(screens.home, settings, history)
  },
  openSettings: () => settingsDialog.open(),
  toggleMusic: () => {
    updateSettings({ ...settings, music: !settings.music })
    renderHome(screens.home, settings, history)
  },
})

window.addEventListener('pointerdown', syncMusic, { once: true })
window.addEventListener('keydown', syncMusic, { once: true })

screens.results.addEventListener('click', event => {
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action
  if (action === 'replay') play(lastMode)
  if (action === 'menu') goHome()
})

window.addEventListener('keydown', event => {
  if (current !== 'results' || event.repeat || performance.now() - resultsShownAt < RESULTS_KEY_DELAY) return
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault()
    play(lastMode)
  }
  if (event.code === 'Escape') goHome()
})

renderHome(screens.home, settings, history)

function show(name: ScreenName) {
  for (const [key, element] of Object.entries(screens)) element.hidden = key !== name
  document.body.dataset.screen = name
  current = name
}

function play(id: ModeId) {
  const info = findMode(id)
  lastMode = id
  sfx.unlock()
  show('play')
  engine.open(info, sessionDuration(info, settings.duration))
}

function goHome() {
  engine.close()
  renderHome(screens.home, settings, history)
  show('home')
}

function showResults(info: ModeInfo, duration: number, result: ModeResult) {
  const grade = gradeFor(result.rating, info.thresholds, info.lowerIsBetter)
  const previousBest = history.best(info.id, duration, info.lowerIsBetter)
  history.add({ modeId: info.id, duration, score: result.score, grade, playedAt: Date.now() })
  engine.close()
  renderResults(screens.results, {
    info,
    duration,
    result,
    grade,
    previousBest,
    recent: history.recent(info.id, duration, RECENT_COUNT),
  })
  resultsShownAt = performance.now()
  show('results')
}

function updateSettings(next: Settings) {
  settings = next
  saveSettings(store, settings)
  music.setVolume(settings.musicVolume)
  syncMusic()
}

function syncMusic() {
  sfx.unlock()
  if (settings.music) music.start(settings.musicVolume)
  else music.stop()
}
