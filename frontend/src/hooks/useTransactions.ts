import { useState, useEffect, useCallback } from 'react'
import { pb, transactions } from '../api/client'
import type { Transaction, TransactionCreate } from '../api/types'

function toFormData(data: Record<string, unknown>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      fd.append(key, value, value.name)
    } else if (value !== undefined && value !== null) {
      fd.append(key, String(value))
    }
  }
  return fd
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
        await transactions.create(data)
      }
    } else {
      const groupId = crypto.randomUUID()
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
        return transactions.create(data)
      })
      await Promise.all(promises)
    }
    await fetch()
  }

  const update = async (tx: Transaction, payload: Partial<TransactionCreate> & { receiptFile?: File }) => {
    const { receiptFile, ...rest } = payload
    if (receiptFile) {
      const data = { ...rest, receipt: receiptFile }
      await transactions.update(tx.id, toFormData(data as unknown as Record<string, unknown>))
    } else {
      await transactions.update(tx.id, rest)
    }
    await fetch()
  }

  const remove = async (tx: Transaction) => {
    if (tx.group_id) {
      const siblings = await transactions.getFullList({ filter: `group_id='${tx.group_id}'` })
      await Promise.all(siblings.map(s => transactions.delete(s.id)))
    } else {
      await transactions.delete(tx.id)
    }
    await fetch()
  }

  const togglePaid = async (tx: Transaction) => {
    await transactions.update(tx.id, {
      paid: !tx.paid,
      paid_at: !tx.paid ? new Date().toISOString() : null,
      paid_by: !tx.paid ? pb.authStore.record?.id : null,
    })
    await fetch()
  }

  return { data, loading, refetch: fetch, create, update, remove, togglePaid }
}
