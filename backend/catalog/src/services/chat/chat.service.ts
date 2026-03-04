// ---------------------------------------------------------------------------
// Chat Service — orchestrates skill resolution, grounding, and LLM call.
//
// Flow:
//   1. Resolve skill from skillKey
//   2. Get grounding provider for the skill's strategy
//   3. Retrieve grounding context for the user's message
//   4. Build system prompt + grounded context
//   5. Call the LLM via the shared AiProvider and return structured response
// ---------------------------------------------------------------------------

import { getChatSkill } from './skill.registry.js';
import { getGroundingProvider } from './grounding.provider.js';
import { getAiProvider } from '../ai.service.js';
import type {
  ChatQueryRequest,
  ChatQueryResponse,
  ChatReference,
  GroundingResult,
} from '../../models/chat.types.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function handleChatQuery(body: ChatQueryRequest): Promise<ChatQueryResponse> {
  const skill = getChatSkill(body.skillKey);
  if (!skill) {
    return errorResponse(`Unknown skill: ${body.skillKey}`);
  }

  // 1. Retrieve grounding context
  const groundingProvider = getGroundingProvider(skill.groundingStrategy);
  let groundingResults: GroundingResult[] = [];

  if (groundingProvider) {
    groundingResults = await groundingProvider.retrieve(
      body.message,
      body.context,
      6,
    );
  }

  // 2. Build grounding block for system prompt
  const groundingText = groundingResults.length
    ? [
        '\n--- Relevant catalog assets (grounding context) ---',
        ...groundingResults.map(
          (r, i) =>
            `[${i + 1}] id=${r.sourceId} | ${r.title} | ${r.snippet} | link=${r.link ?? 'n/a'}`,
        ),
        '--- End grounding context ---\n',
      ].join('\n')
    : '\nNo relevant assets found in the catalog for this query.\n';

  // 3. Build reference list from grounding
  const references: ChatReference[] = groundingResults.map((r) => ({
    id: r.sourceId,
    name: r.title,
    kind: extractKind(r.snippet),
    href: r.link ?? `/catalog/assets/${r.sourceId}`,
  }));

  const systemPrompt = `${skill.systemPrompt}

${groundingText}

IMPORTANT INSTRUCTIONS:
- Your reply MUST be valid JSON with exactly these keys: "answer", "references", "suggestions".
- "answer" is your markdown-formatted reply to the user.
- "references" is an array of { "id", "name", "kind", "href" } objects for assets you mention. Only include assets from the grounding context above.
- "suggestions" is an array of 2-4 follow-up question strings the user might want to ask next.
- Do NOT include markdown code fences around the JSON.`;

  // 4. Call the LLM
  const ai = getAiProvider();
  try {
    const raw = await ai.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.message },
      ],
      temperature: 0.3,
      maxTokens: 1200,
      jsonMode: true,
    });

    // 5. Parse the structured response
    const parsed = safeParseJson(raw);

    return {
      answer: typeof parsed.answer === 'string' ? parsed.answer : raw,
      references:
        Array.isArray(parsed.references) && parsed.references.length > 0
          ? parsed.references
          : references,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : defaultSuggestions(body),
    };
  } catch (err) {
    console.error('[ChatService] LLM call failed, returning grounding-only response:', err);
    // Graceful degradation — return grounding results without LLM answer
    return {
      answer:
        'I found some relevant catalog assets but had trouble generating a full answer. Here are the results:',
      references,
      suggestions: defaultSuggestions(body),
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractKind(snippet: string): string {
  const match = snippet.match(/Kind:\s*([^·]+)/);
  return match?.[1]?.trim() ?? 'asset';
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    // Strip markdown code fences if the model added them
    const cleaned = raw.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function defaultSuggestions(body: ChatQueryRequest): string[] {
  if (body.context.entityId) {
    return [
      'What are the compliance requirements for this asset?',
      'Show similar assets in the catalog',
      'Who owns this asset?',
    ];
  }
  return [
    'Show all GA assets',
    'Find pipelines with EU data residency',
    'What assets contain PII?',
  ];
}

function errorResponse(message: string): ChatQueryResponse {
  return {
    answer: `Error: ${message}`,
    references: [],
    suggestions: [],
  };
}
