import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useCategories } from '../../hooks/useCategories'
import { scanBillWithAI, autoCategorize, getAIConfig } from '../../lib/ai'
import { compressImage } from '../../lib/utils'
import { pb, transactions as transactionsApi } from '../../api/client'
import type { Transaction, PaymentType } from '../../api/types'
import { Camera, Loader2, Wand2, X } from 'lucide-react'

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  initial?: Transaction | null
}

export interface FormData {
  description: string
  category: string
  store: string
  purchase_date: string
  total_amount: number
  payment_type: PaymentType
  installment_count: number
  installment_value: number
  notes: string
  currency: string
  receiptFile?: File | null
}

function emptyForm(): FormData {
  return {
    description: '',
    category: '',
    store: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    total_amount: 0,
    payment_type: 'cash',
    installment_count: 1,
    installment_value: 0,
    notes: '',
    currency: 'BRL',
    receiptFile: null,
  }
}

export function TransactionForm({ open, onClose, onSubmit, initial }: TransactionFormProps) {
  const { data: categories } = useCategories()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>(() => {
    if (!initial) return emptyForm()
    return {
      description: initial.description,
      category: initial.category,
      store: initial.store || '',
      purchase_date: initial.purchase_date.slice(0, 10),
      total_amount: initial.total_amount,
      payment_type: initial.payment_type,
      installment_count: initial.installment_count,
      installment_value: initial.installment_value,
      notes: initial.notes || '',
      currency: initial.currency || 'BRL',
      receiptFile: null,
    }
  })
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(
    initial?.receipt ? pb.files.getUrl(initial, initial.receipt, { thumb: '640x480' }) : null,
  )
  const [stores, setStores] = useState<string[]>([])
  const [showStoreSuggestions, setShowStoreSuggestions] = useState(false)
  const storeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transactionsApi.getFullList({ fields: 'store', filter: "store != ''" }).then(r => {
      const unique = [...new Set(r.map((tx: any) => tx.store).filter(Boolean))] as string[]
      setStores(unique)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setShowStoreSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleScan = async (file: File) => {
    setScanning(true)
    try {
      const compressed = await compressImage(file, 1200, 0.7)
      const result = await scanBillWithAI(compressed.base64)
      const matchedCat = categories.find(c =>
        c.name.toLowerCase().trim() === result.category.toLowerCase().trim()
      )?.id || result.category
      setForm(prev => ({
        ...prev,
        description: result.description || prev.description,
        store: result.store || prev.store,
        purchase_date: result.due_date || prev.purchase_date,
        total_amount: result.amount || prev.total_amount,
        category: matchedCat || prev.category,
        receiptFile: compressed.file,
        notes: `Importado de conta: ${file.name}`,
      }))
      setReceiptPreview(URL.createObjectURL(compressed.file))
    } catch (e) {
      alert('Erro ao ler conta: ' + (e instanceof Error ? e.message : 'erro desconhecido'))
    } finally {
      setScanning(false)
    }
  }

  const clearReceipt = () => {
    setForm(prev => ({ ...prev, receiptFile: null }))
    setReceiptPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
      if (!initial) setForm(emptyForm())
      setReceiptPreview(null)
    } finally {
      setSaving(false)
    }
  }

  const handleAutoCategorize = async () => {
    if (!form.description.trim() || !categories.length) return
    setCategorizing(true)
    try {
      const catId = await autoCategorize(form.description, categories)
      if (catId) set('category', catId)
    } catch (e) {
      console.error('Auto-categorize error:', e)
    } finally {
      setCategorizing(false)
    }
  }

  const aiConfig = getAIConfig()

  const isInstallment = form.payment_type === 'installment'

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar Transação' : 'Nova Transação'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-surface-300">Descrição</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning || !aiConfig.apiKey}
              className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 disabled:text-surface-600 disabled:cursor-not-allowed transition-colors"
              title={!aiConfig.apiKey ? 'Configure a API Key em Configurações' : 'Escanear conta'}
            >
              {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {scanning ? 'Lendo...' : 'Scan'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { handleScan(f); e.target.value = '' } }}
          />
          {receiptPreview && (
            <div className="relative mb-3">
              <img
                src={receiptPreview}
                alt="Comprovante"
                className="w-full max-h-40 object-contain rounded-lg bg-surface-900 border border-surface-700"
              />
              <button
                type="button"
                onClick={clearReceipt}
                className="absolute top-2 right-2 p-1 rounded-full bg-surface-900/80 text-surface-300 hover:text-surface-100 hover:bg-surface-800 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <input
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-surface-300">Categoria</label>
              {!initial && aiConfig.apiKey && form.description.trim() && (
                <button
                  type="button"
                  onClick={handleAutoCategorize}
                  disabled={categorizing}
                  className="flex items-center gap-1 text-xs text-neon-purple hover:text-neon-purple/80 disabled:text-surface-600 disabled:cursor-not-allowed transition-colors"
                >
                  {categorizing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {categorizing ? 'Analisando...' : 'Auto'}
                </button>
              )}
            </div>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              required
            >
              <option value="">Selecione</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div ref={storeRef} className="relative">
            <label className="block text-sm font-medium text-surface-300 mb-1">Estabelecimento</label>
            <input
              value={form.store}
              onChange={e => { set('store', e.target.value); setShowStoreSuggestions(true) }}
              onFocus={() => { if (stores.length > 0) setShowStoreSuggestions(true) }}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              autoComplete="off"
            />
            {showStoreSuggestions && form.store.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg bg-surface-800 border border-surface-700 shadow-xl max-h-40 overflow-y-auto">
                {stores.filter(s => s.toLowerCase().includes(form.store.toLowerCase())).slice(0, 5).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { set('store', s); setShowStoreSuggestions(false) }}
                    className="w-full px-3 py-2 text-xs text-left text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Data da Compra</label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={e => set('purchase_date', e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Valor Total</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.total_amount || ''}
              onChange={e => {
                const val = parseFloat(e.target.value) || 0
                set('total_amount', val)
                if (isInstallment && form.installment_count > 0) {
                  set('installment_value', Math.round((val / form.installment_count) * 100) / 100)
                }
              }}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Moeda</label>
            <select
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
            >
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="ARS">ARS ($)</option>
              <option value="CLP">CLP ($)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">Tipo de Pagamento</label>
          <div className="flex gap-2">
            {(['cash', 'installment'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  set('payment_type', type)
                  if (type === 'cash') {
                    set('installment_count', 1)
                    set('installment_value', form.total_amount)
                  } else if (form.installment_count === 1) {
                    set('installment_count', 2)
                  }
                }}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
                  form.payment_type === type
                    ? 'bg-neon-cyan text-surface-950 shadow-lg shadow-neon-cyan/20'
                    : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                }`}
              >
                {type === 'cash' ? 'À Vista' : 'A Prazo'}
              </button>
            ))}
          </div>
        </div>

        {isInstallment && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-surface-800/50 border border-surface-700">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Total de Parcelas</label>
              <input
                type="number"
                min="2"
                max="120"
                value={form.installment_count}
                onChange={e => {
                  const count = parseInt(e.target.value) || 1
                  set('installment_count', count)
                  set('installment_value', Math.round((form.total_amount / count) * 100) / 100)
                }}
                className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Valor de Cada</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.installment_value || ''}
                onChange={e => set('installment_value', parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">Observações</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Salvando...' : initial ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
