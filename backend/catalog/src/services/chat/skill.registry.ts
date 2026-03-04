// ---------------------------------------------------------------------------
// Chat Skill Registry — backend counterpart of the frontend skill registry.
//
// Skills are registered at startup. The chat service resolves the skill
// from the request's skillKey to determine system prompt and grounding
// strategy for the conversation.
// ---------------------------------------------------------------------------

import type { ChatSkillConfig } from '../../models/chat.types.js';

const skills = new Map<string, ChatSkillConfig>();

export function registerChatSkill(skill: ChatSkillConfig): void {
  if (skills.has(skill.key)) {
    console.warn(`[SigmaChat] Skill "${skill.key}" already registered — skipping.`);
    return;
  }
  skills.set(skill.key, skill);
  console.info(`[SigmaChat] Skill registered: ${skill.key} (${skill.displayName})`);
}

export function getChatSkill(key: string): ChatSkillConfig | undefined {
  return skills.get(key);
}

export function getAllChatSkills(): ChatSkillConfig[] {
  return Array.from(skills.values());
}
