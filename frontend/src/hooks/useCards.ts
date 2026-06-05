import { useState, useEffect, useCallback } from 'react'
import { cards } from '../api/client'
import { pb } from '../api/client'
import type { Card } from '../api/types'

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
    await cards.create({ ...payload, owner: pb.authStore.record?.id })
    await fetch()
  }

  const remove = async (id: string) => {
    await cards.delete(id)
    await fetch()
  }

  return { data, loading, create, remove, refetch: fetch }
}
