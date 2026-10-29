import type { Sfx } from '../audio'
import { pixelsPerCount } from '../sensitivity'
import { clamp, sensitivityLabel, sensitivityProfile, type Settings } from '../settings'
import { Effects } from './effects'
import { FIELD, Renderer, fitScale, type View } from './renderer'
import type { Mode, ModeInfo, ModeResult, Vec } from './types'

type State = 'idle' | 'ready' | 'countdown' | 'running' | 'paused' | 'done'

export interface EngineDeps {
  settings: () => Settings
  sfx: Sfx
  onFinish(info: ModeInfo, duration: number, result: ModeResult): void
  onExit(): void
}

const COUNTDOWN_SECONDS = 3
const CAMERA_MARGIN = 80

export class Engine {
  private readonly canvas: HTMLCanvasElement
  private readonly g: CanvasRenderingContext2D
  private readonly overlay: HTMLElement
  private readonly hud: Record<'score' | 'time' | 'detail', HTMLElement>
  private readonly view: View = { width: 0, height: 0, scale: 1, cam: { x: 0, y: 0 } }
  private readonly keys = new Set<string>()
  private readonly fx = new Effects()
  private state: State = 'idle'
  private info: ModeInfo | null = null
  private duration = 0
  private mode: Mode | null = null
  private countdown = 0
  private raf = 0
  private lastFrame = 0
  private pausedAt = 0

  constructor(
    root: HTMLElement,
    private readonly deps: EngineDeps,
  ) {
    this.canvas = root.querySelector('canvas')!
    this.g = this.canvas.getContext('2d', { alpha: false })!
    this.overlay = root.querySelector('[data-overlay]')!
    this.hud = {
      score: root.querySelector('[data-hud="score"]')!,
      time: root.querySelector('[data-hud="time"]')!,
      detail: root.querySelector('[data-hud="detail"]')!,
    }
    this.bindEvents()
  }

  open(info: ModeInfo, duration: number) {
    this.info = info
    this.duration = duration
    this.reset()
    this.resize()
    this.raf = requestAnimationFrame(this.frame)
  }

  close() {
    cancelAnimationFrame(this.raf)
    this.state = 'idle'
    this.mode = null
    this.keys.clear()
    this.releasePointer()
  }

  private reset() {
    const info = this.info!
    this.fx.clear()
    this.view.cam = { x: 0, y: 0 }
    this.mode = info.create(
      {
        sfx: this.deps.sfx,
        fx: this.fx,
        keys: this.keys,
        random: Math.random,
        now: () => performance.now(),
        targetColor: () => this.deps.settings().targetColor,
      },
      this.duration,
    )
    this.setState('ready')
  }

  private async begin() {
    this.deps.sfx.unlock()
    if (this.info!.usesPointerLock && !(await this.lockPointer())) {
      this.showOverlay(this.state === 'paused' ? 'paused' : 'ready', 'Não foi possível capturar o mouse. Clique de novo.')
      return
    }
    if (this.state === 'paused') this.setState('running')
    else this.startCountdown()
  }

  private startCountdown() {
    this.countdown = COUNTDOWN_SECONDS
    this.deps.sfx.tick()
    this.setState('countdown')
  }

  private pause() {
    if (this.state !== 'running' && this.state !== 'countdown') return
    if (this.state === 'countdown') {
      this.setState('ready')
      return
    }
    this.pausedAt = performance.now()
    this.setState('paused')
  }

  private finish() {
    this.setState('done')
    this.releasePointer()
    this.deps.sfx.finish()
    this.deps.onFinish(this.info!, this.duration, this.mode!.result())
  }

  private frame = (time: number) => {
    const dt = Math.min((time - this.lastFrame) / 1000, 0.05)
    this.lastFrame = time
    this.step(dt)
    this.render()
    this.updateHud()
    if (this.state !== 'idle') this.raf = requestAnimationFrame(this.frame)
  }

  private step(dt: number) {
    if (this.state === 'countdown') this.stepCountdown(dt)
    if (this.state === 'running' && this.mode) {
      this.mode.update(dt, this.aim())
      if (this.mode.isFinished()) this.finish()
    }
    this.fx.update(dt)
  }

  private stepCountdown(dt: number) {
    const before = Math.ceil(this.countdown)
    this.countdown -= dt
    const after = Math.ceil(this.countdown)
    if (this.countdown <= 0) {
      this.deps.sfx.go()
      this.mode!.start()
      this.setState('running')
      return
    }
    if (after !== before) this.deps.sfx.tick()
    this.overlay.querySelector('[data-countdown]')!.textContent = String(after)
  }

  private render() {
    const settings = this.deps.settings()
    const offset = this.mode?.viewOffset?.() ?? { x: 0, y: 0 }
    const view = { ...this.view, cam: { x: this.view.cam.x + offset.x, y: this.view.cam.y + offset.y } }
    const r = new Renderer(this.g, view)
    const dpr = window.devicePixelRatio || 1
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (this.info?.usesPointerLock) r.background()
    if (this.mode && this.state !== 'ready' && this.state !== 'countdown') this.mode.draw(r)
    else if (!this.info?.usesPointerLock) r.fill('#0b0b10')
    this.fx.draw(r)
    if (this.info?.usesPointerLock) r.crosshair(settings)
  }

