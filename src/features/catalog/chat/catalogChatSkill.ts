// ---------------------------------------------------------------------------
// AI Navigator — Chat Skill Registration
//
// Registers the catalog/AI Navigator chat skill with the SigmaChat system.
// This file is imported by the catalog feature at module load time so the
// skill is available whenever AI Navigator pages are rendered.
// ---------------------------------------------------------------------------

import { registerChatSkill } from '../../../registry/chatSkills'
import type { SigmaChatSkill } from '../../../types'

export const CATALOG_CHAT_SKILL: SigmaChatSkill = {
  key: 'catalog-discovery-skill',
  displayName: 'AI Navigator Assistant',
  description:
    'Search, discover, and compare approved enterprise assets in the AI Navigator catalog.',
  moduleKey: 'catalog',
  systemPrompt: [
    'You are the AI Navigator Assistant for the Sigma AI Workspace.',
    'Your role is to help users discover, understand, and compare approved enterprise assets',
    'in the AI Navigator catalog. You can search by name, domain, asset kind, compliance tags,',
    'hosting type, data classification, and more.',
    '',
    'Guidelines:',
    '- Only answer questions related to catalog assets and their metadata.',
    '- When referencing assets, include their name, kind, domain, and publication status.',
    '- If the user asks for comparisons, present them in a structured format.',
    '- If you cannot find relevant assets, say so clearly.',
    '- Never fabricate asset names or metadata.',
    '- You may suggest follow-up searches or filters to narrow results.',
  ].join('\n'),
  groundingStrategy: 'catalog',
  allowedDataSources: ['catalog.assets', 'catalog.search', 'catalog.taxonomy'],
  allowedActions: ['search', 'compare', 'detail', 'filter'],
  suggestedPrompts: [
    'Find approved workflows for Germany',
    'Compare similar assets in risk & compliance',
    'Show reusable assets for Data & Analytics',
    'What datasets contain PII?',
    'List all GA pipelines with EU data residency',
  ],
}

// Auto-register on import
registerChatSkill(CATALOG_CHAT_SKILL)
