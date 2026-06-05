import { useState, useEffect, useCallback } from 'react'
import { cards, pb } from '../api/client'
import type { Card } from '../api/types'

function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_POCKETBASE_URL
  if (envUrl) return envUrl
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8090'
}

export function useCards() {
  const [data, setData] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await cards.getFullList({
        filter: `owner = '${pb.authStore.record?.id}'`,
        sort: 'name',
      })
      setData(result as unknown as Card[])
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
    const token = pb.authStore.token
    const res = await window.fetch(`${getBaseUrl()}/api/cards/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...payload, owner }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Falha ao criar cartão')
    }
    await fetch()
  }

  const remove = async (id: string) => {
    await cards.delete(id)
    await fetch()
  }

  return { data, loading, create, remove, refetch: fetch }
}
