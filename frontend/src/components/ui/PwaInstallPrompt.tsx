import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') setDeferredPrompt(null)
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 max-w-sm mx-auto md:mx-0">
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center shrink-0">
          <Download size={20} className="text-neon-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-100">Instalar App</p>
          <p className="text-xs text-surface-400">Adicione à tela inicial para acesso rápido</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 h-8 px-3 rounded-lg bg-neon-cyan text-surface-950 text-xs font-semibold hover:bg-neon-cyan/90 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1.5 rounded-lg text-surface-500 hover:text-surface-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
