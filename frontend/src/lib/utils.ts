import { parseISO } from 'date-fns'

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

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(d)
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
  })
}
