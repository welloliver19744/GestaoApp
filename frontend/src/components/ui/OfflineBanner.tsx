import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div className="sticky top-0 z-50 bg-neon-amber/90 text-surface-950 text-xs font-medium text-center py-1.5 px-4 flex items-center justify-center gap-2 backdrop-blur-sm">
      <WifiOff size={14} />
      Sem conexão — os dados exibidos podem estar desatualizados
    </div>
  )
}
