import { useState, useEffect } from 'react'
import { categories } from '../api/client'
import type { Category } from '../api/types'

export function useCategories() {
  const [data, setData] = useState<Category[]>([])

  useEffect(() => {
    categories.getFullList().then(setData).catch(() => {
      categories.getList(1, 200).then(r => setData(r.items as unknown as Category[])).catch(console.error)
    })
  }, [])

  const getLabel = (id: string) => data.find(c => c.id === id)?.name ?? id

  return { data, getLabel }
}
