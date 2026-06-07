/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & typeof globalThis

precacheAndRoute(self.__WB_MANIFEST)

// API GET: serve cached, update in background
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  }),
)

// API mutations: network only
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method !== 'GET',
  new NetworkOnly(),
)

self.addEventListener('push', (event) => {
  let data: { title: string; body: string; url?: string } = { title: '', body: '' }
  try {
    data = event.data?.json() || data
  } catch {
    data = { title: 'Gestão Casa', body: event.data?.text() || '' }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const focused = windowClients.find((c) => c.url === url && 'focus' in c)
      if (focused) {
        focused.focus()
      } else {
        clients.openWindow(url)
      }
    }),
  )
})

self.addEventListener('message', (event) => {
  const data: { type?: string; pattern?: string } = (event as MessageEvent).data || {}
  if (data.type !== 'INVALIDATE_CACHE' || !data.pattern) return
  event.waitUntil(
    (async () => {
      const cache = await caches.open('api-cache')
      const keys = await cache.keys()
      await Promise.all(
        keys
          .filter(req => req.url.includes(data.pattern!))
          .map(req => cache.delete(req))
      )
    })(),
  )
})

export {}
