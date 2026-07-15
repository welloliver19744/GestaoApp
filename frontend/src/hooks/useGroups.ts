import { useState, useEffect, useCallback } from 'react'
import { pb } from '../api/client'
import type { Group, GroupCreate, User } from '../api/types'

async function groupsApi(path: string, init: RequestInit = {}) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/groups/${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {}),
      ...(init.headers || {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw { message: body.error || res.statusText, status: res.status, response: body }
  return body
}

export function useGroups() {
  const [data, setData] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const me = pb.authStore.record?.id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await groupsApi('list')
      setData(res.items || [])
    } catch (e) {
      console.error('Erro ao carregar grupos', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (input: GroupCreate) => {
    const record = await groupsApi('create', { method: 'POST', body: JSON.stringify({ ...input, created_by: me }) })
    setData(prev => [record as Group, ...prev])
    return record
  }

  const update = async (id: string, input: Partial<Group>) => {
    const record = await groupsApi('update', { method: 'POST', body: JSON.stringify({ id, ...input }) })
    setData(prev => prev.map(g => g.id === id ? (record as Group) : g))
    return record
  }

  const remove = async (id: string) => {
    await groupsApi('delete', { method: 'POST', body: JSON.stringify({ id }) })
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
      // Sanitiza IDs para evitar filter injection (PocketBase não suporta params nomeados no getFullList)
      const validIds = group.members.filter(id => /^[a-zA-Z0-9_-]+$/.test(id))
      if (validIds.length === 0) return []
      const res = await pb.collection<User>('users').getFullList({
        filter: validIds.map(id => `id='${id}'`).join(' || '),
      })
      return res
    } catch {
      return []
    }
  }

  return { data, loading, create, update, remove, addMember, removeMember, getMembers, refresh: load }
}
