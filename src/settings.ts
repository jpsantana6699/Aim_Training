import { GAMES, findGame, type SensitivitySource } from './sensitivity'
import { readJson, writeJson, type KeyValueStore } from './storage'

export const CROSSHAIR_STYLES = [
  { id: 'crossdot', label: 'Cruz + ponto' },
  { id: 'cross', label: 'Cruz' },
  { id: 'plus', label: 'Cruz fechada' },
  { id: 'tshape', label: 'T' },
  { id: 'dot', label: 'Ponto' },
  { id: 'circle', label: 'Círculo' },
  { id: 'circledot', label: 'Círculo + ponto' },
  { id: 'chevron', label: 'Chevron' },
] as const

export type CrosshairStyle = (typeof CROSSHAIR_STYLES)[number]['id']

export interface Settings {
  sensitivity: number
  sensitivitySource: SensitivitySource
  gameSensitivity: number
  dpi: number
  crosshairStyle: CrosshairStyle
  crosshairColor: string
  crosshairSize: number
  crosshairThickness: number
  crosshairGap: number
  crosshairOutline: boolean
  targetColor: string
  volume: number
  music: boolean
  musicVolume: number
  duration: number
}

export const DURATIONS = [30, 60] as const

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1,
  sensitivitySource: 'cs2',
  gameSensitivity: 1,
  dpi: 800,
  crosshairStyle: 'crossdot',
  crosshairColor: '#3dff8b',
  crosshairSize: 10,
  crosshairThickness: 2,
  crosshairGap: 4,
  crosshairOutline: true,
  targetColor: '#ff3b3b',
  volume: 0.6,
  music: false,
  musicVolume: 0.35,
  duration: 60,
}

const KEY = 'aim.settings.v1'

export function loadSettings(store: KeyValueStore): Settings {
  const saved = readJson<Partial<Settings>>(store, KEY) ?? {}
  const merged = { ...DEFAULT_SETTINGS, ...saved }
  return {
    ...merged,
    sensitivity: clamp(Number(merged.sensitivity) || DEFAULT_SETTINGS.sensitivity, 0.05, 10),
    sensitivitySource:
      merged.sensitivitySource === 'custom' || GAMES.some(game => game.id === merged.sensitivitySource)
        ? merged.sensitivitySource
        : DEFAULT_SETTINGS.sensitivitySource,
    gameSensitivity: clamp(Number(merged.gameSensitivity) || DEFAULT_SETTINGS.gameSensitivity, 0.01, 100),
    dpi: clamp(Math.round(Number(merged.dpi) || DEFAULT_SETTINGS.dpi), 100, 32000),
    crosshairStyle: CROSSHAIR_STYLES.some(style => style.id === merged.crosshairStyle)
      ? merged.crosshairStyle
      : DEFAULT_SETTINGS.crosshairStyle,
    crosshairSize: clamp(Number(merged.crosshairSize) || DEFAULT_SETTINGS.crosshairSize, 2, 30),
    crosshairThickness: clamp(Number(merged.crosshairThickness) || DEFAULT_SETTINGS.crosshairThickness, 1, 6),
    crosshairGap: clamp(numberOr(merged.crosshairGap, DEFAULT_SETTINGS.crosshairGap), 0, 20),
    crosshairOutline: Boolean(merged.crosshairOutline),
    volume: clamp(numberOr(merged.volume, DEFAULT_SETTINGS.volume), 0, 1),
    music: Boolean(merged.music),
    musicVolume: clamp(numberOr(merged.musicVolume, DEFAULT_SETTINGS.musicVolume), 0, 1),
    duration: (DURATIONS as readonly number[]).includes(merged.duration) ? merged.duration : DEFAULT_SETTINGS.duration,
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings) {
  writeJson(store, KEY, settings)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function numberOr(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function sensitivityProfile(settings: Settings) {
  return {
    source: settings.sensitivitySource,
    custom: settings.sensitivity,
    game: settings.gameSensitivity,
    dpi: settings.dpi,
  }
}

export function sensitivityLabel(settings: Settings) {
  const game = findGame(settings.sensitivitySource)
  const value = (game ? settings.gameSensitivity : settings.sensitivity).toLocaleString('pt-BR')
  return `${game ? game.short : 'Personalizada'} ${value}`
}
