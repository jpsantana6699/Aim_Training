import { drawCrosshair } from '../game/crosshair'
import { GAMES, cmPer360, findGame, type SensitivitySource } from '../sensitivity'
import { CROSSHAIR_STYLES, DEFAULT_SETTINGS, sensitivityProfile, type CrosshairStyle, type Settings } from '../settings'

export interface SettingsActions {
  current(): Settings
  change(settings: Settings): void
  clearHistory(): void
}

const PREVIEW_SIZE = 96
const SWATCH_SIZE = 44

export function setupSettings(dialog: HTMLDialogElement, actions: SettingsActions) {
  dialog.innerHTML = markup()
  const form = dialog.querySelector('form')!

  const fill = (settings: Settings) => {
    input(form, 'sensitivity').value = String(settings.sensitivity)
    input(form, 'sensitivityRange').value = String(settings.sensitivity)
    input(form, 'sensitivitySource').value = settings.sensitivitySource
    input(form, 'gameSensitivity').value = String(settings.gameSensitivity)
    input(form, 'dpi').value = String(settings.dpi)
    radios(form, 'crosshairStyle').value = settings.crosshairStyle
    input(form, 'crosshairColor').value = settings.crosshairColor
    input(form, 'crosshairSize').value = String(settings.crosshairSize)
    input(form, 'crosshairThickness').value = String(settings.crosshairThickness)
    input(form, 'crosshairGap').value = String(settings.crosshairGap)
    input(form, 'crosshairOutline').checked = settings.crosshairOutline
    input(form, 'targetColor').value = settings.targetColor
    input(form, 'volume').value = String(Math.round(settings.volume * 100))
    input(form, 'music').checked = settings.music
    input(form, 'musicVolume').value = String(Math.round(settings.musicVolume * 100))
    drawPreviews(dialog, settings)
    describeSensitivity(dialog, settings)
  }

  const read = (source: string): Settings => {
    const current = actions.current()
    const sensitivity = Number(input(form, source === 'sensitivityRange' ? 'sensitivityRange' : 'sensitivity').value)
    return {
      ...current,
      sensitivity: Number.isFinite(sensitivity) && sensitivity > 0 ? sensitivity : current.sensitivity,
      sensitivitySource: input(form, 'sensitivitySource').value as SensitivitySource,
      gameSensitivity: positive(input(form, 'gameSensitivity').value, current.gameSensitivity),
      dpi: Math.round(positive(input(form, 'dpi').value, current.dpi)),
      crosshairStyle: radios(form, 'crosshairStyle').value as CrosshairStyle,
      crosshairColor: input(form, 'crosshairColor').value,
      crosshairSize: Number(input(form, 'crosshairSize').value),
      crosshairThickness: Number(input(form, 'crosshairThickness').value),
      crosshairGap: Number(input(form, 'crosshairGap').value),
      crosshairOutline: input(form, 'crosshairOutline').checked,
      targetColor: input(form, 'targetColor').value,
      volume: Number(input(form, 'volume').value) / 100,
      music: input(form, 'music').checked,
      musicVolume: Number(input(form, 'musicVolume').value) / 100,
    }
  }

  form.addEventListener('input', event => {
    const source = (event.target as HTMLInputElement).name
    const settings = read(source)
    actions.change(settings)
    if (source === 'sensitivityRange') input(form, 'sensitivity').value = String(settings.sensitivity)
    if (source === 'sensitivity') input(form, 'sensitivityRange').value = String(settings.sensitivity)
    drawPreviews(dialog, settings)
    describeSensitivity(dialog, settings)
  })

  dialog.addEventListener('click', event => {
    const action = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action
    if (event.target === dialog || action === 'close') dialog.close()
    if (action === 'defaults') {
      const current = actions.current()
      const settings = { ...DEFAULT_SETTINGS, duration: current.duration, music: current.music }
      actions.change(settings)
      fill(settings)
    }
    if (action === 'clear' && confirm('Apagar todos os recordes e o histórico deste dispositivo?')) actions.clearHistory()
  })

  return {
    open() {
      fill(actions.current())
      dialog.showModal()
    },
  }
}

