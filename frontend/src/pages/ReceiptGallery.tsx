import { useState, useMemo, useRef } from 'react'
import { pb, transactions, categories as categoriesApi } from '../api/client'
import { Modal } from '../components/ui/Modal'
import { Card } from '../components/ui/Card'
import { formatCurrency, formatDate, formatMonthYear } from '../lib/utils'
import type { Transaction, Category } from '../api/types'
import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react'
import { useEffect } from 'react'

export function ReceiptGallery() {
  const [list, setList] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const monthInputRef = useRef<HTMLInputElement>(null)
  const dayInputRef = useRef<HTMLInputElement>(null)

  const today = new Date()
  const [monthOffset, setMonthOffset] = useState(0)
  const currentMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
    return d
  }, [monthOffset])
  const monthStr = currentMonth.toISOString().slice(0, 7)

  useEffect(() => {
    categoriesApi.getFullList().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    let filter = `receipt != ''`
    if (selectedDay) {
      filter += ` && due_date = '${selectedDay}'`
    } else {
      filter += ` && due_date ~ '${monthStr}'`
    }
    transactions.getFullList({ filter, sort: '-due_date' })
      .then(r => setList(r as unknown as Transaction[]))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [monthStr, selectedDay])

  const getLabel = (catId: string) => {
    const c = categories.find(c => c.id === catId)
    return c?.name || catId
  }

  const getColor = (catId: string) => {
    const c = categories.find(c => c.id === catId)
    return c?.color || '#22d3ee'
  }

  const navToMonth = (offset: number) => {
    setMonthOffset(p => p + offset)
    setSelectedDay(null)
  }

  const clearDayFilter = () => setSelectedDay(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100">Comprovantes</h1>
          <button
            onClick={() => monthInputRef.current?.showPicker()}
            className="text-sm text-surface-400 hover:text-neon-cyan transition-colors text-left"
          >
            {list.length} comprovante(s) em {formatMonthYear(currentMonth)}
          </button>
          {selectedDay && (
            <button
              onClick={clearDayFilter}
              className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-neon-amber/15 text-neon-amber text-xs font-medium hover:bg-neon-amber/25 transition-all"
            >
              <X size={12} />{formatDateBR(selectedDay)}
            </button>
          )}
          <input ref={monthInputRef} type="month" value={monthStr} onChange={e => { const [y, m] = e.target.value.split('-').map(Number); setMonthOffset((y - today.getFullYear()) * 12 + m - 1 - today.getMonth()); setSelectedDay(null) }} className="hidden" />
          <input ref={dayInputRef} type="date" value={today.toISOString().slice(0, 10)} onChange={e => { const p = e.target.value; if (p) { const [y, m] = p.split('-').map(Number); setMonthOffset((y - today.getFullYear()) * 12 + m - 1 - today.getMonth()); setSelectedDay(p) }}} className="hidden" />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button onClick={() => navToMonth(-1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => { setSelectedDay(null); dayInputRef.current?.showPicker() }} className="text-xs text-surface-500 hover:text-surface-300 px-2">Hoje</button>
          <button onClick={() => navToMonth(1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-surface-900 border border-surface-800 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-surface-800" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-24 rounded bg-surface-800" />
                <div className="h-3 w-16 rounded bg-surface-800" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-surface-400">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum comprovante neste mês</p>
            <p className="text-xs mt-1">Os comprovantes aparecem aqui após anexados às transações.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map(tx => {
            const thumbUrl = pb.files.getUrl(tx, tx.receipt, { thumb: '320x240' })
            return (
              <button
                key={tx.id}
                onClick={() => setSelected(tx)}
                className="rounded-xl bg-surface-900 border border-surface-800 overflow-hidden hover:border-neon-cyan/30 hover:bg-surface-800 transition-all text-left group"
              >
                <div className="aspect-[4/3] bg-surface-800 relative overflow-hidden">
                  <img
                    src={thumbUrl}
                    alt={tx.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-surface-200 truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-surface-500">{formatDate(tx.due_date)}</span>
                    <span className="text-xs font-semibold text-surface-100">{formatCurrency(tx.installment_value, tx.currency)}</span>
                  </div>
                  <span
                    className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${getColor(tx.category)}20`, color: getColor(tx.category) }}
                  >
                    {getLabel(tx.category)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.description || 'Comprovante'}>
        {selected && (
          <div>
            {selected.store && (
              <p className="text-xs text-surface-400 mb-2">{selected.store}</p>
            )}
            <img
              src={pb.files.getUrl(selected, selected.receipt)}
              alt={selected.description}
              className="w-full h-auto rounded-lg"
            />
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-surface-400">{formatDate(selected.due_date)}</span>
              <span className="font-semibold text-surface-100">{formatCurrency(selected.installment_value, selected.currency)}</span>
            </div>
            <a
              href={pb.files.getUrl(selected, selected.receipt)}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-center text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors"
            >
              Abrir em nova aba
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}
