import { useState, useEffect, useCallback } from 'react'
import { pb } from '../api/client'
import type { Goal, GoalCreate } from '../api/types'

const goalsCollection = pb.collection<Goal>('goals')

export function useGoals() {
  const [data, setData] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await goalsCollection.getList(1, 50, { sort: '-created' })
      setData(result.items as unknown as Goal[])
    } catch (e) {
      console.error('Failed to fetch goals', e)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: GoalCreate) => {
    await goalsCollection.create({
      ...payload,
      current_amount: payload.current_amount || 0,
      owner: pb.authStore.record?.id,
    })
    await fetch()
  }

  const update = async (goal: Goal, payload: Partial<GoalCreate>) => {
    await goalsCollection.update(goal.id, payload)
    await fetch()
  }

  const remove = async (goal: Goal) => {
    await goalsCollection.delete(goal.id)
    await fetch()
  }

  const updateProgress = async (goal: Goal, amount: number) => {
    await goalsCollection.update(goal.id, { current_amount: goal.current_amount + amount })
    await fetch()
  }

  return { data, loading, refetch: fetch, create, update, remove, updateProgress }
}
