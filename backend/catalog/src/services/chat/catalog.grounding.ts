// ---------------------------------------------------------------------------
// Catalog Grounding Provider — retrieves context from catalog assets
//
// Strategies:
//   1. Detail page (entityId present) → fetch the asset + similar assets
//   2. Discovery page (search / filters) → full-text search with filters
//   3. Fallback when search returns nothing → fetch latest GA assets
//
// Because the user's message is often a natural-language sentence rather
// than a keyword query, we extract meaningful terms before searching.
// ---------------------------------------------------------------------------

import type { GroundingProvider } from './grounding.provider.js';
import type { ChatContext, GroundingResult } from '../../models/chat.types.js';
import { discoveryRepository } from '../../repositories/discovery.repository.js';
import { assetRepository } from '../../repositories/asset.repository.js';
import type { CatalogAsset } from '../../models/catalog.types.js';

// Stop words to strip from natural-language queries before search
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'them', 'his', 'her', 'its', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
  'show', 'find', 'list', 'get', 'give', 'tell', 'search', 'look',
  'for', 'of', 'in', 'on', 'at', 'to', 'from', 'with', 'by', 'about',
  'all', 'any', 'some', 'each', 'every', 'both', 'no', 'not',
  'and', 'or', 'but', 'if', 'so', 'than', 'too', 'very',
  'how', 'why', 'when', 'where', 'please', 'help', 'want', 'like',
]);

/**
 * Extract meaningful search terms from a natural-language query.
 * Falls back to the original query if nothing remains.
 */
function extractKeywords(query: string): string {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return words.length > 0 ? words.join(' ') : query.trim();
}

function assetToGrounding(asset: CatalogAsset, score = 0.8): GroundingResult {
  return {
    sourceId: asset.id,
    title: asset.name,
    snippet: [
      asset.short_summary ?? '',
      `Kind: ${asset.asset_kind}`,
      `Domain: ${asset.domain ?? 'n/a'}`,
      `Status: ${asset.publication_status}`,
      asset.data_classification ? `Classification: ${asset.data_classification}` : '',
      asset.hosting_type ? `Hosting: ${asset.hosting_type}` : '',
      asset.data_residency ? `Residency: ${asset.data_residency}` : '',
      asset.compliance_tags?.length
        ? `Compliance: ${asset.compliance_tags.join(', ')}`
        : '',
      asset.contains_pii ? 'Contains PII' : '',
    ]
      .filter(Boolean)
      .join(' · '),
    score,
    link: `/catalog/assets/${asset.id}`,
  };
}

export class CatalogGroundingProvider implements GroundingProvider {
  readonly key = 'catalog';

  async retrieve(
    query: string,
    context: ChatContext,
    maxResults = 6,
  ): Promise<GroundingResult[]> {
    try {
      const results: GroundingResult[] = [];

      // ── Strategy 1: detail page — fetch the asset itself + similar ──
      if (context.entityId) {
        const [asset, similar] = await Promise.all([
          assetRepository.findById(context.entityId),
          discoveryRepository.findSimilar(context.entityId, maxResults - 1),
        ]);

        if (asset) {
          results.push(assetToGrounding(asset, 1.0));
        }

        for (const sim of similar) {
          results.push(assetToGrounding(sim, sim.similarity_score / 10));
        }

        return results.slice(0, maxResults);
      }

      // ── Strategy 2: keyword search ─────────────────────────────────
      const keywords = extractKeywords(query);

      const searchParams: Record<string, unknown> = {
        q: keywords,
        pageSize: maxResults,
      };

      // Forward any active filters from the page
      if (context.filters) {
        for (const [key, value] of Object.entries(context.filters)) {
          if (value !== undefined && value !== '' && key !== 'q') {
            searchParams[key] = value;
          }
        }
      }

      const searchResults = await discoveryRepository.search(
        searchParams as Parameters<typeof discoveryRepository.search>[0],
      );

      for (const asset of searchResults.assets) {
        results.push(assetToGrounding(asset));
      }

      // ── Strategy 3: fallback — if search found nothing, get recent GA assets ─
      if (results.length === 0) {
        const fallback = await discoveryRepository.search({ q: '*', pageSize: maxResults });
        // If even wildcard fails, try fetching direct assets list
        if (fallback.assets.length === 0) {
          // No data at all — return empty
          return [];
        }
        for (const asset of fallback.assets) {
          results.push(assetToGrounding(asset, 0.5));
        }
      }

      return results;
    } catch (err) {
      console.error('[CatalogGroundingProvider] Grounding failed:', err);
      return [];
    }
  }
}
