import { useState } from 'react'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'
import { pb, transactions } from '../../api/client'
import type { Transaction } from '../../api/types'
import { useCategories } from '../../hooks/useCategories'
import { ShareModal } from './ShareModal'
import { CheckCircle2, Circle, Tag, Store, Calendar, Pencil, Trash2, ImageIcon, Share2, CheckSquare, Square } from 'lucide-react'

interface TransactionCardProps {
  transaction: Transaction
  onTogglePaid: (tx: Transaction) => void
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
  selected?: boolean
  onSelect?: (id: string) => void
}

export function TransactionCard({ transaction: tx, onTogglePaid, onEdit, onDelete, selected, onSelect }: TransactionCardProps) {
  const { getLabel } = useCategories()
  const isInstallment = tx.payment_type === 'installment'
  const [showReceipt, setShowReceipt] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [sharedWith, setSharedWith] = useState<string[]>(tx.shared_with || [])

  const isShared = sharedWith.length > 0
  const isOwner = pb.authStore.record?.id === tx.created_by

  const receiptUrl = tx.receipt
    ? pb.files.getUrl(tx, tx.receipt, { thumb: '640x480' })
    : null
  const receiptFullUrl = tx.receipt
    ? pb.files.getUrl(tx, tx.receipt)
    : null

  return (
    <>
      <Card className="flex items-center gap-4 group">
        {onSelect && (
          <button onClick={() => onSelect(tx.id)} className="shrink-0 text-surface-500 hover:text-surface-200 transition-colors">
            {selected ? <CheckSquare size={20} className="text-neon-cyan" /> : <Square size={20} />}
          </button>
        )}
        <button onClick={() => onTogglePaid(tx)} className="shrink-0">
          {tx.paid
            ? <CheckCircle2 size={22} className="text-neon-green" />
            : <Circle size={22} className="text-surface-500 hover:text-surface-300 transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium truncate ${tx.paid ? 'text-surface-500 line-through' : 'text-surface-100'}`}>
              {tx.description}
            </span>
            {isInstallment && (
              <span className="shrink-0 text-xs bg-surface-800 text-neon-cyan px-2 py-0.5 rounded-full font-mono">
                {tx.installment_number}/{tx.installment_count}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-surface-400 flex-wrap">
            <span className="flex items-center gap-1"><Tag size={12} />{getLabel(tx.category)}</span>
            {tx.store && <span className="flex items-center gap-1"><Store size={12} />{tx.store}</span>}
            <span className="flex items-center gap-1"><Calendar size={12} />Vence {formatDate(tx.due_date)}</span>
            {isShared && (
              <span className="flex items-center gap-1 text-neon-cyan">
                <Share2 size={12} />Compartilhado
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right flex items-center gap-2">
          <div>
            <p className={`text-sm sm:text-base font-semibold ${tx.paid ? 'text-surface-500' : 'text-surface-100'}`}>
              {formatCurrency(tx.installment_value, tx.currency)}
            </p>
            {isInstallment && (
              <p className="text-xs text-surface-500">Total: {formatCurrency(tx.total_amount, tx.currency)}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {isOwner && (
              <button onClick={() => setShowShare(true)} className="text-surface-500 hover:text-neon-purple transition-colors p-1" title="Compartilhar">
                <Share2 size={14} />
              </button>
            )}
            {receiptUrl && (
              <button onClick={() => setShowReceipt(true)} className="text-surface-500 hover:text-neon-amber transition-colors p-1" title="Ver comprovante">
                <ImageIcon size={14} />
              </button>
            )}
            {onEdit && (
              <button onClick={() => onEdit(tx)} className="text-surface-500 hover:text-neon-cyan transition-colors p-1">
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(tx)} className="text-surface-500 hover:text-neon-red transition-colors p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </Card>

      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        currentSharedWith={sharedWith}
        onSave={async (userIds) => {
          await transactions.update(tx.id, { shared_with: userIds })
          setSharedWith(userIds)
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
