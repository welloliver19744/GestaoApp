import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatMonthYear, cn } from '../src/lib/utils'

describe('formatCurrency', () => {
  it('formats in BRL by default', () => {
    const result = formatCurrency(1500.50)
    expect(result).toContain('R$')
    expect(result).toContain('1.500,50')
  })

  it('formats in USD', () => {
    const result = formatCurrency(99.99, 'USD')
    expect(result).toContain('$')
    expect(result).toContain('99.99')
  })

  it('formats in EUR', () => {
    const result = formatCurrency(50, 'EUR')
    expect(result).toContain('€')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0,00')
  })

  it('handles negative values', () => {
    const result = formatCurrency(-100)
    expect(result).toContain('-')
  })
})

describe('formatDate', () => {
  it('returns a string with day/month/year separators', () => {
    const result = formatDate(new Date(2026, 5, 15))
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('handles string dates', () => {
    const result = formatDate('2026-06-15')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
})

describe('formatMonthYear', () => {
  it('returns a string containing the year', () => {
    const result = formatMonthYear(new Date(2026, 5, 1))
    expect(result).toContain('2026')
  })

  it('returns a non-empty string', () => {
    expect(formatMonthYear('2026-06-01').length).toBeGreaterThan(0)
  })
})

describe('cn', () => {
  it('joins truthy classes', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('filters false and null', () => {
    expect(cn('a', false, null, 'b')).toBe('a b')
  })

  it('returns empty string for no classes', () => {
    expect(cn()).toBe('')
  })
})
