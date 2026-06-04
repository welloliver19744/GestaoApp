import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastCtx {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <Ctx.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-slide-up px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 ${
              t.type === 'success' ? 'bg-neon-green/90 text-surface-950' :
              t.type === 'error' ? 'bg-neon-red/90 text-white' :
              'bg-surface-800/90 text-surface-200 border border-surface-700'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
