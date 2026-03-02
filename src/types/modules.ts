export type ModuleStatus =
  | 'live'
  | 'beta'
  | 'preview'
  | 'coming-soon'

export type ModuleCategory =
  | 'Discovery'
  | 'Build'
  | 'Orchestrate'
  | 'Govern'
  | 'Platform'

export interface PlatformModule {
  id: string
  displayName: string
  category: ModuleCategory
  description: string
  status: ModuleStatus
  href: string
}
