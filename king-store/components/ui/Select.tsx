'use client'

import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg text-sm',
            'bg-gray-800 border text-white',
            'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
            'transition-colors duration-200',
            error
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-gray-600 hover:border-gray-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-gray-500">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-800">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
