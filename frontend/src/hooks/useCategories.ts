import { useState, useEffect } from 'react'
import { categories } from '../api/client'
import type { Category } from '../api/types'

export function useCategories() {
  const [data, setData] = useState<Category[]>([])

  useEffect(() => {
    categories.getFullList().then(setData).catch(console.error)
  }, [])

  const getLabel = (id: string) => data.find(c => c.id === id)?.name ?? id

  return { data, getLabel }
}
