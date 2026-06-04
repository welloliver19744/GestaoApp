import { useState, useEffect, useCallback } from 'react'
import { pb, groups } from '../api/client'
import type { Group, GroupCreate, User } from '../api/types'

export function useGroups() {
  const [data, setData] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const me = pb.authStore.record?.id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await groups.getFullList({ sort: '-created' })
      setData(res)
    } catch (e) {
      console.error('Erro ao carregar grupos', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (input: GroupCreate) => {
    const record = await groups.create({ ...input, created_by: me })
    setData(prev => [record, ...prev])
    return record
  }

  const update = async (id: string, input: Partial<Group>) => {
    const record = await groups.update(id, input)
    setData(prev => prev.map(g => g.id === id ? record : g))
    return record
  }

  const remove = async (id: string) => {
    await groups.delete(id)
    setData(prev => prev.filter(g => g.id !== id))
  }

  const addMember = async (groupId: string, userId: string) => {
    const group = data.find(g => g.id === groupId)
    if (!group) return
    const members = [...(group.members || []), userId]
    return await update(groupId, { members } as Partial<Group>)
  }

  const removeMember = async (groupId: string, userId: string) => {
    const group = data.find(g => g.id === groupId)
    if (!group) return
    const members = (group.members || []).filter(id => id !== userId)
    return await update(groupId, { members } as Partial<Group>)
  }

  const getMembers = async (groupId: string): Promise<User[]> => {
    const group = data.find(g => g.id === groupId)
    if (!group || !group.members?.length) return []
    try {
      const res = await pb.collection<User>('users').getFullList({
        filter: group.members.map(id => `id='${id}'`).join(' || '),
      })
      return res
    } catch {
      return []
    }
  }

  return { data, loading, create, update, remove, addMember, removeMember, getMembers, refresh: load }
}
