import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { chatWithAI, getAIConfig } from '../../lib/ai'
import { Send, Loader2, Brain, MessageSquare } from 'lucide-react'

interface ChatModalProps {
  open: boolean
  onClose: () => void
  context: {
    totalMonth: number
    byCategory: { name: string; value: number }[]
    recentTransactions: string[]
  }
}

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export function ChatModal({ open, onClose, context }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Pergunte o que quiser sobre seus gastos desse mês.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const query = input.trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: query }])
    setLoading(true)
    try {
      const reply = await chatWithAI(query, context)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Erro ao consultar IA. Verifique sua API Key.' }])
    } finally {
      setLoading(false)
    }
  }

  const aiConfig = getAIConfig()

  return (
    <Modal open={open} onClose={onClose} title="Chat Financeiro">
      {!aiConfig.apiKey ? (
        <p className="text-surface-400 text-sm text-center py-8">
          Configure sua API Key em <strong>Configurações → Inteligência Artificial</strong>
        </p>
      ) : (
        <div className="flex flex-col h-[400px]">
          <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-neon-cyan/20 text-neon-cyan rounded-br-sm'
                      : 'bg-surface-800 text-surface-200 rounded-bl-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs opacity-60">
                    {msg.role === 'assistant' ? <Brain size={12} /> : <MessageSquare size={12} />}
                    {msg.role === 'assistant' ? 'IA' : 'Você'}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-xl bg-surface-800 text-surface-400 text-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ex: quanto gastei em alimentação?"
              className="flex-1 h-10 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-10 w-10 rounded-lg bg-neon-cyan text-surface-950 flex items-center justify-center hover:bg-neon-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
