import { describe, expect, it } from 'vitest'
import type { Sfx } from '../../audio'
import { Effects } from '../effects'
import type { ModeContext } from '../types'
import { ACCURATE_SPEED, CounterStrafe } from './counter-strafe'
import { Flick } from './flick'
import { Gridshot } from './gridshot'
import { Headshot } from './headshot'
import { REACTION_ROUNDS, Reaction } from './reaction'
import { Spidershot } from './spidershot'
import { Tracking } from './tracking'

function context(overrides: Partial<ModeContext> = {}): ModeContext {
  const silent = { hit() {}, miss() {}, tick() {}, go() {}, finish() {}, unlock() {} } as unknown as Sfx
  return {
    sfx: silent,
    fx: new Effects(),
    keys: new Set(),
    random: () => 0.5,
    now: () => 0,
    targetColor: () => '#ff0000',
    ...overrides,
  }
}

describe('Gridshot', () => {
  it('counts hits on a target and misses elsewhere', () => {
    const mode = new Gridshot(context(), 30)
    mode.start()
    mode.update(0.5)
    mode.shoot({ x: 0, y: 0 })
    mode.shoot({ x: 9999, y: 9999 })
    const result = mode.result()
    expect(result.metrics[0].value).toBe('1')
    expect(result.metrics[1].value).toBe('50%')
    expect(result.score).toBe(50)
  })

  it('finishes when the clock runs out', () => {
    const mode = new Gridshot(context(), 30)
    mode.start()
    mode.update(29.9)
    expect(mode.isFinished()).toBe(false)
    mode.update(0.2)
    expect(mode.isFinished()).toBe(true)
    expect(mode.hud().timeLeft).toBe(0)
  })

  it('scores zero without shots', () => {
    const mode = new Gridshot(context(), 60)
    mode.start()
    mode.update(60)
    expect(mode.result()).toMatchObject({ score: 0, rating: 0 })
  })
})

describe('Flick', () => {
  it('moves the target far enough after a hit', () => {
    let seed = 0
    const values = [0.1, 0.9, 0.95, 0.1, 0.5, 0.5]
    const mode = new Flick(context({ random: () => values[seed++ % values.length] }), 30)
    mode.start()
    const first = (mode as unknown as { target: { x: number; y: number } }).target
    mode.shoot(first)
    const second = (mode as unknown as { target: { x: number; y: number } }).target
    expect(Math.hypot(first.x - second.x, first.y - second.y)).toBeGreaterThanOrEqual(200)
    expect(mode.result().score).toBe(100)
  })
})

describe('Tracking', () => {
  it('measures the share of time with the aim on the target', () => {
    const mode = new Tracking(context(), 10)
    mode.start()
    const target = (mode as unknown as { target: { x: number; y: number } }).target
    mode.update(0.01, { x: target.x, y: target.y })
    mode.update(0.01, { x: 9999, y: 9999 })
    expect(mode.result().score).toBe(50)
  })
})

describe('Reaction', () => {
  it('averages reaction times and counts false starts', () => {
    let now = 0
    const mode = new Reaction(context({ now: () => now, random: () => 0 }))
    mode.start()
    mode.shoot()
    mode.shoot()
    for (let round = 0; round < REACTION_ROUNDS; round++) {
      mode.update(2)
      now += 200 + round * 10
      mode.shoot()
      if (round < REACTION_ROUNDS - 1) mode.shoot()
    }
    expect(mode.isFinished()).toBe(true)
    const result = mode.result()
    expect(result.score).toBe(220)
    expect(result.metrics.find(metric => metric.label === 'Queimadas')?.value).toBe('1')
  })
})

describe('Spidershot', () => {
  it('alternates between the center and an outer target', () => {
    const mode = new Spidershot(context({ random: () => 0.9 }), 30)
    mode.start()
    const read = () => (mode as unknown as { target: { x: number; y: number } }).target
    expect(read()).toMatchObject({ x: 0, y: 0 })
    mode.shoot({ x: 0, y: 0 })
    expect(Math.hypot(read().x, read().y)).toBeGreaterThanOrEqual(220)
    mode.shoot(read())
    expect(read()).toMatchObject({ x: 0, y: 0 })
  })
})

describe('Headshot', () => {
  it('counts body shots as misses', () => {
    const mode = new Headshot(context({ random: () => 0.9 }), 30)
    mode.start()
    const head = (mode as unknown as { target: { x: number; y: number; radius: number } }).target
    mode.shoot({ x: head.x, y: head.y + head.radius * 3 })
    mode.shoot(head)
    const metrics = mode.result().metrics
    expect(metrics.find(m => m.label === 'Headshots')?.value).toBe('1')
    expect(metrics.find(m => m.label === 'Tiros no corpo')?.value).toBe('1')
  })
})

describe('CounterStrafe', () => {
  function setup(keys: Set<string>) {
    let seed = 0
    const values = [0.1, 0.5, 0.5, 0.3, 0.7]
    const mode = new CounterStrafe(context({ keys, random: () => values[seed++ % values.length] }), 30)
    mode.start()
    const target = (mode as unknown as { target: { x: number; y: number; radius: number } }).target
    return { mode, target }
  }

  it('blocks shots through the wall', () => {
    const { mode, target } = setup(new Set())
    mode.update(0.1, { x: 0, y: 0 })
    mode.shoot(target)
    expect(mode.result().score).toBe(0)
  })

  it('hits after peeking and stopping', () => {
    const keys = new Set<string>()
    const { mode, target } = setup(keys)
    const toward = target.x > 0 ? 'KeyD' : 'KeyA'
    keys.add(toward)
    for (let i = 0; i < 60; i++) mode.update(1 / 60, { x: 0, y: 0 })
    keys.clear()
    for (let i = 0; i < 60; i++) mode.update(1 / 60, { x: 0, y: 0 })
    mode.shoot(target)
    expect(mode.result().metrics[0].value).toBe('1')
    expect(mode.result().metrics[2].value).toBe('100%')
  })

  it('marks shots while running as moving shots', () => {
    const keys = new Set(['KeyD'])
    const { mode } = setup(keys)
    for (let i = 0; i < 20; i++) mode.update(1 / 60, { x: 0, y: 0 })
    mode.shoot({ x: 9999, y: 9999 })
    expect(mode.result().metrics[2].value).toBe('0%')
    expect(mode.hud().detail).toContain('Peek')
    expect(ACCURATE_SPEED).toBeGreaterThan(0)
  })
})
