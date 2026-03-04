import type React from 'react'

export interface NavItem { label: string; href: string; icon?: string }
export interface MainNavItem { label: string; href: string; emphasis?: boolean }
export interface UtilityLink { label: string; href: string }
export type EnvironmentVariant = 'production' | 'staging' | 'development'
export interface AppShellProps { children: React.ReactNode }

export type { ModuleId, ModuleStatus, ModuleCategory, PlatformModule } from './modules'
export type { StandardDomain, EnterpriseStandard } from './standards'
export type {
  GroundingStrategy,
  SigmaChatSkill,
  ChatRole,
  ChatContext,
  ChatQueryRequest,
  ChatReference,
  ChatQueryResponse,
  ChatDisplayMessage,
} from './chat'
