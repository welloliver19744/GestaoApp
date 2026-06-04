import { useState, useEffect, useCallback } from 'react'
import { pb, recurring } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, formatDate } from '../lib/utils'
import type { RecurringTransaction, RecurringCreate, PaymentType, Frequency } from '../api/types'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'

interface FormState {
  description: string
  category: string
  store: string
  total_amount: number
  payment_type: PaymentType
  installment_count: number
  installment_value: number
  frequency: Frequency
  day_of_month: number
  month: number
  notes: string
  currency: string
}

function emptyForm(): FormState {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    description: '',
    category: '',
    store: '',
    total_amount: 0,
    payment_type: 'cash',
    installment_count: 1,
    installment_value: 0,
    frequency: 'monthly',
    day_of_month: tomorrow.getDate(),
    month: 1,
    notes: '',
    currency: 'BRL',
  }
}

export function Recurring() {
  const { data: categories, getLabel } = useCategories()
  const [list, setList] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await recurring.getFullList({ sort: '-next_due' })
      setList(result as unknown as RecurringTransaction[])
    } catch (e) {
      console.error('Failed to fetch recurring', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (item: RecurringTransaction) => {
    setEditing(item)
    setForm({
      description: item.description,
      category: item.category,
      store: item.store || '',
      total_amount: item.total_amount,
      payment_type: item.payment_type,
      installment_count: item.installment_count,
      installment_value: item.installment_value,
      frequency: item.frequency,
      day_of_month: item.day_of_month,
      month: item.month || 1,
      notes: item.notes || '',
      currency: item.currency || 'BRL',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const now = new Date()
      let nextDue = editing?.next_due
      if (!editing || form.day_of_month !== editing.day_of_month || form.frequency !== editing.frequency || form.month !== (editing.month || 1)) {
        const d = new Date(now.getFullYear(), now.getMonth(), form.day_of_month)
        if (d <= now) d.setMonth(d.getMonth() + 1)
        nextDue = d.toISOString().slice(0, 10)
      }

      const payload: RecurringCreate = {
        description: form.description,
        category: form.category,
        store: form.store || undefined,
        total_amount: form.total_amount,
        currency: form.currency,
        payment_type: form.payment_type,
        installment_count: form.installment_count,
        installment_value: form.installment_value,
        frequency: form.frequency,
        day_of_month: form.day_of_month,
        month: form.frequency === 'yearly' ? form.month : undefined,
        active: editing ? editing.active : true,
        next_due: nextDue!,
        notes: form.notes || undefined,
        owner: pb.authStore.record?.id,
      }

      if (editing) {
        await recurring.update(editing.id, payload)
      } else {
        await recurring.create(payload)
      }

      setModalOpen(false)
      setEditing(null)
      await fetch()
    } catch (e) {
      console.error('Save recurring error:', e)
      alert('Erro ao salvar: ' + (e instanceof Error ? e.message : 'Erro desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (item: RecurringTransaction) => {
    if (!confirm(`Excluir recorrência "${item.description}"?`)) return
    try {
      await recurring.delete(item.id)
      await fetch()
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const handleToggleActive = async (item: RecurringTransaction) => {
    try {
      await recurring.update(item.id, { active: !item.active })
      await fetch()
    } catch (e) {
      console.error('Toggle error:', e)
    }
  }

  const isInstallment = form.payment_type === 'installment'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100">Recorrências</h1>
          <p className="text-sm text-surface-400 mt-1">{list.length} recorrência(s) cadastrada(s)</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="ghost" size="sm" onClick={fetch} title="Recarregar"><RefreshCw size={16} /></Button>
          <Button size="sm" onClick={openNew}><Plus size={16} /><span className="hidden sm:inline">Nova</span></Button>
        </div>
      </div>

      {loading ? (
        <Card><p className="text-surface-400 text-sm text-center py-4">Carregando...</p></Card>
      ) : list.length === 0 ? (
        <Card><p className="text-surface-400 text-sm text-center py-4">Nenhuma recorrência cadastrada</p></Card>
      ) : (
        <div className="space-y-3">
          {list.map(item => (
            <Card key={item.id} className="flex items-center gap-4 group">
              <button onClick={() => handleToggleActive(item)} className="shrink-0">
                {item.active
                  ? <ToggleRight size={22} className="text-neon-green" />
                  : <ToggleLeft size={22} className="text-surface-500" />
                }
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium truncate ${item.active ? 'text-surface-100' : 'text-surface-500'}`}>
                    {item.description}
                  </span>
                  <span className="shrink-0 text-xs bg-surface-800 text-neon-cyan px-2 py-0.5 rounded-full font-mono">
                    {item.frequency === 'monthly' ? 'Mensal' : 'Anual'}
                  </span>
                  {item.payment_type === 'installment' && (
                    <span className="shrink-0 text-xs bg-surface-800 text-neon-amber px-2 py-0.5 rounded-full font-mono">
                      {item.installment_count}x
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-surface-400 flex-wrap">
                  <span>{getLabel(item.category)}</span>
                  {item.store && <span>{item.store}</span>}
                  <span>Dia {item.day_of_month}{item.frequency === 'yearly' ? `/${item.month}` : ''}</span>
                  <span>Próximo: {formatDate(item.next_due)}</span>
                </div>
              </div>

              <div className="shrink-0 text-right flex items-center gap-2">
                <div>
                  <p className={`text-sm sm:text-base font-semibold ${item.active ? 'text-surface-100' : 'text-surface-500'}`}>
                    {formatCurrency(item.installment_value, item.currency)}
                  </p>
                  {item.payment_type === 'installment' && (
                    <p className="text-xs text-surface-500">Total: {formatCurrency(item.total_amount, item.currency)}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(item)} className="text-surface-500 hover:text-neon-cyan transition-colors p-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleRemove(item)} className="text-surface-500 hover:text-neon-red transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Editar Recorrência' : 'Nova Recorrência'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Descrição</label>
            <input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Categoria</label>
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
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Estabelecimento</label>
              <input
                value={form.store}
                onChange={e => set('store', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Valor</label>
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
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Frequência</label>
              <select
                value={form.frequency}
                onChange={e => set('frequency', e.target.value as Frequency)}
                className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.day_of_month}
                onChange={e => set('day_of_month', parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                required
              />
            </div>
            {form.frequency === 'yearly' && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Mês</label>
                <select
                  value={form.month}
                  onChange={e => set('month', parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {editing && (
            <div className="text-xs text-surface-400">
              Próximo vencimento atual: {formatDate(editing.next_due)}
              {(form.day_of_month !== editing.day_of_month || form.frequency !== editing.frequency || form.month !== (editing.month || 1)) && (
                <span className="text-neon-amber"> · será recalculado ao salvar</span>
              )}
            </div>
          )}

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
                  {type === 'cash' ? 'À Vista' : 'Parcelado'}
                </button>
              ))}
            </div>
          </div>

          {isInstallment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-surface-800/50 border border-surface-700">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Parcelas</label>
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Valor de Cada</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.installment_value || ''}
                  onChange={e => set('installment_value', parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
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
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
