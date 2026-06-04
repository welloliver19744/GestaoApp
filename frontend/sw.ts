/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope & typeof globalThis

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  /\/api\/.*/,
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
  }),
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

export {}
