import { useState, useEffect, useCallback } from 'react'
import { pb } from '../api/client'

const VAPID_PUBLIC_KEY = 'BK1b9TxFhct713H7tPGtLf_LPqDFWyH_vKkxsDcah5tQAppa_2Lr71QbAOGqAIwcyVuWiELnOyouZRzTNk-Ujws'

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unavailable'>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(isSupported)
    if (!isSupported) {
      setPermission('unavailable')
      return
    }
    setPermission(Notification.permission)
  }, [])

  const getExistingSubscription = useCallback(async () => {
    if (!pb.authStore.record?.id) return null
    try {
      const result = await pb.collection('push_subscriptions').getFullList({
        filter: `user='${pb.authStore.record.id}' && enabled=true`,
      })
      return result.length > 0
    } catch {
      return null
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      })

      const existing = await pb.collection('push_subscriptions').getFullList({
        filter: `user='${pb.authStore.record!.id}'`,
      })
      for (const sub of existing) {
        await pb.collection('push_subscriptions').delete(sub.id)
      }

      await pb.collection('push_subscriptions').create({
        user: pb.authStore.record!.id,
        subscription: JSON.parse(JSON.stringify(sub)),
        enabled: true,
      })

      setSubscribed(true)
    } catch (e) {
      console.error('Push subscribe error:', e)
    } finally {
      setLoading(false)
    }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    if (!pb.authStore.record?.id) return
    setLoading(true)
    try {
      const existing = await pb.collection('push_subscriptions').getFullList({
        filter: `user='${pb.authStore.record.id}'`,
      })
      for (const sub of existing) {
        await pb.collection('push_subscriptions').delete(sub.id)
      }
      setSubscribed(false)
    } catch (e) {
      console.error('Push unsubscribe error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pb.authStore.record?.id) {
      getExistingSubscription().then((result) => {
        setSubscribed(!!result)
      })
    }
  }, [pb.authStore.record?.id, getExistingSubscription])

  return {
    supported,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
  }
}
