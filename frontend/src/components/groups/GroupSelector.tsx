import { useSearchParams } from 'react-router-dom'
import { useGroups } from '../../hooks/useGroups'
import { Users } from 'lucide-react'

export function GroupSelector() {
  const { data: groupsList } = useGroups()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeGroup = searchParams.get('group') || ''

  if (groupsList.length === 0) return null

  const handleChange = (value: string) => {
    if (value) {
      setSearchParams(prev => { prev.set('group', value); return prev })
    } else {
      setSearchParams(prev => { prev.delete('group'); return prev })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Users size={16} className="text-surface-400 shrink-0" />
      <select
        value={activeGroup}
        onChange={e => handleChange(e.target.value)}
        className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-sm max-w-[200px]"
      >
        <option value="">Minhas contas</option>
        {groupsList.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
    </div>
  )
}
