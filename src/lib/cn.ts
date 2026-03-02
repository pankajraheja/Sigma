import clsx, { type ClassValue } from 'clsx'

// ---------------------------------------------------------------------------
// cn — utility for merging Tailwind class names.
// Wraps clsx so callers import from one place and the implementation can
// swap to tailwind-merge if conflict resolution becomes necessary.
// ---------------------------------------------------------------------------

export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs)
}
