import PocketBase from 'pocketbase'
import type { Transaction, Category, RecurringTransaction, Group } from './types'

function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_POCKETBASE_URL
  if (envUrl) return envUrl
  // Em produção, usa a mesma origem do frontend (Nginx proxy /api/)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return origin || 'http://localhost:8090'
}

export const pb = new PocketBase(getBaseUrl())

pb.autoCancellation(false)

export const transactions = pb.collection<Transaction>('transactions')
export const categories = pb.collection<Category>('categories')
export const recurring = pb.collection<RecurringTransaction>('recurring_transactions')
export const groups = pb.collection<Group>('groups')
