import { describe, expect, it } from 'vitest'
import { cmPer360, convertSensitivity, pixelsPerCount } from './sensitivity'

describe('sensitivity', () => {
  it('matches known cm/360 values', () => {
    expect(cmPer360({ source: 'cs2', custom: 1, game: 1, dpi: 800 })).toBeCloseTo(51.95, 1)
    expect(cmPer360({ source: 'valorant', custom: 1, game: 0.4, dpi: 800 })).toBeCloseTo(40.82, 1)
    expect(cmPer360({ source: 'custom', custom: 1, game: 1, dpi: 800 })).toBeNull()
  })

  it('converts between games through yaw', () => {
    expect(convertSensitivity(0.4, 'valorant', 'cs2')).toBeCloseTo(1.2727, 3)
  })

  it('gives the same turn for equivalent sensitivities', () => {
    const cs = pixelsPerCount({ source: 'cs2', custom: 1, game: 1.2727, dpi: 800 }, 1920)
    const apex = pixelsPerCount({ source: 'apex', custom: 1, game: 1.2727, dpi: 800 }, 1920)
    expect(cs).toBeCloseTo(apex, 6)
    expect(pixelsPerCount({ source: 'custom', custom: 1.5, game: 1, dpi: 800 }, 1920)).toBe(1.5)
  })
})
