'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-amber-500 hover:bg-amber-400 text-gray-900 focus:ring-amber-500 shadow-lg shadow-amber-500/20',
      secondary:
        'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500',
      danger:
        'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-lg shadow-red-500/20',
      ghost:
        'hover:bg-gray-800 text-gray-400 hover:text-white focus:ring-gray-500',
      outline:
        'border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white focus:ring-gray-500 bg-transparent',
    }

    const sizes = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
