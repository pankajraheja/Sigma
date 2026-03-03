// ---------------------------------------------------------------------------
// resolveIcon — maps registry iconName strings to Lucide icon components.
//
// The module registry stores icon names as plain strings so the registry
// remains serialisable and free of render-time imports. This file is the
// single place that imports Lucide icons and resolves them by name.
//
// Add entries here as new modules are registered.
// ---------------------------------------------------------------------------

import {
  Database,
  Inbox,
  PenTool,
  Code2,
  Cpu,
  GitBranch,
  Settings,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Database,
  Inbox,
  PenTool,
  Code2,
  Cpu,
  GitBranch,
  Settings,
}

/**
 * Returns the Lucide icon component for the given name.
 * Falls back to `Database` if the name is not registered.
 */
export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Database
}
