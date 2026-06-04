import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionCard } from '../components/transactions/TransactionCard'
import { TransactionForm } from '../components/transactions/TransactionForm'
import { GroupSelector } from '../components/groups/GroupSelector'
import type { FormData } from '../components/transactions/TransactionForm'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import { TransactionCardSkeleton } from '../components/ui/Skeleton'
import { Plus, ChevronLeft, ChevronRight, Download, Search, Filter, Square, CheckSquare } from 'lucide-react'
import { PREDEFINED_TAGS, parseTags } from '../lib/tags'
import { formatMonthYear } from '../lib/utils'
import { exportCSV, exportPDF } from '../lib/export'
import type { Transaction } from '../api/types'
import type { Category } from '../api/types'
import { pb, categories as categoriesApi } from '../api/client'


export function Transactions() {
  const { data: transactions, loading, togglePaid, create, update, remove } = useTransactions({ sort: '-purchase_date' })
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [filterTag, setFilterTag] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [stores, setStores] = useState<string[]>([])
  const [showStoreSuggestions, setShowStoreSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCategory, setBulkCategory] = useState('')

  const [searchParams] = useSearchParams()
  const activeGroup = searchParams.get('group') || ''

  useEffect(() => {
    categoriesApi.getFullList().then(setCategories).catch((e) => { console.error('Erro ao carregar categorias', e); toast('Erro ao carregar categorias', 'error') })
  }, [])

  // Collect unique store names for autocomplete
  useEffect(() => {
    const unique = [...new Set(transactions.map(tx => tx.store).filter(Boolean))] as string[]
    setStores(unique)
  }, [transactions])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowStoreSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleExportCSV = () => {
    setExportOpen(false)
    const month = formatMonthYear(currentMonth).replace(/ /g, '-')
    exportCSV(filtered, categories, `gestao-casa-${month}.csv`)
  }

  const handleExportPDF = () => {
    setExportOpen(false)
    const month = formatMonthYear(currentMonth)
    exportPDF(filtered, categories, month)
  }

  const today = new Date()
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const dayInputRef = useRef<HTMLInputElement>(null)
  const currentMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
    return d
  }, [monthOffset])

  const monthStr = currentMonth.toISOString().slice(0, 7)

  const navToMonth = (offset: number) => {
    setMonthOffset(p => p + offset)
    setSelectedDay(null)
  }

  const filtered = useMemo(() => {
    let list = transactions.filter(tx => tx.due_date?.startsWith(monthStr))
    if (activeGroup) {
      list = list.filter(tx => tx.group === activeGroup)
    }
    if (selectedDay) {
      list = list.filter(tx => tx.due_date === selectedDay)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(tx =>
        tx.description.toLowerCase().includes(q) ||
        (tx.store || '').toLowerCase().includes(q) ||
        (tx.notes || '').toLowerCase().includes(q)
      )
    }
    if (filterCategory) {
      list = list.filter(tx => tx.category === filterCategory)
    }
    if (filterPaid === 'paid') {
      list = list.filter(tx => tx.paid)
    } else if (filterPaid === 'unpaid') {
      list = list.filter(tx => !tx.paid)
    }
    if (filterTag) {
      list = list.filter(tx => parseTags(tx.tags).includes(filterTag))
    }
    return list
  }, [transactions, monthStr, selectedDay, searchQuery, filterCategory, filterPaid, filterTag, activeGroup])

  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (tx: Transaction) => { setEditing(tx); setModalOpen(true) }

  const handleSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await update(editing, {
          description: data.description,
          category: data.category,
          store: data.store || undefined,
          purchase_date: data.purchase_date,
          total_amount: data.total_amount,
          currency: data.currency,
          notes: data.notes || undefined,
          receiptFile: data.receiptFile || undefined,
        })
        toast('Transação atualizada', 'success')
      } else {
        await create({
          description: data.description,
          category: data.category,
          store: data.store || undefined,
          purchase_date: data.purchase_date,
          total_amount: data.total_amount,
          currency: data.currency,
          payment_type: data.payment_type,
          installment_count: data.payment_type === 'installment' ? data.installment_count : 1,
          installment_number: 1,
          installment_value: data.payment_type === 'installment' ? data.installment_value : data.total_amount,
          due_date: data.purchase_date,
          notes: data.notes || undefined,
          receiptFile: data.receiptFile || undefined,
          created_by: pb.authStore.record?.id,
          group: activeGroup || undefined,
        })
        toast('Transação criada', 'success')
      }
    } catch {
      toast('Erro ao salvar transação', 'error')
    }
  }

  const handleDelete = async (tx: Transaction) => {
    const msg = tx.group_id
      ? `Excluir TODAS as ${tx.installment_count} parcelas de "${tx.description}"?`
      : `Excluir "${tx.description}"?`
    if (!confirm(msg)) return
    try {
      await remove(tx)
      toast('Transação excluída', 'success')
    } catch {
      toast('Erro ao excluir', 'error')
    }
  }

  const handleTogglePaid = async (tx: Transaction) => {
    try {
      await togglePaid(tx)
      toast(tx.paid ? 'Marcada como pendente' : 'Marcada como paga', 'success')
    } catch {
      toast('Erro ao alterar status', 'error')
    }
  }

  const handleSearchFocus = () => {
    if (stores.length > 0) setShowStoreSuggestions(true)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(tx => tx.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Excluir ${selected.size} transação(ões)?`)) return
    try {
      await Promise.all(filtered.filter(tx => selected.has(tx.id)).map(tx => pb.collection('transactions').delete(tx.id)))
      toast(`${selected.size} transação(ões) excluída(s)`, 'success')
      setSelected(new Set())
    } catch {
      toast('Erro ao excluir', 'error')
    }
  }

  const handleBulkTogglePaid = async (paid: boolean) => {
    if (selected.size === 0) return
    try {
      await Promise.all(filtered.filter(tx => selected.has(tx.id)).map(tx => pb.collection('transactions').update(tx.id, { paid, paid_at: paid ? new Date().toISOString() : null, paid_by: paid ? pb.authStore.record?.id : null })))
      toast(`${selected.size} transação(ões) ${paid ? 'pagas' : 'pendentes'}`, 'success')
      setSelected(new Set())
    } catch {
      toast('Erro ao atualizar', 'error')
    }
  }

  const handleBulkCategory = async () => {
    if (!bulkCategory || selected.size === 0) return
    try {
      await Promise.all(filtered.filter(tx => selected.has(tx.id)).map(tx => pb.collection('transactions').update(tx.id, { category: bulkCategory })))
      toast(`Categoria alterada em ${selected.size} transação(ões)`, 'success')
      setSelected(new Set())
      setBulkCategory('')
    } catch {
      toast('Erro ao atualizar', 'error')
    }
  }

  const handleStoreSelect = (store: string) => {
    setSearchQuery(store)
    setShowStoreSuggestions(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100">Transações</h1>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <GroupSelector />
          <button onClick={() => navToMonth(-1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => { setSelectedDay(null); dayInputRef.current?.showPicker() }} className="text-xs text-surface-500 hover:text-surface-300 px-2">Hoje</button>
          <button onClick={() => navToMonth(1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronRight size={18} />
          </button>
          <div ref={exportRef} className="relative">
            <Button size="sm" variant="secondary" onClick={() => setExportOpen(!exportOpen)}>
              <Download size={14} /><span className="hidden sm:inline">Exportar</span>
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg bg-surface-800 border border-surface-700 shadow-xl overflow-hidden">
                <button onClick={handleExportCSV} className="w-full px-4 py-2.5 text-xs text-left text-surface-200 hover:bg-surface-700 transition-colors">
                  Exportar CSV (.csv)
                </button>
                <button onClick={handleExportPDF} className="w-full px-4 py-2.5 text-xs text-left text-surface-200 hover:bg-surface-700 transition-colors border-t border-surface-700">
                  Exportar PDF (.pdf)
                </button>
              </div>
            )}
          </div>
          <Button size="sm" onClick={openNew}><Plus size={16} /><span className="hidden sm:inline">Nova</span></Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div ref={searchRef} className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder="Buscar por descrição, estabelecimento ou observação..."
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
            {showStoreSuggestions && searchQuery.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-lg bg-surface-800 border border-surface-700 shadow-xl max-h-40 overflow-y-auto">
                {stores.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(s => (
                  <button
                    key={s}
                    onClick={() => handleStoreSelect(s)}
                    className="w-full px-4 py-2 text-xs text-left text-surface-300 hover:bg-surface-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-3 rounded-lg border transition-all ${
              showFilters || filterCategory || filterPaid !== 'all'
                ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan'
                : 'bg-surface-900 border-surface-700 text-surface-400 hover:text-surface-200'
            }`}
          >
            <Filter size={16} />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="h-8 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="">Todas categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterPaid}
              onChange={e => setFilterPaid(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="h-8 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="all">Todas</option>
              <option value="unpaid">Pendentes</option>
              <option value="paid">Pagas</option>
            </select>
            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="h-8 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-200 text-xs focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="">Todas tags</option>
              {PREDEFINED_TAGS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {(filterCategory || filterPaid !== 'all' || filterTag || searchQuery) && (
              <button
                onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterPaid('all'); setFilterTag('') }}
                className="h-8 px-3 rounded-lg bg-surface-800 text-surface-400 text-xs hover:text-surface-200 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <TransactionCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <Card><p className="text-surface-400 text-sm text-center py-4">Nenhuma transação encontrada</p></Card>
        ) : (
          <>
            {/* Selection toolbar */}
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors"
              >
                {selected.size === filtered.length ? <CheckSquare size={14} className="text-neon-cyan" /> : <Square size={14} />}
                {selected.size === filtered.length ? 'Desmarcar todos' : `Selecionar todos (${filtered.length})`}
              </button>
              {selected.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-400">{selected.size} selecionado(s)</span>
                  <button onClick={() => handleBulkTogglePaid(true)} className="h-7 px-2.5 rounded-lg bg-neon-green/10 text-neon-green text-xs hover:bg-neon-green/20 transition-colors">
                    Pagar
                  </button>
                  <button onClick={() => handleBulkTogglePaid(false)} className="h-7 px-2.5 rounded-lg bg-surface-800 text-surface-300 text-xs hover:bg-surface-700 transition-colors">
                    Pendente
                  </button>
                  <select
                    value={bulkCategory}
                    onChange={e => setBulkCategory(e.target.value)}
                    className="h-7 px-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-xs focus:outline-none focus:border-neon-cyan/50"
                  >
                    <option value="">Categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {bulkCategory && (
                    <button onClick={handleBulkCategory} className="h-7 px-2.5 rounded-lg bg-neon-cyan/10 text-neon-cyan text-xs hover:bg-neon-cyan/20 transition-colors">
                      Aplicar
                    </button>
                  )}
                  <button onClick={handleBulkDelete} className="h-7 px-2.5 rounded-lg bg-neon-red/10 text-neon-red text-xs hover:bg-neon-red/20 transition-colors">
                    Excluir
                  </button>
                </div>
              )}
            </div>
            {filtered.map(tx => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onTogglePaid={handleTogglePaid}
                onEdit={openEdit}
                onDelete={handleDelete}
                selected={selected.has(tx.id)}
                onSelect={toggleSelect}
              />
            ))}
          </>
        )}
      </div>

      <TransactionForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  )
}
