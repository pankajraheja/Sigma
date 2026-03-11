// ---------------------------------------------------------------------------
// BrandSwitcher — dropdown to select the active brand JSON from /config/brands
// ---------------------------------------------------------------------------

import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

// Available brand keys — extend this list as new brand JSONs are added.
const AVAILABLE_BRANDS = ['kpmg'] as const

interface BrandSwitcherProps {
  activeKey: string
  onSwitch: (key: string) => void
  className?: string
}

export default function BrandSwitcher({ activeKey, onSwitch, className }: BrandSwitcherProps) {
  return (
    <div className={clsx('relative inline-flex items-center', className)}>
      <select
        value={activeKey}
        onChange={(e) => onSwitch(e.target.value)}
        className={clsx(
          'appearance-none rounded-md border border-gray-300 bg-white px-3 py-1.5 pr-8',
          'text-[13px] text-gray-700 font-medium',
          'focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400',
          'cursor-pointer',
        )}
      >
        {AVAILABLE_BRANDS.map((key) => (
          <option key={key} value={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 text-gray-400"
      />
    </div>
  )
}
