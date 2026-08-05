export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }

  has(key) {
    return this.map.has(key)
  }

  get(key) {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value
      this.map.delete(oldestKey)
    }
  }

  entries() {
    return [...this.map.entries()]
  }
}
