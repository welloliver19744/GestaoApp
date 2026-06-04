export type PaymentType = 'cash' | 'installment'

export interface Transaction {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string

  description: string
  category: string
  store: string
  purchase_date: string
  total_amount: number
  payment_type: PaymentType
  installment_count: number
  installment_number: number
  installment_value: number
  due_date: string
  paid: boolean
  paid_at: string | null
  paid_by: string | null
  group_id: string | null
  notes: string | null
  receipt: string
  created_by: string
  currency: string
  original_amount: number | null
  shared_with: string[]
  group: string
}

export interface Group {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string

  name: string
  description: string
  members: string[]
  created_by: string
}

export interface TransactionCreate {
  description: string
  category: string
  store?: string
  purchase_date: string
  total_amount: number
  payment_type: PaymentType
  installment_count: number
  installment_number: number
  installment_value: number
  due_date: string
  paid?: boolean
  group_id?: string
  notes?: string
  currency?: string
  created_by?: string
  shared_with?: string[]
  group?: string
}

export interface GroupCreate {
  name: string
  description?: string
  members?: string[]
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  budget_monthly: number | null
}

export interface User {
  id: string
  email: string
  name: string
  avatar: string
}

export type Frequency = 'monthly' | 'yearly'

export interface RecurringTransaction {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string

  description: string
  category: string
  store: string
  total_amount: number
  payment_type: PaymentType
  installment_count: number
  installment_value: number
  frequency: Frequency
  day_of_month: number
  month: number | null
  active: boolean
  next_due: string
  notes: string | null
  owner: string
  currency: string
}

export interface Goal {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string

  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  icon: string
  owner: string
  goal_type?: string
  initial_amount?: number
}

export interface GoalCreate {
  name: string
  target_amount: number
  current_amount?: number
  deadline?: string
  color?: string
  icon?: string
  goal_type?: string
  initial_amount?: number
}

export interface RecurringCreate {
  description: string
  category: string
  store?: string
  total_amount: number
  payment_type: PaymentType
  installment_count: number
  installment_value: number
  frequency: Frequency
  day_of_month: number
  month?: number
  active?: boolean
  next_due: string
  notes?: string
  owner?: string
  currency?: string
}
