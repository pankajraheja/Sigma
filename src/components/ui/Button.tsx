import clsx from 'clsx'
import type React from 'react'

export type ButtonVariant =
  | 'primary'        // solid blue — for light backgrounds
  | 'outline'        // bordered blue — for light backgrounds
  | 'ghost'          // text only — for light backgrounds
  | 'inverse'        // solid white — for dark backgrounds
  | 'ghost-inverse'  // bordered white — for dark backgrounds

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-ink-inverse border border-primary-600 hover:bg-primary-700 hover:border-primary-700 focus-visible:ring-primary-400',

  outline:
    'bg-transparent text-primary-600 border border-primary-300 hover:bg-surface-subtle hover:border-primary-400 focus-visible:ring-primary-400',

  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-surface-subtle focus-visible:ring-border-strong',

  inverse:
    'bg-ink-inverse text-primary-900 border border-ink-inverse hover:bg-primary-50 focus-visible:ring-ink-inverse/50',

  'ghost-inverse':
    'bg-transparent text-ink-inverse border border-ink-inverse/30 hover:bg-ink-inverse/10 hover:border-ink-inverse/50 focus-visible:ring-ink-inverse/40',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2   gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        // base
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-colors duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </button>
  )
}
