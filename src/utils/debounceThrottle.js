export function debounce(fn, waitMs = 300) {
  let timer = null
  return function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), waitMs)
  }
}

export function throttle(fn, limitMs = 300) {
  let lastRan = 0
  let timer = null
  return function throttled(...args) {
    const now = Date.now()
    const remaining = limitMs - (now - lastRan)
    if (remaining <= 0) {
      clearTimeout(timer)
      timer = null
      lastRan = now
      fn.apply(this, args)
    } else {
      clearTimeout(timer)
      timer = setTimeout(() => {
        lastRan = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}
