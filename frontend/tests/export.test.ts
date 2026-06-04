import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportCSV } from '../src/lib/export'

const mockCategories = [
  { id: 'cat1', name: 'Alimentação', icon: '', color: '', budget_monthly: null },
  { id: 'cat2', name: 'Transporte', icon: '', color: '', budget_monthly: null },
]

const mockTransactions = [
  {
    id: '1',
    collectionId: 'col1',
    collectionName: 'transactions',
    created: '',
    updated: '',
    description: 'Mercado',
    category: 'cat1',
    store: 'Supermercado',
    purchase_date: '2026-06-01',
    total_amount: 250.50,
    payment_type: 'cash',
    installment_count: 1,
    installment_number: 1,
    installment_value: 250.50,
    due_date: '2026-06-10',
    paid: true,
    paid_at: '2026-06-05',
    paid_by: null,
    group_id: null,
    notes: 'Compras do mês',
    receipt: '',
    created_by: 'user1',
    currency: 'BRL',
    original_amount: null,
    shared_with: [],
  },
  {
    id: '2',
    collectionId: 'col1',
    collectionName: 'transactions',
    created: '',
    updated: '',
    description: 'Uber',
    category: 'cat2',
    store: 'Uber',
    purchase_date: '2026-06-15',
    total_amount: 35.00,
    payment_type: 'installment',
    installment_count: 3,
    installment_number: 1,
    installment_value: 11.67,
    due_date: '2026-06-15',
    paid: false,
    paid_at: null,
    paid_by: null,
    group_id: 'group1',
    notes: null,
    receipt: '',
    created_by: 'user1',
    currency: 'BRL',
    original_amount: null,
    shared_with: [],
  },
]

describe('exportCSV', () => {
  beforeEach(() => {
    // Mock createObjectURL and revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('creates a download link with CSV content', () => {
    const clickSpy = vi.fn()
    const setAttributeSpy = vi.fn()

    const mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
      setAttribute: setAttributeSpy,
    } as any

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()

    exportCSV(mockTransactions as any, mockCategories as any, 'test.csv')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(mockAnchor.download).toBe('test.csv')
  })

  it('generates CSV with header row', () => {
    // Capture Blob content
    let capturedBlob: Blob | null = null
    globalThis.URL.createObjectURL = vi.fn((blob: any) => {
      capturedBlob = blob
      return 'blob:test'
    })

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      setAttribute: vi.fn(),
    } as any
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()

    exportCSV(mockTransactions as any, mockCategories as any, 'test.csv')

    // Check the blob contains expected CSV data
    expect(capturedBlob).not.toBeNull()
    if (capturedBlob) {
      const reader = new FileReader()
      return new Promise<void>((resolve) => {
        reader.onload = () => {
          const text = reader.result as string
          expect(text).toContain('Data Vencimento')
          expect(text).toContain('Mercado')
          expect(text).toContain('Alimentação')
          expect(text).toContain('250,50')
          expect(text).toContain('1/3')
          resolve()
        }
        reader.readAsText(capturedBlob!)
      })
    }
  })
})
