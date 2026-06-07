export function invalidateApiCache(pathPattern: string): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return Promise.resolve()
  return navigator.serviceWorker.ready.then(reg => {
    if (reg.active) {
      reg.active.postMessage({ type: 'INVALIDATE_CACHE', pattern: pathPattern })
    }
  }).catch(() => {})
}
