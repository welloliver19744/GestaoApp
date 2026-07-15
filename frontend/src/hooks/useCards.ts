import { useState, useEffect, useCallback } from 'react'
import { pb } from '../api/client'
import type { Card } from '../api/types'
import { invalidateApiCache } from '../lib/swCache'

function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_POCKETBASE_URL
  if (envUrl) return envUrl
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8090'
}

export function useCards() {
  const [data, setData] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  const ensureToken = async (): Promise<string> => {
    if (pb.authStore.token) {
      try {
        await pb.collection('users').authRefresh()
      } catch {}
    }
    if (!pb.authStore.token) throw new Error('Usuário não autenticado')
    return pb.authStore.token
  }

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const token = await ensureToken().catch(() => '')
      if (!token) { setLoading(false); return }
      const res = await window.fetch(`${getBaseUrl()}/api/cards/list?_=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha ao listar cartões')
      }
      const body = await res.json()
      setData((body.items || []) as Card[])
    } catch (e) {
      console.error('Failed to fetch cards', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: { name: string; type: 'credit' | 'debit'; due_day: number }) => {
    const owner = pb.authStore.record?.id
    if (!owner) throw new Error('Usuário não autenticado')
    const token = await ensureToken()
    const res = await window.fetch(`${getBaseUrl()}/api/cards/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...payload, owner }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Falha ao criar cartão')
    }
    await invalidateApiCache('/api/cards/')
    await fetch()
  }

  const remove = async (id: string) => {
    const token = await ensureToken()
    const res = await window.fetch(`${getBaseUrl()}/api/cards/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Falha ao excluir cartão')
    }
    await invalidateApiCache('/api/cards/')
    await fetch()
  }

  return { data, loading, create, remove, refetch: fetch }
}
