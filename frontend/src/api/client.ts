import PocketBase from 'pocketbase'
import type { Transaction, Category, RecurringTransaction } from './types'

const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090'

export const pb = new PocketBase(PB_URL)

pb.autoCancellation(false)

export const transactions = pb.collection<Transaction>('transactions')
export const categories = pb.collection<Category>('categories')
export const recurring = pb.collection<RecurringTransaction>('recurring_transactions')
