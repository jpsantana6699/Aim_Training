export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function memoryStore(): KeyValueStore {
  const data = new Map<string, string>()
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: key => void data.delete(key),
  }
}

export function browserStore(): KeyValueStore {
  try {
    const probe = '__aim_probe__'
    localStorage.setItem(probe, probe)
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return memoryStore()
  }
}

export function readJson<T>(store: KeyValueStore, key: string): T | null {
  try {
    const raw = store.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(store: KeyValueStore, key: string, value: unknown) {
  try {
    store.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}
