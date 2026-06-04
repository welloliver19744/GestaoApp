import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { pb, groups } from '../../api/client'
import type { User } from '../../api/types'
import { X, UserIcon } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  currentSharedWith: string[]
  onSave: (userIds: string[]) => Promise<void>
  groupId?: string
}

export function ShareModal({ open, onClose, currentSharedWith, onSave, groupId }: ShareModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const me = pb.authStore.record?.id
    const loadUsers = async () => {
      try {
        if (groupId) {
          const group = await groups.getOne(groupId)
          const memberIds = (group.members || []).filter((id: string) => id !== me)
          if (memberIds.length > 0) {
            const filter = memberIds.map((id: string) => `id='${id}'`).join(' || ')
            const members = await pb.collection<User>('users').getFullList({ filter, sort: 'email' })
            setUsers(members)
          } else {
            setUsers([])
          }
        } else {
          const all = await pb.collection<User>('users').getFullList({ sort: 'email' })
          setUsers(all.filter(u => u.id !== me))
        }
      } catch (e) {
        console.error('Erro ao carregar usuários', e)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
    setSelected([...currentSharedWith])
  }, [open, currentSharedWith, groupId])

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(selected)
      onClose()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar Transação">
      <div className="space-y-3">
        <p className="text-sm text-surface-400">
          {groupId ? 'Compartilhe com os membros do grupo:' : 'Selecione usuários para compartilhar:'}
        </p>
        {loading ? (
          <div className="h-20 flex items-center justify-center"><p className="text-sm text-surface-500">Carregando...</p></div>
        ) : users.length === 0 ? (
          <p className="text-sm text-surface-500">
            {groupId ? 'Nenhum outro membro no grupo.' : 'Nenhum outro usuário cadastrado.'}
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selected.includes(u.id)
                    ? 'bg-neon-cyan/10 border-neon-cyan/40 text-surface-100'
                    : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center shrink-0">
                  <UserIcon size={16} />
                </div>
                <span className="flex-1 text-left text-sm font-medium">{u.name || u.email || u.id}</span>
                {selected.includes(u.id) && <X size={14} className="text-neon-cyan shrink-0" />}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="button" className="flex-1" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
