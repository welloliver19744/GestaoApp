export const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'ARS', 'CLP'] as const
export type CurrencyCode = typeof CURRENCIES[number]

const CURRENCY_LOCALE: Record<string, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  ARS: 'es-AR',
  CLP: 'es-CL',
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] || 'pt-BR', {
      style: 'currency',
      currency,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function toLocalDate(date: string | Date): Date {
  if (typeof date === 'string' && date) {
    try {
      const datePart = date.split('T')[0]
      const parts = datePart.split('-').map(Number)
      if (parts.length === 3 && parts.every(n => !isNaN(n))) {
        const [y, m, d] = parts
        return new Date(y, m - 1, d)
      }
    } catch {}
  }
  if (date instanceof Date && !isNaN(date.getTime())) return date
  return new Date()
}

export function formatDate(date: string | Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR').format(toLocalDate(date))
  } catch {
    return 'Data inválida'
  }
}

export function formatMonthYear(date: string | Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(toLocalDate(date))
  } catch {
    return 'Mês inválido'
  }
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function isInMonth(date: string | undefined | null, monthStr: string): boolean {
  return !!date && date.startsWith(monthStr)
}

export function txInMonth(tx: { due_date?: string; purchase_date?: string }, monthStr: string): boolean {
  return isInMonth(tx.due_date, monthStr) || isInMonth(tx.purchase_date, monthStr)
}

export function compressImage(
  file: File,
  maxDim = 1200,
  quality = 0.7,
): Promise<{ base64: string; blob: Blob; file: File }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width
      let h = img.height
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas 2D not available')); return }
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression failed')); return }
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
          })
          const reader = new FileReader()
          reader.onload = () => {
            const b64 = (reader.result as string).split(',')[1]
            resolve({ base64: b64, blob, file: compressedFile })
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
    const cleanup = () => {
      setTimeout(() => URL.revokeObjectURL(img.src), 100)
    }
    img.onload = () => { cleanup(); /* resolve continua abaixo */ }
    img.onerror = () => { cleanup(); reject() }
  })
}

export function parseAmount(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const cleaned = v.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return isNaN(n) ? 0 : n
  }
  return 0
}

export function normalizeDateStr(v: unknown): string {
  if (typeof v !== 'string') return ''
  // já está em YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  // DD/MM/YYYY ou DD-MM-YYYY
  const m = v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  // MM/DD/YYYY
  const m2 = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m2) return `${m2[3]}-${m2[1]}-${m2[2]}`
  return ''
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}
