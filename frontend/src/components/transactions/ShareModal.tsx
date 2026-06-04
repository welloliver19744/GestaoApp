import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { pb } from '../../api/client'
import type { User } from '../../api/types'
import { X, UserIcon } from 'lucide-react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  currentSharedWith: string[]
  onSave: (userIds: string[]) => Promise<void>
}

export function ShareModal({ open, onClose, currentSharedWith, onSave }: ShareModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    pb.collection('users').getFullList<User>({ sort: 'email' }).then(all => {
      const me = pb.authStore.record?.id
      setUsers(all.filter(u => u.id !== me))
    }).catch((e) => { console.error('Erro ao carregar usuários', e) })
    setSelected([...currentSharedWith])
  }, [open, currentSharedWith])

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(selected)
      onClose()
    } catch {
      // toast handled by caller
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar Transação">
      <div className="space-y-3">
        <p className="text-sm text-surface-400">Selecione usuários para compartilhar esta transação:</p>
        {users.length === 0 ? (
          <p className="text-sm text-surface-500">Nenhum outro usuário cadastrado.</p>
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
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center">
                  <UserIcon size={16} />
                </div>
                <span className="flex-1 text-left text-sm font-medium">{u.email || u.name || u.id}</span>
                {selected.includes(u.id) && <X size={14} className="text-neon-cyan" />}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="button" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
