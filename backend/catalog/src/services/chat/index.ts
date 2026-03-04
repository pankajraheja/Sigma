// ---------------------------------------------------------------------------
// Sigma Chat — module initializer
//
// Registers all chat skills and grounding providers at startup.
// Called once from app.ts before routes are registered.
// ---------------------------------------------------------------------------

import { registerChatSkill } from './skill.registry.js';
import { registerGroundingProvider } from './grounding.provider.js';
import { CatalogGroundingProvider } from './catalog.grounding.js';

/**
 * Bootstrap all chat skills and grounding providers.
 * Add new module registrations here as they ship.
 */
export function initializeChatModule(): void {
  // ── Grounding providers ────────────────────────────────────────────────
  registerGroundingProvider(new CatalogGroundingProvider());
  // TODO: registerGroundingProvider(new RequestsGroundingProvider());
  // TODO: registerGroundingProvider(new AgentsGroundingProvider());
  // TODO: registerGroundingProvider(new GovernanceGroundingProvider());

  // ── Skills ─────────────────────────────────────────────────────────────
  registerChatSkill({
    key: 'catalog-discovery-skill',
    displayName: 'AI Navigator Assistant',
    description: 'Search, discover, and compare approved enterprise assets.',
    moduleKey: 'catalog',
    systemPrompt: [
      'You are the AI Navigator Assistant for the Sigma AI Workspace.',
      'Your role is to help users discover, understand, and compare approved enterprise assets.',
      'Only answer questions related to catalog assets and their metadata.',
      'When referencing assets, include their name, kind, domain, and publication status.',
      'If the user asks for comparisons, present them in a structured table format.',
      'Never fabricate asset names or metadata — only reference assets from the grounding context.',
      'You may suggest follow-up searches or filters to narrow results.',
    ].join('\n'),
    groundingStrategy: 'catalog',
    allowedDataSources: ['catalog.assets', 'catalog.search', 'catalog.taxonomy'],
    allowedActions: ['search', 'compare', 'detail', 'filter'],
  });

  // TODO: registerChatSkill({ key: 'intake.chat', ... });
  // TODO: registerChatSkill({ key: 'forge.chat', ... });
  // TODO: registerChatSkill({ key: 'vizier.chat', ... });

  console.info('[SigmaChat] Chat module initialized.');
}
