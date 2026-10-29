import type { ModeId } from '../game/types'

const svg = (body: string) =>
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`

export const MODE_ICONS: Record<ModeId, string> = {
  gridshot: svg(
    '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/><circle cx="36" cy="12" r="4" opacity=".35"/><circle cx="24" cy="24" r="4" fill="currentColor" stroke="none"/><circle cx="12" cy="36" r="4" opacity=".35"/><circle cx="36" cy="36" r="4" fill="currentColor" stroke="none"/>',
  ),
  flick: svg(
    '<circle cx="34" cy="14" r="6"/><circle cx="34" cy="14" r="1.5" fill="currentColor"/><path d="M8 40 L26 22"/><path d="M18 22 h8 v8"/>',
  ),
  tracking: svg(
    '<circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2" fill="currentColor"/><path d="M4 24 h8 M36 24 h8 M8 19 l-4 5 4 5 M40 19 l4 5 -4 5"/>',
  ),
  headshot: svg(
    '<circle cx="24" cy="13" r="6"/><path d="M14 44 v-14 a10 10 0 0 1 20 0 v14"/><path d="M4 13 h10 M34 13 h10" stroke-dasharray="2 3"/>',
  ),
  spidershot: svg(
    '<circle cx="24" cy="24" r="5"/><circle cx="8" cy="8" r="3"/><circle cx="40" cy="12" r="3"/><circle cx="38" cy="40" r="3"/><path d="M20 20 L11 11 M28 21 L37 14 M28 28 L35 37" opacity=".5"/>',
  ),
  counterstrafe: svg(
    '<rect x="18" y="6" width="12" height="36" rx="2"/><path d="M4 24 h9 M8 20 l-4 4 4 4 M44 24 h-9 M40 20 l4 4 -4 4"/>',
  ),
  reaction: svg('<path d="M27 4 L10 27 h13 l-3 17 L38 20 H25 Z"/>'),
}

export const GEAR_ICON = svg(
  '<circle cx="24" cy="24" r="6"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"/>',
)

export const MUSIC_ICON = svg('<path d="M18 36V10l22-4v26"/><circle cx="13" cy="36" r="5"/><circle cx="35" cy="32" r="5"/>')
