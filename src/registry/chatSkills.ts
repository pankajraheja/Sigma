// ---------------------------------------------------------------------------
// Sigma Chat — Skill Registry
//
// Central registry for all chat skills across platform modules.
// Each module registers its skill at import time; the SigmaChatPanel
// resolves the active skill using the current module key.
//
// Usage:
//   import { registerChatSkill, getChatSkill } from '@/registry/chatSkills'
//   registerChatSkill(mySkill)
//   const skill = getChatSkill('catalog.chat')
// ---------------------------------------------------------------------------

import type { SigmaChatSkill, ModuleId } from '../types'

const skills = new Map<string, SigmaChatSkill>()

/**
 * Register a chat skill. Throws if a skill with the same key already exists
 * (indicates a duplicate registration / key collision).
 */
export function registerChatSkill(skill: SigmaChatSkill): void {
  if (skills.has(skill.key)) {
    console.warn(
      `[SigmaChat] Skill "${skill.key}" is already registered — skipping duplicate.`,
    )
    return
  }
  skills.set(skill.key, skill)
}

/** Retrieve a skill by its unique key. */
export function getChatSkill(key: string): SigmaChatSkill | undefined {
  return skills.get(key)
}

/** Retrieve all skills registered for a given module. */
export function getChatSkillsForModule(moduleKey: ModuleId): SigmaChatSkill[] {
  return Array.from(skills.values()).filter((s) => s.moduleKey === moduleKey)
}

/** List every registered skill (useful for debugging / admin panel). */
export function getAllChatSkills(): SigmaChatSkill[] {
  return Array.from(skills.values())
}
