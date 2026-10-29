export const GAMES = [
  { id: 'cs2', label: 'Counter-Strike 2', short: 'CS2', yaw: 0.022, fov: 106.26 },
  { id: 'valorant', label: 'Valorant', short: 'Valorant', yaw: 0.07, fov: 103 },
  { id: 'apex', label: 'Apex Legends', short: 'Apex', yaw: 0.022, fov: 106.26 },
  { id: 'overwatch', label: 'Overwatch 2', short: 'OW2', yaw: 0.0066, fov: 103 },
] as const

export type GameId = (typeof GAMES)[number]['id']

export type SensitivitySource = GameId | 'custom'

export interface SensitivityProfile {
  source: SensitivitySource
  custom: number
  game: number
  dpi: number
}

export function findGame(id: SensitivitySource) {
  return GAMES.find(game => game.id === id) ?? null
}

export function pixelsPerCount(profile: SensitivityProfile, screenWidth: number) {
  const game = findGame(profile.source)
  if (!game) return profile.custom
  const degreesPerCount = game.yaw * profile.game
  const halfFov = (game.fov / 2) * (Math.PI / 180)
  const pixelsPerRadian = screenWidth / 2 / Math.tan(halfFov)
  return degreesPerCount * (Math.PI / 180) * pixelsPerRadian
}

export function cmPer360(profile: SensitivityProfile) {
  const game = findGame(profile.source)
  if (!game || profile.dpi <= 0 || profile.game <= 0) return null
  const counts = 360 / (game.yaw * profile.game)
  return (counts / profile.dpi) * 2.54
}

export function convertSensitivity(value: number, from: GameId, to: GameId) {
  return (value * findGame(from)!.yaw) / findGame(to)!.yaw
}
