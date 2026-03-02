import type { LucideIcon } from 'lucide-react'

export type StandardDomain =
  | 'Governance'
  | 'Security'
  | 'Development'
  | 'Integration'
  | 'AI & Automation'

export interface EnterpriseStandard {
  id: string
  name: string
  domain: StandardDomain
  description: string
  /** Lucide icon component — stored by reference, not string */
  Icon: LucideIcon
  href: string
}
