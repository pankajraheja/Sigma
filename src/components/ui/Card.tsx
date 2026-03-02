import clsx from 'clsx'
import type React from 'react'

/**
 * Card — shared visual surface for all card types in the gateway.
 *
 * Compose with CardBody and CardFooter:
 *
 *   <Card>
 *     <CardBody>…content…</CardBody>
 *     <CardFooter>…link…</CardFooter>
 *   </Card>
 */

interface SlotProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: SlotProps) {
  return (
    <article
      className={clsx(
        'group flex flex-col bg-surface border border-border rounded-lg',
        'shadow-card hover:shadow-panel transition-shadow duration-200',
        className,
      )}
    >
      {children}
    </article>
  )
}

/** Flex-grow body with standard inner padding. */
export function CardBody({ children, className }: SlotProps) {
  return (
    <div className={clsx('flex flex-col flex-1 p-5', className)}>
      {children}
    </div>
  )
}

/** Bottom strip separated by a muted border. */
export function CardFooter({ children, className }: SlotProps) {
  return (
    <div className={clsx('px-5 py-3 border-t border-border-muted', className)}>
      {children}
    </div>
  )
}
