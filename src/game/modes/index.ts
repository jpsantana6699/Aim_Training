import type { ModeId, ModeInfo } from '../types'
import { CounterStrafe } from './counter-strafe'
import { Flick } from './flick'
import { Gridshot } from './gridshot'
import { Headshot } from './headshot'
import { Reaction } from './reaction'
import { Spidershot } from './spidershot'
import { Tracking } from './tracking'

export const MODES: readonly ModeInfo[] = [
  {
    id: 'gridshot',
    name: 'Gridshot',
    tagline: 'Velocidade de mira',
    description: 'Três alvos numa grade. Acerte o máximo que puder sem perder precisão.',
    controls: ['Mouse para mirar', 'Clique para atirar'],
    timed: true,
    usesPointerLock: true,
    lowerIsBetter: false,
    unit: 'pts',
    thresholds: [2.6, 2.2, 1.8, 1.4, 1.0, 0.6],
    create: (ctx, duration) => new Gridshot(ctx, duration),
  },
  {
    id: 'flick',
    name: 'Flick',
    tagline: 'Precisão em alvo pequeno',
    description: 'Um alvo pequeno por vez, em qualquer lugar do campo. Puxe rápido e pare em cima.',
    controls: ['Mouse para mirar', 'Clique para atirar'],
    timed: true,
    usesPointerLock: true,
    lowerIsBetter: false,
    unit: 'pts',
    thresholds: [1.7, 1.4, 1.15, 0.9, 0.65, 0.4],
    create: (ctx, duration) => new Flick(ctx, duration),
  },
  {
    id: 'headshot',
    name: 'Headshot',
    tagline: 'Mira na altura da cabeça',
    description: 'Inimigos perto e longe, sempre com a cabeça na mesma linha. Só headshot conta: mantenha a mira na altura certa.',
    controls: ['Mouse para mirar', 'Clique para atirar', 'Tiro no corpo conta como erro'],
    timed: true,
    usesPointerLock: true,
    lowerIsBetter: false,
    unit: 'pts',
    thresholds: [1.6, 1.3, 1.05, 0.8, 0.6, 0.4],
    create: (ctx, duration) => new Headshot(ctx, duration),
  },
  {
    id: 'spidershot',
    name: 'Spidershot',
    tagline: 'Flick e volta ao centro',
    description: 'Alterna um alvo no centro e um espalhado pelo campo. Treina o flick e a volta da mira.',
    controls: ['Mouse para mirar', 'Clique para atirar'],
    timed: true,
    usesPointerLock: true,
    lowerIsBetter: false,
    unit: 'pts',
    thresholds: [2.0, 1.7, 1.4, 1.1, 0.8, 0.5],
    create: (ctx, duration) => new Spidershot(ctx, duration),
  },
  {
    id: 'tracking',
    name: 'Tracking',
    tagline: 'Acompanhar inimigo no ADAD',
    description: 'O alvo faz ADAD como um inimigo de verdade, trocando de direção sem aviso. Mantenha a mira em cima o tempo todo.',
    controls: ['Mouse para acompanhar', 'Não precisa clicar'],
    timed: true,
    usesPointerLock: true,
    lowerIsBetter: false,
    unit: '%',
    thresholds: [85, 75, 65, 52, 40, 28],
    create: (ctx, duration) => new Tracking(ctx, duration),
  },
  {
    id: 'counterstrafe',
    name: 'Counter-strafe',
    tagline: 'Controle AD: parar e atirar',
    description: 'Dê peek na parede com A/D, pare seco apertando a tecla oposta e atire. Tiro andando espalha, igual CS e Valorant.',
    controls: ['A / D para andar', 'Tecla oposta para parar', 'Clique para atirar'],
    timed: true,
    usesPointerLock: true,
    lowerIsBetter: false,
    unit: 'pts',
    thresholds: [1.1, 0.9, 0.75, 0.6, 0.45, 0.3],
    create: (ctx, duration) => new CounterStrafe(ctx, duration),
  },
  {
    id: 'reaction',
    name: 'Reflexo',
    tagline: 'Tempo de reação',
    description: 'Quando a tela ficar verde, clique o mais rápido possível. Cinco rodadas.',
    controls: ['Clique, toque ou Espaço', 'Clicar antes do verde queima a rodada'],
    timed: false,
    usesPointerLock: false,
    lowerIsBetter: true,
    unit: 'ms',
    thresholds: [170, 195, 225, 260, 300, 360],
    create: ctx => new Reaction(ctx),
  },
]

export function findMode(id: ModeId) {
  return MODES.find(mode => mode.id === id)!
}

export function sessionDuration(info: ModeInfo, duration: number) {
  return info.timed ? duration : 0
}

export function formatScore(info: ModeInfo, score: number) {
  if (info.unit === 'ms') return `${Math.round(score)} ms`
  if (info.unit === '%') return `${score.toFixed(1).replace('.', ',')}%`
  return `${score.toLocaleString('pt-BR')} pts`
}
