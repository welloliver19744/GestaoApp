import { useRegisterSW } from 'virtual:pwa-register/react'
import { RotateCw } from 'lucide-react'

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 shadow-xl shadow-black/30">
        <div className="flex items-center gap-2 text-sm text-surface-200">
          <RotateCw size={16} className="text-neon-cyan" />
          <span>Nova versão disponível</span>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 rounded-lg bg-neon-cyan text-surface-950 text-sm font-medium hover:bg-neon-cyan/90 transition-all whitespace-nowrap"
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
