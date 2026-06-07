import { useState, useMemo, useEffect } from 'react'
import { transactions, categories as categoriesApi } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { formatCurrency, txInMonth } from '../lib/utils'
import { exportCSV, exportPDF } from '../lib/export'
import type { Transaction, Category } from '../api/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { BarChart3, Download, ChevronLeft, ChevronRight } from 'lucide-react'

function formatShortMonth(dateStr: string) {
  const [y, m] = dateStr.split('-').map(Number)
  const d = new Date(y, m - 1)
  return d.toLocaleDateString('pt-BR', { month: 'short' })
}

export function Reports() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [allTxs, setAllTxs] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriesApi.getFullList().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    transactions.getFullList({
      filter: `due_date >= '${year}-01-01' && due_date < '${year + 1}-01-01'`,
      sort: 'due_date',
    })
      .then(r => setAllTxs(r as unknown as Transaction[]))
      .catch(() => setAllTxs([]))
      .finally(() => setLoading(false))
  }, [year])

  const getLabel = (catId: string) => {
    const c = categories.find(c => c.id === catId)
    return c?.name || catId
  }

  const getColor = (catId: string) => {
    const c = categories.find(c => c.id === catId)
    return c?.color || '#22d3ee'
  }

  const monthlyData = useMemo(() => {
    const months: { name: string; total: number; paid: number }[] = []
    for (let m = 0; m < 12; m++) {
      const prefix = `${year}-${String(m + 1).padStart(2, '0')}`
      const monthTxs = allTxs.filter(tx => txInMonth(tx, prefix))
      months.push({
        name: formatShortMonth(prefix),
        total: monthTxs.reduce((a, tx) => a + tx.installment_value, 0),
        paid: monthTxs.filter(tx => tx.paid).reduce((a, tx) => a + tx.installment_value, 0),
      })
    }
    return months
  }, [allTxs, year])

  const yearlyTotal = useMemo(() =>
    allTxs.reduce((a, tx) => a + tx.installment_value, 0),
  [allTxs])

  const paidTotal = useMemo(() =>
    allTxs.filter(tx => tx.paid).reduce((a, tx) => a + tx.installment_value, 0),
  [allTxs])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of allTxs) {
      map.set(tx.category, (map.get(tx.category) || 0) + tx.installment_value)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [allTxs])

  const handleExportCSV = () => {
    exportCSV(allTxs, categories, `gestao-casa-${year}.csv`)
  }

  const handleExportPDF = () => {
    exportPDF(allTxs, categories, `Relatório ${year}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100">Relatórios</h1>
          <p className="text-sm text-surface-400">Análise anual de gastos</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-surface-200 w-16 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronRight size={18} />
          </button>
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}><Download size={14} />CSV</Button>
            <Button size="sm" onClick={handleExportPDF}><Download size={14} />PDF</Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-surface-400 mb-1">Total do Ano</p>
          <p className="text-xl font-bold text-surface-100">{formatCurrency(yearlyTotal)}</p>
        </Card>
        <Card>
          <p className="text-xs text-surface-400 mb-1">Total Pago</p>
          <p className="text-xl font-bold text-neon-green">{formatCurrency(paidTotal)}</p>
        </Card>
        <Card>
          <p className="text-xs text-surface-400 mb-1">Pendente</p>
          <p className="text-xl font-bold text-neon-amber">{formatCurrency(yearlyTotal - paidTotal)}</p>
        </Card>
        <Card>
          <p className="text-xs text-surface-400 mb-1">Transações</p>
          <p className="text-xl font-bold text-surface-100">{allTxs.length}</p>
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-neon-cyan" />
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Gastos Mensais</h2>
        </div>
        {loading ? (
          <div className="h-48 rounded-lg bg-surface-800 animate-pulse" />
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e4e4e7' }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                />
                <Bar dataKey="total" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top categories */}
        <Card>
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">Top Categorias</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-5 rounded bg-surface-800 animate-pulse" />)}
            </div>
          ) : byCategory.length === 0 ? (
            <p className="text-sm text-surface-500">Nenhum gasto no ano</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(([catId, total]) => {
                const pct = (total / yearlyTotal) * 100
                return (
                  <div key={catId}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(catId) }} />
                        {getLabel(catId)}
                      </span>
                      <span className="text-surface-400">{pct.toFixed(0)}% · {formatCurrency(total)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getColor(catId) }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Monthly trend line */}
        <Card>
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">Tendência Mensal</h2>
          {loading ? (
            <div className="h-48 rounded-lg bg-surface-800 animate-pulse" />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1e1e2e', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#e4e4e7' }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                  />
                  <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} />
                  <Line type="monotone" dataKey="paid" stroke="#4ade80" strokeWidth={2} dot={{ r: 3, fill: '#4ade80' }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