function positive(raw: string, fallback: number) {
  const value = Number(raw.replace(',', '.'))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function describeSensitivity(dialog: HTMLDialogElement, settings: Settings) {
  const game = findGame(settings.sensitivitySource)
  dialog.querySelector<HTMLElement>('[data-sens-custom]')!.hidden = Boolean(game)
  dialog.querySelector<HTMLElement>('[data-sens-game]')!.hidden = !game
  if (!game) return
  dialog.querySelector('[data-sens-label]')!.textContent = `Sensi no ${game.label}`
  const cm = cmPer360(sensitivityProfile(settings))
  dialog.querySelector('[data-sens-summary]')!.textContent = cm
    ? `≈ ${cm.toFixed(1).replace('.', ',')} cm/360 · mesmo giro do ${game.label} perto da mira`
    : ''
}

function input(form: HTMLFormElement, name: string) {
  return form.elements.namedItem(name) as HTMLInputElement
}

function radios(form: HTMLFormElement, name: string) {
  return form.elements.namedItem(name) as RadioNodeList
}

function drawPreviews(dialog: HTMLDialogElement, settings: Settings) {
  paint(dialog.querySelector<HTMLCanvasElement>('[data-preview]')!, PREVIEW_SIZE, settings)
  for (const canvas of dialog.querySelectorAll<HTMLCanvasElement>('[data-swatch]')) {
    const style = canvas.dataset.swatch as CrosshairStyle
    paint(canvas, SWATCH_SIZE, {
      ...settings,
      crosshairStyle: style,
      crosshairSize: Math.min(settings.crosshairSize, 10),
      crosshairGap: Math.min(settings.crosshairGap, 4),
    })
  }
}

function paint(canvas: HTMLCanvasElement, size: number, settings: Settings) {
  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  const g = canvas.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.fillStyle = '#0b0b10'
  g.fillRect(0, 0, size, size)
  drawCrosshair(g, Math.round(size / 2), Math.round(size / 2), settings)
}

function canvasTag(attribute: string, size: number) {
  return `<canvas ${attribute} width="${size}" height="${size}" style="width:${size}px;height:${size}px"></canvas>`
}

function markup() {
  const swatches = CROSSHAIR_STYLES.map(
    style => `
      <label class="swatch" title="${style.label}">
        <input type="radio" name="crosshairStyle" value="${style.id}" />
        ${canvasTag(`data-swatch="${style.id}"`, SWATCH_SIZE)}
        <span>${style.label}</span>
      </label>`,
  ).join('')
  return `
    <form method="dialog" class="settings__form">
      <header class="settings__header">
        <h2>Configurações</h2>
        <button type="button" class="icon-button" data-action="close" aria-label="Fechar">✕</button>
      </header>

      <fieldset>
        <legend>Sensibilidade</legend>
        <label>Usar a sensi de
          <select name="sensitivitySource">
            ${GAMES.map(game => `<option value="${game.id}">${game.label}</option>`).join('')}
            <option value="custom">Personalizada</option>
          </select>
        </label>
        <div class="settings__grid settings__grid--two settings__gap" data-sens-game>
          <label><span data-sens-label>Sensi no jogo</span> <input type="text" inputmode="decimal" name="gameSensitivity" /></label>
          <label>DPI do mouse <input type="text" inputmode="numeric" name="dpi" /></label>
          <p class="settings__hint settings__span" data-sens-summary></p>
        </div>
        <div class="settings__gap" data-sens-custom>
          <div class="settings__row">
            <input type="range" name="sensitivityRange" min="0.1" max="5" step="0.05" aria-label="Sensibilidade" />
            <input type="number" name="sensitivity" min="0.05" max="10" step="0.01" aria-label="Sensibilidade exata" />
          </div>
          <p class="settings__hint">1 = mesmo movimento do cursor do sistema.</p>
        </div>
      </fieldset>

      <fieldset>
        <legend>Mira</legend>
        <div class="swatches" role="radiogroup" aria-label="Estilo da mira">${swatches}</div>
        <div class="settings__crosshair">
          ${canvasTag('data-preview', PREVIEW_SIZE)}
          <div class="settings__grid settings__grid--two">
            <label>Cor <input type="color" name="crosshairColor" /></label>
            <label>Tamanho <input type="range" name="crosshairSize" min="2" max="30" step="1" /></label>
            <label>Espessura <input type="range" name="crosshairThickness" min="1" max="6" step="1" /></label>
            <label>Espaço central <input type="range" name="crosshairGap" min="0" max="20" step="1" /></label>
            <label class="settings__check"><input type="checkbox" name="crosshairOutline" /> Contorno preto</label>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Jogo e som</legend>
        <div class="settings__grid settings__grid--two">
          <label>Cor do alvo <input type="color" name="targetColor" /></label>
          <label>Efeitos <input type="range" name="volume" min="0" max="100" step="5" /></label>
          <label class="settings__check"><input type="checkbox" name="music" /> Música</label>
          <label>Volume da música <input type="range" name="musicVolume" min="0" max="100" step="5" /></label>
        </div>
        <p class="settings__hint">A música é gerada pelo próprio jogo: sem copyright, pode usar em live.</p>
      </fieldset>

      <footer class="settings__footer">
        <button type="button" class="button button--ghost button--danger" data-action="clear">Apagar recordes</button>
        <button type="button" class="button button--ghost" data-action="defaults">Restaurar padrão</button>
        <button type="button" class="button button--primary" data-action="close">Pronto</button>
      </footer>
    </form>`
}