  private updateHud() {
    if (!this.mode) return
    const hud = this.mode.hud()
    this.hud.score.textContent = hud.score
    this.hud.detail.textContent = hud.detail
    this.hud.time.textContent = hud.timeLeft === null ? '' : formatClock(hud.timeLeft)
    this.hud.time.classList.toggle('hud__timer--low', hud.timeLeft !== null && hud.timeLeft <= 5)
  }

  private aim(): Vec {
    const offset = this.mode?.viewOffset?.() ?? { x: 0, y: 0 }
    return { x: this.view.cam.x + offset.x, y: this.view.cam.y + offset.y }
  }

  private moveCamera(dx: number, dy: number) {
    const factor = pixelsPerCount(sensitivityProfile(this.deps.settings()), this.view.width) / this.view.scale
    const limitX = FIELD.width / 2 + CAMERA_MARGIN
    const limitY = FIELD.height / 2 + CAMERA_MARGIN
    this.view.cam.x = clamp(this.view.cam.x + dx * factor, -limitX, limitX)
    this.view.cam.y = clamp(this.view.cam.y + dy * factor, -limitY, limitY)
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.view.width = rect.width
    this.view.height = rect.height
    this.view.scale = fitScale(rect.width, rect.height)
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
  }

  private setState(state: State) {
    this.state = state
    if (state === 'running' || state === 'done' || state === 'idle') this.overlay.hidden = true
    else this.showOverlay(state)
  }

  private showOverlay(state: 'ready' | 'countdown' | 'paused', message = '') {
    const info = this.info!
    this.overlay.hidden = false
    this.overlay.dataset.state = state
    this.overlay.innerHTML = overlayMarkup(state, info, this.duration, message, sensitivityLabel(this.deps.settings()))
  }

  private async lockPointer() {
    if (document.pointerLockElement === this.canvas) return true
    try {
      await this.canvas.requestPointerLock({ unadjustedMovement: true })
    } catch {
      try {
        await this.canvas.requestPointerLock()
      } catch {
        return false
      }
    }
    return document.pointerLockElement === this.canvas
  }

  private releasePointer() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock()
  }

  private shoot() {
    if (this.state === 'running') this.mode?.shoot(this.aim())
  }

  private bindEvents() {
    window.addEventListener('resize', () => this.state !== 'idle' && this.resize())
    this.canvas.addEventListener('contextmenu', event => event.preventDefault())
    this.canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0) return
      if (this.state === 'running') this.shoot()
    })
    document.addEventListener('mousemove', event => {
      if (document.pointerLockElement !== this.canvas) return
      if (this.state === 'running' || this.state === 'countdown') this.moveCamera(event.movementX, event.movementY)
    })
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.canvas && this.info?.usesPointerLock) this.pause()
    })
    document.addEventListener('visibilitychange', () => document.hidden && this.pause())
    this.overlay.addEventListener('click', event => this.onOverlayClick(event))
    window.addEventListener('keydown', event => this.onKeyDown(event))
    window.addEventListener('keyup', event => this.keys.delete(event.code))
    window.addEventListener('blur', () => this.keys.clear())
  }

  private onOverlayClick(event: MouseEvent) {
    const action = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action
    if (action === 'restart') return this.restart()
    if (action === 'exit') return this.deps.onExit()
    if (this.state === 'ready' || this.state === 'paused') void this.begin()
  }

  private restart() {
    this.reset()
    void this.begin()
  }

  private onKeyDown(event: KeyboardEvent) {
    if (this.state === 'idle' || this.state === 'done') return
    this.keys.add(event.code)
    if (event.code === 'Space') event.preventDefault()
    if (event.repeat) return
    if (event.code === 'Escape') return this.onEscape()
    if (event.code === 'Space' && this.state === 'running' && !this.info!.usesPointerLock) this.shoot()
    if (event.code === 'KeyR' && this.state === 'paused') this.restart()
  }

  private onEscape() {
    if (this.state === 'ready') this.deps.onExit()
    else if (this.state === 'paused' && performance.now() - this.pausedAt > 500) this.deps.onExit()
    else this.pause()
  }
}

function overlayMarkup(state: 'ready' | 'countdown' | 'paused', info: ModeInfo, duration: number, message: string, sensitivity: string) {
  if (state === 'countdown') return `<div class="overlay__countdown" data-countdown>${COUNTDOWN_SECONDS}</div>`
  if (state === 'paused') {
    return `
      <div class="overlay__card">
        <h2 class="overlay__title">Pausado</h2>
        ${message ? `<p class="overlay__error">${message}</p>` : ''}
        <div class="overlay__actions">
          <button class="button button--primary" data-action="resume">Continuar</button>
          <button class="button" data-action="restart">Reiniciar <kbd>R</kbd></button>
          <button class="button button--ghost" data-action="exit">Menu <kbd>Esc</kbd></button>
        </div>
      </div>`
  }
  const subtitle = info.timed ? `${duration} segundos` : 'Teste de reação'
  return `
    <div class="overlay__card">
      <p class="overlay__eyebrow">${subtitle}</p>
      <h2 class="overlay__title">${info.name}</h2>
      <p class="overlay__text">${info.description}</p>
      <ul class="overlay__controls">${info.controls.map(item => `<li>${item}</li>`).join('')}</ul>
      ${message ? `<p class="overlay__error">${message}</p>` : ''}
      <button class="button button--primary button--big">Clique para começar</button>
      <p class="overlay__hint">${info.usesPointerLock ? `Sensi: ${sensitivity} · ` : ''}<kbd>Esc</kbd> volta ao menu</p>
    </div>`
}

export function formatClock(seconds: number) {
  const total = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}
