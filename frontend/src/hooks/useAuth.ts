import { useState, useEffect } from 'react'
import { pb } from '../api/client'
import type { User } from '../api/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(pb.authStore.record as User | null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record as User | null)
    })
    setLoading(false)
    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password)
  }

  const logout = () => {
    pb.authStore.clear()
  }

  return { user, loading, login, logout, isAuthenticated: !!user }
}
