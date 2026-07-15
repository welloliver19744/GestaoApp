import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useGroups } from '../hooks/useGroups'
import { pb } from '../api/client'
import type { User } from '../api/types'
import { Users, Plus, Settings2, Trash2, X, UserIcon } from 'lucide-react'

export function Groups() {
  const { data: groupsList, loading, create, update, remove } = useGroups()
  const me = pb.authStore.record?.id

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    pb.collection<User>('users').getFullList({ sort: 'email' })
      .then(setAllUsers)
      .catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await create({ name: newName.trim(), description: newDesc.trim(), members: [me!] })
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    } catch (e) {
      console.error(e)
    }
  }

  const openEdit = (groupId: string) => {
    const g = groupsList.find(x => x.id === groupId)
    if (!g) return
    setEditingGroup(groupId)
    setSelectedMembers(g.members || [])
  }

  const handleSaveMembers = async () => {
    if (!editingGroup) return
    try {
      await update(editingGroup, { members: selectedMembers } as any)
      setEditingGroup(null)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const isOwner = (g: { created_by: string }) => g.created_by === me

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100">Grupos Familiares</h1>
          <p className="text-sm text-surface-400">Gerencie grupos para finanças compartilhadas</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />Novo Grupo
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="h-24 bg-surface-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : groupsList.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-surface-500">
            <Users size={40} />
            <p className="text-sm">Nenhum grupo ainda</p>
            <p className="text-xs">Crie um grupo para compartilhar finanças com sua família</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupsList.map(g => {
            const owner = isOwner(g)
            const memberCount = g.members?.length || 1
            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center shrink-0">
                      <Users size={20} className="text-neon-cyan" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-surface-100">{g.name}</h3>
                      {g.description && (
                        <p className="text-xs text-surface-400 mt-0.5">{g.description}</p>
                      )}
                      <p className="text-xs text-surface-500 mt-1.5">
                        {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
                        {owner && ' • você é admin'}
                      </p>
                    </div>
                  </div>
                  {owner && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(g.id)}
                        className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-all"
                        title="Gerenciar membros"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Excluir grupo?')) remove(g.id) }}
                        className="p-2 rounded-lg text-surface-400 hover:text-neon-red hover:bg-surface-800 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Grupo">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Nome</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              placeholder="Ex: Casa, Família Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Descrição (opcional)</label>
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
              placeholder="Ex: Despesas da casa"
            />
          </div>
          <p className="text-xs text-surface-500">Você será adicionado automaticamente como administrador.</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="button" className="flex-1" onClick={handleCreate} disabled={!newName.trim()}>Criar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit members modal */}
      <Modal
        open={editingGroup !== null}
        onClose={() => setEditingGroup(null)}
        title={editingGroup ? `Membros - ${groupsList.find(g => g.id === editingGroup)?.name}` : 'Gerenciar Membros'}
      >
        <div className="space-y-3">
          <p className="text-sm text-surface-400">Selecione os membros do grupo:</p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {allUsers.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleMember(u.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedMembers.includes(u.id)
                    ? 'bg-neon-cyan/10 border-neon-cyan/40 text-surface-100'
                    : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center shrink-0">
                  <UserIcon size={16} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{u.name || u.email}</p>
                  <p className="text-xs text-surface-500">{u.email}</p>
                </div>
                {u.id === me && (
                  <span className="text-xs text-surface-500">(você)</span>
                )}
                {selectedMembers.includes(u.id) && <X size={14} className="text-neon-cyan shrink-0" />}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditingGroup(null)}>Cancelar</Button>
            <Button type="button" className="flex-1" onClick={handleSaveMembers}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
