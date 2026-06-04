import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-neon-cyan text-surface-950 hover:bg-neon-cyan/90 shadow-lg shadow-neon-cyan/20',
        variant === 'secondary' && 'bg-surface-800 text-surface-200 hover:bg-surface-700 border border-surface-700',
        variant === 'ghost' && 'text-surface-300 hover:text-surface-100 hover:bg-surface-800',
        variant === 'danger' && 'bg-neon-red/10 text-neon-red hover:bg-neon-red/20 border border-neon-red/20',
        size === 'sm' && 'h-8 px-3 text-xs gap-1.5',
        size === 'md' && 'h-10 px-4 text-sm gap-2',
        size === 'lg' && 'h-12 px-6 text-base gap-2.5',
        className
      )}
      {...props}
    />
  )
}
