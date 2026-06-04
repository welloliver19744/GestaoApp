import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { formatCurrency } from '../lib/utils'
import { Plus, Target, Trash2, PiggyBank, Home, Plane, Car, GraduationCap, Heart, Shield, Zap } from 'lucide-react'
import type { Goal, GoalCreate } from '../api/types'

const ICONS: Record<string, typeof PiggyBank> = {
  piggy: PiggyBank,
  home: Home,
  plane: Plane,
  car: Car,
  education: GraduationCap,
  heart: Heart,
  shield: Shield,
  zap: Zap,
}

function GoalIcon({ icon, color }: { icon: string; color?: string }) {
  const Icon = ICONS[icon] || Target
  return <Icon size={20} style={{ color: color || '#22d3ee' }} />
}

export function Goals() {
  const { data: goals, loading, create, update, remove, updateProgress } = useGoals()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalCreate>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    color: '#22d3ee',
    icon: 'piggy',
  })
  const [addingAmount, setAddingAmount] = useState<{ id: string; val: string } | null>(null)

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', target_amount: 0, current_amount: 0, color: '#22d3ee', icon: 'piggy' })
    setShowForm(true)
  }

  const openEdit = (g: Goal) => {
    setEditing(g)
    setForm({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, color: g.color || '#22d3ee', icon: g.icon || 'piggy', deadline: g.deadline || undefined })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name || form.target_amount <= 0) return
    try {
      if (editing) {
        await update(editing, form)
        toast('Meta atualizada', 'success')
      } else {
        await create(form)
        toast('Meta criada', 'success')
      }
      setShowForm(false)
    } catch {
      toast('Erro ao salvar meta', 'error')
    }
  }

  const handleDelete = async (g: Goal) => {
    if (!confirm(`Excluir a meta "${g.name}"?`)) return
    try {
      await remove(g)
      toast('Meta excluída', 'success')
    } catch {
      toast('Erro ao excluir', 'error')
    }
  }

  const handleAddAmount = async (g: Goal) => {
    if (!addingAmount || addingAmount.id !== g.id) return
    const val = parseFloat(addingAmount.val)
    if (isNaN(val) || val <= 0) return
    try {
      await updateProgress(g, val)
      toast(`R$ ${val.toFixed(2)} adicionado à "${g.name}"`, 'success')
      setAddingAmount(null)
    } catch {
      toast('Erro ao atualizar', 'error')
    }
  }

  const COLORS = ['#22d3ee', '#4ade80', '#f97316', '#fb7185', '#c084fc', '#fbbf24', '#34d399', '#a78bfa']
  const ICON_OPTIONS = [
    { value: 'piggy', label: 'Cofre' },
    { value: 'home', label: 'Casa' },
    { value: 'car', label: 'Carro' },
    { value: 'plane', label: 'Viagem' },
    { value: 'education', label: 'Educação' },
    { value: 'heart', label: 'Saúde' },
    { value: 'shield', label: 'Reserva' },
    { value: 'zap', label: 'Outro' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100">Metas Financeiras</h1>
          <p className="text-sm text-surface-400">{goals.length} meta(s) ativa(s)</p>
        </div>
        <Button size="sm" onClick={openNew} className="self-end sm:self-auto"><Plus size={16} /><span className="hidden sm:inline">Nova Meta</span></Button>
      </div>

      {showForm && (
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-surface-200">{editing ? 'Editar' : 'Nova'} Meta</h2>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nome da meta"
            className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:border-neon-cyan/50"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-surface-400 mb-1 block">Valor Alvo</label>
              <input
                type="number"
                value={form.target_amount || ''}
                onChange={e => setForm(f => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="R$ 0,00"
                className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1 block">Já guardado</label>
              <input
                type="number"
                value={form.current_amount || ''}
                onChange={e => setForm(f => ({ ...f, current_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="R$ 0,00"
                className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-surface-400 mb-1 block">Prazo (opcional)</label>
              <input
                type="date"
                value={form.deadline || ''}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value || undefined }))}
                className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 text-sm focus:outline-none focus:border-neon-cyan/50"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1 block">Ícone</label>
              <select
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:border-neon-cyan/50"
              >
                {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-surface-400 mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-surface-900 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl bg-surface-900 border border-surface-800 p-5 animate-pulse space-y-3">
              <div className="h-5 w-32 rounded bg-surface-800" />
              <div className="h-3 w-48 rounded bg-surface-800" />
              <div className="h-2 rounded-full bg-surface-800" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-surface-400">
            <Target size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma meta cadastrada</p>
            <p className="text-xs mt-1">Crie sua primeira meta financeira!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map(g => {
            const pct = Math.min((g.current_amount / g.target_amount) * 100, 100)
            const remaining = g.target_amount - g.current_amount
            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${g.color || '#22d3ee'}20` }}>
                      <GoalIcon icon={g.icon} color={g.color} />
                    </div>
                    <div>
                      <h3 className="font-medium text-surface-100">{g.name}</h3>
                      <p className="text-xs text-surface-400">
                        {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                        {g.deadline ? ` · até ${new Date(g.deadline).toLocaleDateString('pt-BR')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-all">
                      <Zap size={14} />
                    </button>
                    <button onClick={() => handleDelete(g)} className="p-1.5 rounded-lg text-surface-500 hover:text-neon-red hover:bg-surface-800 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="h-2.5 bg-surface-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: g.color || '#22d3ee' }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-400">{pct.toFixed(0)}% concluído</span>
                  <span className="text-surface-500">Faltam {formatCurrency(remaining)}</span>
                </div>

                {/* Quick add */}
                {addingAmount?.id === g.id ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      value={addingAmount.val}
                      onChange={e => setAddingAmount({ id: g.id, val: e.target.value })}
                      placeholder="Valor"
                      className="flex-1 h-8 px-3 rounded-lg bg-surface-900 border border-surface-700 text-surface-100 text-xs placeholder:text-surface-500 focus:outline-none focus:border-neon-cyan/50"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddAmount(g)}
                      className="h-8 px-3 rounded-lg bg-neon-cyan/10 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => setAddingAmount(null)}
                      className="h-8 px-3 rounded-lg text-surface-400 text-xs hover:text-surface-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingAmount({ id: g.id, val: '' })}
                    className="mt-3 w-full py-2 rounded-lg border border-dashed border-surface-700 text-surface-500 text-xs hover:border-neon-cyan/30 hover:text-neon-cyan transition-all"
                  >
                    + Adicionar valor
                  </button>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
