import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface-900 border border-surface-800 p-4',
        'hover:border-surface-700 transition-colors duration-200',
        className
      )}
      {...props}
    />
  )
}
