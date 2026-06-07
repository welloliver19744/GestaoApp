import { useState, useEffect, useCallback } from 'react'
import { pb, transactions } from '../api/client'
import type { Transaction, TransactionCreate } from '../api/types'
import { invalidateApiCache } from '../lib/swCache'

const windowFetch: typeof fetch = (...args) => fetch(...args)

async function pbCreate(data: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v
  }
  const bodyStr = JSON.stringify(clean)
  console.log('[PBCREATE] payload:', bodyStr)
  const url = pb.buildURL('/api/collections/transactions/records')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': pb.authStore.token || '',
    },
    body: bodyStr,
  })
  const respBody = await res.json().catch(() => ({ message: res.statusText }))
  console.log('[PBCREATE] response:', res.status, JSON.stringify(respBody))
  if (!res.ok) {
    const err: Record<string, unknown> = { data: respBody.data || {}, response: respBody, message: respBody.message || 'Error', status: res.status }
    ;(err as unknown as { payload: string }).payload = bodyStr
    throw err
  }
  return respBody
}

function toFormData(data: Record<string, unknown>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      fd.append(key, value, value.name)
    } else if (Array.isArray(value)) {
      fd.append(key, JSON.stringify(value))
    } else if (value !== undefined && value !== null) {
      fd.append(key, String(value))
    }
  }
  return fd
}

function safeUUID(): string {
  try { return crypto.randomUUID() } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }
}

interface UseTransactionsOptions {
  filter?: string
  sort?: string
}

export function useTransactions(opts: UseTransactionsOptions = {}) {
  const { filter = '', sort = '-due_date' } = opts
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await transactions.getList(1, 200, {
        filter: filter || undefined,
        sort,
      })
      setData(result.items as unknown as Transaction[])
    } catch (e) {
      console.error('Failed to fetch transactions', e)
    } finally {
      setLoading(false)
    }
  }, [filter, sort])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: TransactionCreate & { receiptFile?: File }) => {
    const { receiptFile, ...rest } = payload
    if (!rest.created_by && pb.authStore.record?.id) {
      rest.created_by = pb.authStore.record.id
    }
    console.log('[TX_CREATE] start', { desc: rest.description, total: rest.total_amount, type: rest.payment_type, store: rest.store, pm: rest.payment_method, category: rest.category, group: rest.group })
    if (payload.payment_type === 'cash') {
      const data = {
        ...rest,
        installment_count: 1,
        installment_number: 1,
        installment_value: payload.total_amount,
        due_date: payload.purchase_date,
        receipt: receiptFile || undefined,
      }
      if (receiptFile) {
        await transactions.create(toFormData(data as unknown as Record<string, unknown>))
      } else {
        await pbCreate(data)
      }
    } else {
      const groupId = safeUUID()
      const val = payload.installment_value
      const promises = Array.from({ length: payload.installment_count }, (_, i) => {
        const due = new Date(payload.purchase_date)
        due.setMonth(due.getMonth() + i + 1)
        const data = {
          ...rest,
          installment_number: i + 1,
          installment_value: val,
          due_date: due.toISOString().slice(0, 10),
          group_id: groupId,
          receipt: receiptFile || undefined,
        }
        if (receiptFile) {
          return transactions.create(toFormData(data as unknown as Record<string, unknown>))
        }
        return pbCreate(data)
      })
      await Promise.all(promises)
    }
    await invalidateApiCache('/api/collections/transactions')
    await fetch()
    if (payload.store) {
      try {
        await windowFetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/stores/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {}) },
          body: JSON.stringify({ name: payload.store, owner: pb.authStore.record?.id }),
        })
      } catch {}
    }
  }

  const update = async (tx: Transaction, payload: Partial<TransactionCreate> & { receiptFile?: File }) => {
    const { receiptFile, ...rest } = payload
    if (receiptFile) {
      const data = { ...rest, receipt: receiptFile }
      await transactions.update(tx.id, toFormData(data as unknown as Record<string, unknown>))
    } else {
      await transactions.update(tx.id, rest)
    }
    await invalidateApiCache('/api/collections/transactions')
    await fetch()
    if (payload.store) {
      try {
        await windowFetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/stores/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {}) },
          body: JSON.stringify({ name: payload.store, owner: pb.authStore.record?.id }),
        })
      } catch {}
    }
  }

  const remove = async (tx: Transaction) => {
    if (tx.group_id) {
      const siblings = await transactions.getList(1, 200, { filter: `group_id='${tx.group_id}'` })
      await Promise.all(siblings.items.map(s => transactions.delete(s.id)))
    } else {
      await transactions.delete(tx.id)
    }
    await invalidateApiCache('/api/collections/transactions')
    await fetch()
  }

  const togglePaid = async (tx: Transaction) => {
    await transactions.update(tx.id, {
      paid: !tx.paid,
      paid_at: !tx.paid ? new Date().toISOString() : null,
      paid_by: !tx.paid ? pb.authStore.record?.id : null,
    })
    await invalidateApiCache('/api/collections/transactions')
    await fetch()
  }

  return { data, loading, refetch: fetch, create, update, remove, togglePaid }
}
