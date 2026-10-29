import { describe, expect, it } from 'vitest'
import { gradeFor } from './grade'
import { History } from './history'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings'
import { memoryStore } from './storage'

describe('gradeFor', () => {
  const thresholds = [90, 80, 70, 60, 50, 40]

  it('maps higher ratings to better grades', () => {
    expect(gradeFor(95, thresholds)).toBe('S+')
    expect(gradeFor(80, thresholds)).toBe('S')
    expect(gradeFor(45, thresholds)).toBe('D')
    expect(gradeFor(10, thresholds)).toBe('F')
  })

  it('supports metrics where lower is better', () => {
    const ms = [170, 195, 225, 260, 300, 360]
    expect(gradeFor(160, ms, true)).toBe('S+')
    expect(gradeFor(240, ms, true)).toBe('B')
    expect(gradeFor(500, ms, true)).toBe('F')
  })
})

describe('History', () => {
  it('keeps bests per mode and duration', () => {
    const history = new History(memoryStore())
    history.add({ modeId: 'gridshot', duration: 30, score: 100, grade: 'C', playedAt: 1 })
    history.add({ modeId: 'gridshot', duration: 30, score: 300, grade: 'A', playedAt: 2 })
    history.add({ modeId: 'gridshot', duration: 60, score: 900, grade: 'S', playedAt: 3 })
    expect(history.best('gridshot', 30, false)?.score).toBe(300)
    expect(history.count('gridshot', 30)).toBe(2)
    expect(history.recent('gridshot', 30, 1)[0].score).toBe(300)
  })

  it('picks the lowest score when lower is better and persists', () => {
    const store = memoryStore()
    const history = new History(store)
    history.add({ modeId: 'reaction', duration: 0, score: 250, grade: 'B', playedAt: 1 })
    history.add({ modeId: 'reaction', duration: 0, score: 210, grade: 'A', playedAt: 2 })
    expect(new History(store).best('reaction', 0, true)?.score).toBe(210)
  })

  it('survives corrupted storage', () => {
    const store = memoryStore()
    store.setItem('aim.history.v1', '{broken')
    expect(new History(store).best('flick', 30, false)).toBeNull()
  })
})

describe('settings', () => {
  it('falls back to defaults and sanitizes saved values', () => {
    const store = memoryStore()
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS)
    saveSettings(store, { ...DEFAULT_SETTINGS, sensitivity: 99, volume: 3, duration: 45 })
    const loaded = loadSettings(store)
    expect(loaded.sensitivity).toBe(10)
    expect(loaded.volume).toBe(1)
    expect(loaded.duration).toBe(DEFAULT_SETTINGS.duration)
  })
})
