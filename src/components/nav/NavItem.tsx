import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import type { MainNavItem } from '../../data/types'

interface NavItemProps {
  item: MainNavItem
  /**
   * 'horizontal' — used in the top MainNavbar (underline active indicator, full height)
   * 'vertical'   — used in sidebar or drawer panels (pill active indicator)
   */
  variant?: 'horizontal' | 'vertical'
}

export default function NavItem({ item, variant = 'horizontal' }: NavItemProps) {
  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      className={({ isActive }) =>
        clsx(
          'transition-colors duration-150 font-medium whitespace-nowrap select-none',

          variant === 'horizontal' && [
            'relative inline-flex items-center h-full px-3.5 text-[13px] tracking-[-0.01em]',
            // underline indicator
            'after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:rounded-t-full after:transition-colors',
            isActive
              ? 'text-primary-700 after:bg-primary-600'
              : 'text-ink-muted hover:text-ink after:bg-transparent hover:after:bg-border-strong',
            item.emphasis && isActive  && 'text-primary-700 font-semibold',
            item.emphasis && !isActive && 'text-primary-600 font-semibold hover:text-primary-700',
          ],

          variant === 'vertical' && [
            'flex items-center px-3 py-2 text-sm rounded-md',
            isActive
              ? 'bg-surface-overlay text-primary-700'
              : 'text-ink-muted hover:text-ink hover:bg-surface-subtle',
            item.emphasis && 'font-semibold text-primary-600',
          ],
        )
      }
    >
      {item.label}
    </NavLink>
  )
}
