import type { Grade } from './grade'
import type { ModeId } from './game/types'
import { readJson, writeJson, type KeyValueStore } from './storage'

export interface RoundRecord {
  modeId: ModeId
  duration: number
  score: number
  grade: Grade
  playedAt: number
}

const KEY = 'aim.history.v1'
const LIMIT = 500

export class History {
  private records: RoundRecord[]

  constructor(private readonly store: KeyValueStore) {
    const saved = readJson<RoundRecord[]>(store, KEY)
    this.records = Array.isArray(saved) ? saved : []
  }

  add(record: RoundRecord) {
    this.records = [...this.records, record].slice(-LIMIT)
    writeJson(this.store, KEY, this.records)
  }

  recent(modeId: ModeId, duration: number, count: number) {
    return this.of(modeId, duration).slice(-count)
  }

  best(modeId: ModeId, duration: number, lowerIsBetter: boolean): RoundRecord | null {
    return this.of(modeId, duration).reduce<RoundRecord | null>((best, record) => {
      if (!best) return record
      const better = lowerIsBetter ? record.score < best.score : record.score > best.score
      return better ? record : best
    }, null)
  }

  count(modeId: ModeId, duration: number) {
    return this.of(modeId, duration).length
  }

  clear() {
    this.records = []
    this.store.removeItem(KEY)
  }

  private of(modeId: ModeId, duration: number) {
    return this.records.filter(record => record.modeId === modeId && record.duration === duration)
  }
}
