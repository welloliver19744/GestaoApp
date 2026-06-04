import { useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { TransactionCard } from '../components/transactions/TransactionCard'
import { TransactionForm } from '../components/transactions/TransactionForm'
import { GroupSelector } from '../components/groups/GroupSelector'
import type { FormData } from '../components/transactions/TransactionForm'
import { ChatModal } from '../components/ai/ChatModal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DonutChart } from '../components/ui/DonutChart'
import { useToast } from '../components/ui/Toast'
import { formatCurrency, formatMonthYear } from '../lib/utils'
import { generateInsights, getAIConfig } from '../lib/ai'
import type { Transaction } from '../api/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Wallet, Plus, ChevronLeft, ChevronRight, X, Brain, MessageSquare, Loader2, Sparkles, BarChart3, Target, TrendingDown } from 'lucide-react'

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function Dashboard() {
  const { data: transactions, loading, togglePaid, create } = useTransactions({ sort: '+due_date' })
  const { data: categories, getLabel } = useCategories()
  const { data: goals } = useGoals()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  const today = new Date()
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [insights, setInsights] = useState<{ summary: string; prediction: string } | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const [searchParams] = useSearchParams()
  const activeGroup = searchParams.get('group') || ''

  const monthInputRef = useRef<HTMLInputElement>(null)
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

  const clearDayFilter = () => setSelectedDay(null)

  const filtered = useMemo(() => {
    let list = transactions.filter(tx => tx.due_date?.startsWith(monthStr))
    if (activeGroup) {
      list = list.filter(tx => tx.group === activeGroup)
    }
    if (selectedDay) {
      list = list.filter(tx => tx.due_date === selectedDay)
    }
    return list
  }, [transactions, monthStr, selectedDay, activeGroup])

  const unpaid = filtered.filter(tx => !tx.paid)
  const totalPending = unpaid.reduce((acc, tx) => acc + tx.installment_value, 0)
  const totalPaid = filtered.filter(tx => tx.paid).reduce((acc, tx) => acc + tx.installment_value, 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of filtered) {
      const label = getLabel(tx.category)
      map.set(label, (map.get(label) || 0) + tx.installment_value)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [filtered, getLabel])

  const previousMonthStr = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset - 1, 1)
    return d.toISOString().slice(0, 7)
  }, [monthOffset])

  const prevMonthTotal = useMemo(() => {
    return transactions
      .filter(tx => tx.due_date?.startsWith(previousMonthStr))
      .reduce((acc, tx) => acc + tx.installment_value, 0)
  }, [transactions, previousMonthStr])

  const last6MonthsAvg = useMemo(() => {
    let total = 0
    let count = 0
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const str = d.toISOString().slice(0, 7)
      const monthTotal = transactions
        .filter(tx => tx.due_date?.startsWith(str))
        .reduce((acc, tx) => acc + tx.installment_value, 0)
      total += monthTotal
      count++
    }
    return count > 0 ? total / count : 0
  }, [transactions])

  const projectedBalance = totalPaid - totalPending

  const budgetData = useMemo(() => {
    return categories
      .filter(c => c.budget_monthly && c.budget_monthly > 0)
      .map(c => {
        const spent = filtered
          .filter(tx => tx.category === c.id)
          .reduce((s, tx) => s + tx.installment_value, 0)
        return {
          name: c.name,
          color: c.color || '#22d3ee',
          spent,
          budget: c.budget_monthly || 1,
          pct: Math.min((spent / (c.budget_monthly || 1)) * 100, 100),
        }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [categories, filtered])

  const monthlyEvolution = useMemo(() => {
    const months: { name: string; total: number; paid: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() + monthOffset - i, 1)
      const str = d.toISOString().slice(0, 7)
      const monthTxs = transactions.filter(tx => tx.due_date?.startsWith(str))
      months.push({
        name: d.toLocaleDateString('pt-BR', { month: 'short' }),
        total: monthTxs.reduce((a, tx) => a + tx.installment_value, 0),
        paid: monthTxs.filter(tx => tx.paid).reduce((a, tx) => a + tx.installment_value, 0),
      })
    }
    return months
  }, [transactions, monthOffset])

  const monthComparison = useMemo(() => {
    if (prevMonthTotal === 0) return null
    const currentTotal = filtered.reduce((a, tx) => a + tx.installment_value, 0)
    const diff = currentTotal - prevMonthTotal
    const pct = (diff / prevMonthTotal) * 100
    return { currentTotal, prevMonthTotal, diff, pct }
  }, [filtered, prevMonthTotal])

  const anomalies = useMemo(() => {
    const result: { description: string; value: number; category: string; avg: number }[] = []
    const catTotals = new Map<string, { current: number; months: number[] }>()
    for (const tx of filtered) {
      const cat = tx.category
      if (!catTotals.has(cat)) catTotals.set(cat, { current: 0, months: [] })
      catTotals.get(cat)!.current += tx.installment_value
    }
    for (const tx of transactions) {
      const cat = tx.category
      if (!catTotals.has(cat)) catTotals.set(cat, { current: 0, months: [] })
    }
    for (let i = 1; i <= 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + monthOffset - i, 1)
      const str = d.toISOString().slice(0, 7)
      const monthCats = new Map<string, number>()
      for (const tx of transactions.filter(t => t.due_date?.startsWith(str))) {
        monthCats.set(tx.category, (monthCats.get(tx.category) || 0) + tx.installment_value)
      }
      for (const [cat, val] of monthCats) {
        if (!catTotals.has(cat)) catTotals.set(cat, { current: 0, months: [] })
        catTotals.get(cat)!.months.push(val)
      }
    }
    for (const [catId, data] of catTotals) {
      if (data.months.length < 2) continue
      const avg = data.months.reduce((a, b) => a + b, 0) / data.months.length
      if (data.current > avg * 1.4) {
        const label = getLabel(catId)
        result.push({ description: label, value: data.current, category: catId, avg })
      }
    }
    return result
  }, [transactions, filtered, monthOffset, getLabel])

  const handleGenerateInsights = async () => {
    setLoadingInsights(true)
    try {
      const prevMonth = monthOffset > 0 ? { name: formatMonthYear(new Date(today.getFullYear(), today.getMonth() + monthOffset - 1, 1)), total: prevMonthTotal } : null
      const result = await generateInsights(
        { name: formatMonthYear(currentMonth), total: filtered.reduce((a, t) => a + t.installment_value, 0), byCategory: byCategory.map(([name, value]) => ({ name, value })) },
        prevMonth,
        last6MonthsAvg,
        anomalies,
      )
      setInsights(result)
    } catch (e) {
      console.error('Insights error:', e)
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleCreate = async (data: FormData) => {
    try {
      await create({
        description: data.description,
        category: data.category,
        store: data.store || undefined,
        purchase_date: data.purchase_date,
        total_amount: data.total_amount,
        payment_type: data.payment_type,
        installment_count: data.payment_type === 'installment' ? data.installment_count : 1,
        installment_number: 1,
        installment_value: data.payment_type === 'installment' ? data.installment_value : data.total_amount,
        due_date: data.purchase_date,
        notes: data.notes || undefined,
        group: activeGroup || undefined,
      })
      toast('Transação criada', 'success')
    } catch {
      toast('Erro ao criar transação', 'error')
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100">Dashboard</h1>
          <button
            onClick={() => monthInputRef.current?.showPicker()}
            className="text-sm text-surface-400 hover:text-neon-cyan transition-colors text-left"
          >
            {formatMonthYear(currentMonth)}
          </button>
          {selectedDay && (
            <button
              onClick={clearDayFilter}
              className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-neon-amber/15 text-neon-amber text-xs font-medium hover:bg-neon-amber/25 transition-all"
            >
              <X size={12} />{formatDateBR(selectedDay)}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <GroupSelector />
          <button onClick={() => navToMonth(-1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => { setSelectedDay(null); dayInputRef.current?.showPicker() }} className="text-xs text-surface-500 hover:text-surface-300 px-2">
            Hoje
          </button>
          <button onClick={() => navToMonth(1)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800">
            <ChevronRight size={18} />
          </button>
          <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={16} /><span className="hidden sm:inline">Nova</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
              <Wallet size={18} className="text-neon-cyan" />
            </div>
            <span className="text-sm text-surface-400">A Pagar</span>
          </div>
          <p className="text-2xl font-bold text-surface-100">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-surface-500 mt-1">{unpaid.length} parcelas</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-neon-green/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-neon-green" />
            </div>
            <span className="text-sm text-surface-400">Pago no Mês</span>
          </div>
          <p className="text-2xl font-bold text-surface-100">{formatCurrency(totalPaid)}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-neon-purple/10 flex items-center justify-center">
              <BarChart3 size={18} className="text-neon-purple" />
            </div>
            <span className="text-sm text-surface-400">Saldo Projetado</span>
          </div>
          <p className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {formatCurrency(projectedBalance)}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            {projectedBalance >= 0 ? 'positivo' : 'negativo'}
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-lg ${monthComparison && monthComparison.pct > 0 ? 'bg-neon-red/10' : 'bg-neon-green/10'} flex items-center justify-center`}>
              {monthComparison && monthComparison.pct > 0
                ? <TrendingDown size={18} className="text-neon-red" />
                : <TrendingUp size={18} className="text-neon-green" />
              }
            </div>
            <span className="text-sm text-surface-400">vs Mês Anterior</span>
          </div>
          {monthComparison ? (
            <>
              <p className={`text-2xl font-bold ${monthComparison.pct > 0 ? 'text-neon-red' : 'text-neon-green'}`}>
                {monthComparison.pct > 0 ? '+' : ''}{monthComparison.pct.toFixed(1)}%
              </p>
              <p className="text-xs text-surface-500 mt-1">
                {monthComparison.pct > 0 ? 'aumento' : 'redução'} ({formatCurrency(Math.abs(monthComparison.diff))})
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-surface-400">—</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-neon-cyan" />
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Evolução Mensal</h2>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e4e4e7' }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} />
                <Line type="monotone" dataKey="paid" stroke="#4ade80" strokeWidth={2} dot={{ r: 3, fill: '#4ade80' }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-neon-amber" />
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Orçamento por Categoria</h2>
          </div>
          {budgetData.length === 0 ? (
            <p className="text-sm text-surface-500">Defina orçamentos mensais nas categorias (Settings) para acompanhar.</p>
          ) : (
            <div className="space-y-3">
              {budgetData.map(b => (
                <div key={b.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-surface-300">{b.name}</span>
                    <span className="text-surface-400">
                      {formatCurrency(b.spent)} / {formatCurrency(b.budget)}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.pct > 100 ? 'bg-neon-red' : b.pct > 80 ? 'bg-neon-amber' : 'bg-neon-cyan'
                      }`}
                      style={{ width: `${Math.min(b.pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-surface-500">
                    {b.pct > 100 ? `Excedido em ${formatCurrency(b.spent - b.budget)}` : `${b.pct.toFixed(0)}% utilizado`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Month-over-month comparison */}
      {monthComparison && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-neon-cyan" />
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Comparativo Mensal</h2>
          </div>
          {(() => {
            const prevStr = new Date(today.getFullYear(), today.getMonth() + monthOffset - 1, 1).toISOString().slice(0, 7)
            const curStr = currentMonth.toISOString().slice(0, 7)
            const curByCat = new Map<string, number>()
            const prevByCat = new Map<string, number>()
            for (const tx of transactions) {
              if (tx.due_date?.startsWith(curStr)) {
                curByCat.set(tx.category, (curByCat.get(tx.category) || 0) + tx.installment_value)
              } else if (tx.due_date?.startsWith(prevStr)) {
                prevByCat.set(tx.category, (prevByCat.get(tx.category) || 0) + tx.installment_value)
              }
            }
            const allCats = [...new Set([...curByCat.keys(), ...prevByCat.keys()])].sort()
            return (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-800">
                      <th className="text-left px-5 py-2 text-surface-500 font-medium">Categoria</th>
                      <th className="text-right px-5 py-2 text-surface-500 font-medium">Mês Atual</th>
                      <th className="text-right px-5 py-2 text-surface-500 font-medium">Mês Anterior</th>
                      <th className="text-right px-5 py-2 text-surface-500 font-medium">Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCats.map(cat => {
                      const cur = curByCat.get(cat) || 0
                      const prev = prevByCat.get(cat) || 0
                      const diff = cur - prev
                      const pct = prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0
                      return (
                        <tr key={cat} className="border-b border-surface-800/50">
                          <td className="px-5 py-2.5 text-surface-200">{getLabel(cat)}</td>
                          <td className="px-5 py-2.5 text-right text-surface-100">{formatCurrency(cur)}</td>
                          <td className="px-5 py-2.5 text-right text-surface-400">{formatCurrency(prev)}</td>
                          <td className={`px-5 py-2.5 text-right font-medium ${diff > 0 ? 'text-neon-red' : diff < 0 ? 'text-neon-green' : 'text-surface-500'}`}>
                            {diff !== 0 ? `${diff > 0 ? '+' : ''}${pct.toFixed(0)}%` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-surface-700">
                      <td className="px-5 py-2.5 text-surface-200 font-medium">Total</td>
                      <td className="px-5 py-2.5 text-right text-surface-100 font-medium">{formatCurrency([...curByCat.values()].reduce((a, b) => a + b, 0))}</td>
                      <td className="px-5 py-2.5 text-right text-surface-400 font-medium">{formatCurrency([...prevByCat.values()].reduce((a, b) => a + b, 0))}</td>
                      <td className={`px-5 py-2.5 text-right font-medium ${monthComparison.diff > 0 ? 'text-neon-red' : monthComparison.diff < 0 ? 'text-neon-green' : 'text-surface-500'}`}>
                        {monthComparison.pct !== 0 ? `${monthComparison.pct > 0 ? '+' : ''}${monthComparison.pct.toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })()}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Próximos Vencimentos</h2>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-surface-900 border border-surface-800 p-4 flex items-center gap-4 animate-pulse">
                  <div className="w-5 h-5 rounded bg-surface-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-surface-800" />
                    <div className="h-3 w-24 rounded bg-surface-800" />
                  </div>
                  <div className="h-5 w-20 rounded bg-surface-800" />
                </div>
              ))
            ) : unpaid.length === 0 ? (
              <Card><p className="text-surface-400 text-sm text-center py-4">Nada pendente neste mês 🎉</p></Card>
            ) : (
              unpaid.slice(0, 10).map(tx => (
                <TransactionCard key={tx.id} transaction={tx} onTogglePaid={handleTogglePaid} />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Gastos por Categoria</h2>
          <Card>
            {byCategory.length === 0 ? (
              <p className="text-surface-500 text-sm">Nenhum gasto no mês</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <DonutChart
                  data={byCategory.map(([name, value]) => {
                    const cat = categories.find(c => c.name === name)
                    return { name, value, color: cat?.color || '#22d3ee' }
                  })}
                />
                <div className="w-full space-y-2">
                  {byCategory.map(([name, value]) => {
                    const total = byCategory.reduce((s, [, v]) => s + v, 0) || 1
                    const pct = (value / total) * 100
                    const cat = categories.find(c => c.name === name)
                    return (
                      <div key={name} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#22d3ee' }} />
                        <span className="text-surface-400 truncate flex-1">{name}</span>
                        <span className="text-surface-100 font-medium">{pct.toFixed(0)}%</span>
                        <span className="text-surface-500">{formatCurrency(value)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Goals progress */}
      {goals.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-neon-purple" />
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Metas Financeiras</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 3).map(g => {
              const pct = Math.min((g.current_amount / g.target_amount) * 100, 100)
              return (
                <div key={g.id} className="p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
                  <p className="text-sm font-medium text-surface-200 truncate">{g.name}</p>
                  <div className="h-2 bg-surface-800 rounded-full overflow-hidden mt-2 mb-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: g.color || '#22d3ee' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-400">{pct.toFixed(0)}%</span>
                    <span className="text-surface-500">{formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {getAIConfig().apiKey && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-neon-purple" />
              <h2 className="text-sm font-semibold text-surface-200">IA Insights</h2>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="ghost" size="sm" onClick={() => setChatOpen(true)}>
                <MessageSquare size={14} />Perguntar
              </Button>
              <Button size="sm" onClick={handleGenerateInsights} disabled={loadingInsights}>
                {loadingInsights ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loadingInsights ? 'Analisando...' : insights ? 'Atualizar' : 'Gerar'}
              </Button>
            </div>
          </div>
          {insights ? (
            <div className="space-y-2 text-sm text-surface-300">
              <p>{insights.summary}</p>
              <p className="text-neon-cyan">{insights.prediction}</p>
              {anomalies.length > 0 && (
                <div className="pt-2 border-t border-surface-700">
                  <p className="text-xs text-neon-amber font-medium mb-1">⚠ Anomalias detectadas:</p>
                  <ul className="space-y-1">
                    {anomalies.map((a, i) => (
                      <li key={i} className="text-xs text-surface-400">
                        {a.description}: <span className="text-neon-amber">{formatCurrency(a.value)}</span>
                        {' '}(média: {formatCurrency(a.avg)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-500">
              Clique em "Gerar" para receber um resumo inteligente, previsão para o próximo mês e alertas de gastos fora do comum.
            </p>
          )}
        </Card>
      )}

      <TransactionForm open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      <ChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        context={{
          totalMonth: filtered.reduce((a, t) => a + t.installment_value, 0),
          byCategory: byCategory.map(([name, value]) => ({ name, value })),
          recentTransactions: unpaid.slice(0, 10).map(tx => `${tx.description} - ${formatCurrency(tx.installment_value)} (${tx.due_date})`),
        }}
      />
    </div>
  )
}
