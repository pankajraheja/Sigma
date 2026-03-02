// ---------------------------------------------------------------------------
// componentRules.ts
//
// Enforced visual rules for the enterprise UI component system.
// Components must reference these constants instead of hardcoding values.
// Any change here propagates across the entire component library.
// ---------------------------------------------------------------------------

/** Border radius scale — tight enterprise feel, no consumer-grade rounding. */
export const RADIUS = {
  none: 'rounded-none',
  xs:   'rounded-xs',    // 2px  — badges, status dots
  sm:   'rounded-sm',    // 3px  — inputs, tight containers
  md:   'rounded-md',    // 4px  — panels, dropdowns
  lg:   'rounded-lg',    // 6px  — cards
  xl:   'rounded-xl',    // 8px  — modals
} as const

/** Elevation / shadow scale. */
export const SHADOW = {
  card:     'shadow-card',
  panel:    'shadow-panel',
  elevated: 'shadow-elevated',
  modal:    'shadow-modal',
} as const

/** Typography scale used across card and panel components. */
export const TEXT = {
  eyebrow:  'text-[11px] font-semibold tracking-[0.16em] uppercase',
  label:    'text-[12px] font-semibold',
  body:     'text-[13px] leading-relaxed',
  heading:  'text-[15px] font-semibold leading-snug',
  section:  'text-lg font-semibold tracking-tight',
} as const

/** Minimum touch / click target size (WCAG 2.5.5 AAA = 44×44px). */
export const MIN_TARGET_SIZE = 'min-h-[44px] min-w-[44px]' as const
