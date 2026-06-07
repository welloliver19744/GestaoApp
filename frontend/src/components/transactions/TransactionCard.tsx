import { useState } from 'react'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'
import { pb, transactions } from '../../api/client'
import type { Transaction } from '../../api/types'
import { useCategories } from '../../hooks/useCategories'
import { ShareModal } from './ShareModal'
import { CheckCircle2, Circle, Tag, Store, Calendar, Pencil, Trash2, ImageIcon, Share2, CheckSquare, Square, MoreVertical } from 'lucide-react'
import { getTagDef, parseTags } from '../../lib/tags'

interface TransactionCardProps {
  transaction: Transaction
  onTogglePaid: (tx: Transaction) => void
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
  selected?: boolean
  onSelect?: (id: string) => void
  compact?: boolean
  override?: {
    description?: string
    dueDate?: string
    amount?: number
  }
}

export function TransactionCard({ transaction: tx, onTogglePaid, onEdit, onDelete, selected, onSelect, compact, override }: TransactionCardProps) {
  const { getLabel } = useCategories()
  const isInstallment = tx.payment_type === 'installment'
  const [showReceipt, setShowReceipt] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [sharedWith, setSharedWith] = useState<string[]>(tx.shared_with || [])

  const isShared = sharedWith.length > 0
  const isOwner = pb.authStore.record?.id === tx.created_by

  const receiptUrl = tx.receipt
    ? pb.files.getUrl(tx, tx.receipt, { thumb: '640x480' })
    : null
  const receiptFullUrl = tx.receipt
    ? pb.files.getUrl(tx, tx.receipt)
    : null

  const desc = override?.description ?? tx.description
  const dueDate = override?.dueDate ?? tx.due_date
  const amount = override?.amount ?? tx.installment_value
  const totalAmount = override?.amount ? tx.total_amount : tx.total_amount
  const isPaid = tx.paid

  return (
    <>
      <Card className={`flex items-center gap-4 group ${compact ? 'p-2' : 'p-4'}`}>
        {onSelect && !compact && (
          <button onClick={() => onSelect(tx.id)} className="shrink-0 text-surface-500 hover:text-surface-200 transition-colors" title="Selecionar para ações em massa">
            {selected ? <CheckSquare size={20} className="text-neon-cyan" /> : <Square size={20} />}
          </button>
        )}
        <button onClick={() => onTogglePaid(tx)} className="shrink-0" title={tx.paid ? 'Marcar como pendente' : 'Marcar como paga'}>
          {tx.paid
            ? <CheckCircle2 size={22} className="text-neon-green" />
            : <Circle size={22} className="text-surface-500 hover:text-surface-300 transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium truncate ${isPaid ? 'text-surface-500 line-through' : 'text-surface-100'}`}>
              {desc}
            </span>
            {isInstallment && !compact && (
              <span className="shrink-0 text-xs bg-surface-800 text-neon-cyan px-2 py-0.5 rounded-full font-mono">
                {tx.installment_number}/{tx.installment_count}
              </span>
            )}
          </div>

          {!compact && (
            <div className="flex items-center gap-3 text-xs text-surface-400 flex-wrap">
              <span className="flex items-center gap-1"><Tag size={12} />{getLabel(tx.category)}</span>
              {tx.store && <span className="flex items-center gap-1"><Store size={12} />{tx.store}</span>}
              {tx.payment_method === 'debit_card' || tx.payment_method === 'cash' || tx.payment_method === 'pix' ? (
                <span className="flex items-center gap-1 text-neon-green"><CheckCircle2 size={12} />Pago em {formatDate(tx.purchase_date)}</span>
              ) : (
                <span className="flex items-center gap-1"><Calendar size={12} />Vence {formatDate(dueDate)}</span>
              )}
              {parseTags(tx.tags).length > 0 && (
                <span className="flex items-center gap-1 flex-wrap">
                  {parseTags(tx.tags).map(t => {
                    const def = getTagDef(t)
                    return <span key={t} className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${def.color} ${def.bg}`}>{def.label}</span>
                  })}
                </span>
              )}
              {isShared && (
                <span className="flex items-center gap-1 text-neon-cyan">
                  <Share2 size={12} />Compartilhado
                </span>
              )}
            </div>
          )}

        </div>

        <div className="shrink-0 text-right flex items-center gap-2">
          <div>
            <p className={`text-sm sm:text-base font-semibold ${isPaid ? 'text-surface-500' : 'text-surface-100'}`}>
              {formatCurrency(amount, tx.currency)}
            </p>
            {isInstallment && !compact && (
              <p className="text-xs text-surface-500">Total: {formatCurrency(totalAmount, tx.currency)}</p>
            )}
          </div>
          <div className="shrink-0 flex items-center">
            <button onClick={() => setShowMenu(true)} className="text-surface-500 hover:text-surface-200 transition-colors p-2" title="Mais ações">
              <MoreVertical size={18} />
            </button>
            <Modal open={showMenu} onClose={() => setShowMenu(false)} title="Ações">
              <div className="flex flex-col gap-1">
                {isOwner && (
                  <button onClick={() => { setShowShare(true); setShowMenu(false) }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-surface-200 hover:bg-surface-800 transition-colors text-left">
                    <Share2 size={18} /> <span className="text-sm">Compartilhar</span>
                  </button>
                )}
                {receiptUrl && (
                  <button onClick={() => { setShowReceipt(true); setShowMenu(false) }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-surface-200 hover:bg-surface-800 transition-colors text-left">
                    <ImageIcon size={18} /> <span className="text-sm">Ver comprovante</span>
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => { onEdit(tx); setShowMenu(false) }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-surface-200 hover:bg-surface-800 transition-colors text-left">
                    <Pencil size={18} /> <span className="text-sm">Editar</span>
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { onDelete(tx); setShowMenu(false) }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-neon-red hover:bg-neon-red/10 transition-colors text-left">
                    <Trash2 size={18} /> <span className="text-sm">Excluir</span>
                  </button>
                )}
              </div>
            </Modal>
          </div>
        </div>
      </Card>

<ShareModal
  open={showShare}
  onClose={() => setShowShare(false)}
  currentSharedWith={sharedWith}
  groupId={tx.group}
  onSave={async (userIds) => {
    await transactions.update(tx.id, { shared_with: userIds })
    setSharedWith(userIds)
    
    // Schedule push notification for newly shared users
    try {
      const me = pb.authStore.record?.id
      if (!me) return
      
      const newShared = userIds.filter(id => !sharedWith.includes(id))
      if (newShared.length === 0) return
      
      // Notify each newly shared user
      for (const userId of newShared) {
        await fetch(`${import.meta.env.VITE_PB_URL}/api/push/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            title: 'Transação compartilhada',
            body: `Você foi incluído na transação: ${tx.description}`,
            url: '/transactions'
          })
        })
      }
    } catch (error) {
      console.error('Failed to schedule push notification:', error)
    }
  }}
/>

      <Modal open={showReceipt} onClose={() => setShowReceipt(false)} title="Comprovante">
        {receiptFullUrl && (
          <div className="relative">
            <img
              src={receiptFullUrl}
              alt="Comprovante"
              className="w-full h-auto rounded-lg"
            />
            <a
              href={receiptFullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-center text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors"
            >
              Abrir em nova aba
            </a>
          </div>
        )}
      </Modal>
    </>
  )
}
