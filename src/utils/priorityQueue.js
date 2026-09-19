// Fila de prioridade mínima sobre um Binary Heap (array indexado em 0).
// Nó i: pai = (i-1)>>1, filhos = 2i+1 e 2i+2. Heap property: todo pai
// "vem antes" dos filhos segundo o comparator — aqui, prioridade menor primeiro.
export class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = []
    this.comparator = comparator
  }

  get size() {
    return this.heap.length
  }

  isEmpty() {
    return this.heap.length === 0
  }

  peek() {
    return this.heap[0]
  }

  push(item) {
    this.heap.push(item)
    this._siftUp(this.heap.length - 1)
    return this
  }

  pop() {
    if (this.heap.length === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()
    if (this.heap.length > 0) {
      this.heap[0] = last
      this._siftDown(0)
    }
    return top
  }

  toArray() {
    return [...this.heap]
  }

  // Constrói o heap a partir de um array qualquer em O(n) (heapify):
  // sift-down de cada pai, da última folha-nível para a raiz.
  static fromArray(items, comparator) {
    const q = new PriorityQueue(comparator)
    q.heap = [...items]
    const n = q.heap.length
    for (let i = (n >> 1) - 1; i >= 0; i--) q._siftDown(i)
    return q
  }

  _less(i, j) {
    return this.comparator(this.heap[i], this.heap[j]) < 0
  }

  _swap(i, j) {
    const tmp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = tmp
  }

  _siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this._less(i, parent)) {
        this._swap(i, parent)
        i = parent
      } else {
        break
      }
    }
  }

  _siftDown(i) {
    const n = this.heap.length
    for (;;) {
      const l = 2 * i + 1
      const r = l + 1
      let smallest = i
      if (l < n && this._less(l, smallest)) smallest = l
      if (r < n && this._less(r, smallest)) smallest = r
      if (smallest === i) break
      this._swap(i, smallest)
      i = smallest
    }
  }
}