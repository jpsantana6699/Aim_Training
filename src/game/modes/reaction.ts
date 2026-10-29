import type { Renderer } from '../renderer'
import type { Mode, ModeContext } from '../types'
import { format } from './shared'

export const REACTION_ROUNDS = 5

type Phase = 'wait' | 'go' | 'shown' | 'early'

export class Reaction implements Mode {
  private phase: Phase = 'wait'
  private waitLeft = 0
  private goAt = 0
  private times: number[] = []
  private falseStarts = 0

  constructor(private readonly ctx: ModeContext) {}

  start() {
    this.nextRound()
  }

  update(dt: number) {
    if (this.phase !== 'wait') return
    this.waitLeft -= dt
    if (this.waitLeft > 0) return
    this.phase = 'go'
    this.goAt = this.ctx.now()
  }

  shoot() {
    if (this.phase === 'wait') {
      this.falseStarts += 1
      this.phase = 'early'
      this.ctx.sfx.miss()
      return
    }
    if (this.phase === 'go') {
      this.times.push(this.ctx.now() - this.goAt)
      this.phase = 'shown'
      this.ctx.sfx.hit()
      return
    }
    this.nextRound()
  }

  draw(r: Renderer) {
    const round = `Rodada ${Math.min(this.times.length + 1, REACTION_ROUNDS)} de ${REACTION_ROUNDS}`
    if (this.phase === 'wait') {
      r.fill('#5c0d12')
      r.text([
        { text: 'Espere o verde…', size: 44 },
        { text: round, size: 18, color: '#ffb3b3', weight: 500 },
      ])
    }
    if (this.phase === 'go') {
      r.fill('#0fa34a')
      r.text([{ text: 'CLIQUE!', size: 72, weight: 800 }])
    }
    if (this.phase === 'shown') {
      r.fill('#15151c')
      r.text([
        { text: format.ms(this.times[this.times.length - 1]), size: 64, weight: 800 },
        { text: 'Clique para a próxima', size: 18, color: '#9a9aa8', weight: 500 },
      ])
    }
    if (this.phase === 'early') {
      r.fill('#4a3405')
      r.text([
        { text: 'Cedo demais!', size: 52 },
        { text: 'Clique para tentar de novo', size: 18, color: '#ffd98a', weight: 500 },
      ])
    }
  }

  hud() {
    return {
      score: `Rodada ${Math.min(this.times.length + 1, REACTION_ROUNDS)}/${REACTION_ROUNDS}`,
      detail: this.times.length ? `Média ${format.ms(this.average())}` : '',
      timeLeft: null,
    }
  }

  isFinished() {
    return this.times.length >= REACTION_ROUNDS
  }

  result() {
    const average = this.average()
    return {
      score: Math.round(average),
      rating: average,
      metrics: [
        { label: 'Média', value: format.ms(average) },
        { label: 'Melhor', value: format.ms(Math.min(...this.times)) },
        { label: 'Pior', value: format.ms(Math.max(...this.times)) },
        { label: 'Queimadas', value: String(this.falseStarts) },
      ],
    }
  }

  private nextRound() {
    this.phase = 'wait'
    this.waitLeft = 1.2 + this.ctx.random() * 2.3
  }

  private average() {
    return this.times.length ? this.times.reduce((sum, value) => sum + value, 0) / this.times.length : 0
  }
}
