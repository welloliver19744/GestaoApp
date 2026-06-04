export interface TagDef {
  value: string
  label: string
  color: string
  bg: string
}

export const PREDEFINED_TAGS: TagDef[] = [
  { value: 'essencial', label: 'Essencial', color: 'text-red-400', bg: 'bg-red-400/10' },
  { value: 'moradia', label: 'Moradia', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { value: 'alimentacao', label: 'Alimentação', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { value: 'transporte', label: 'Transporte', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { value: 'saude', label: 'Saúde', color: 'text-lime-400', bg: 'bg-lime-400/10' },
  { value: 'educacao', label: 'Educação', color: 'text-green-400', bg: 'bg-green-400/10' },
  { value: 'lazer', label: 'Lazer', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { value: 'assinaturas', label: 'Assinaturas', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { value: 'imprevisto', label: 'Imprevisto', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { value: 'investimento', label: 'Investimento', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { value: 'outros', label: 'Outros', color: 'text-surface-400', bg: 'bg-surface-400/10' },
]

export function getTagDef(value: string): TagDef {
  return PREDEFINED_TAGS.find(t => t.value === value) || { value, label: value, color: 'text-surface-400', bg: 'bg-surface-400/10' }
}

export function parseTags(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}
