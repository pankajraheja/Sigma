// ---------------------------------------------------------------------------
// Metadata-Taxonomy Service
//
// Read-only business logic for the configurable 4-table taxonomy.
// Builds nested tree responses and integrates a simple TTL cache.
// ---------------------------------------------------------------------------

import { metadataTaxonomyRepository as repo } from '../repositories/metadata-taxonomy.repository.js';
import type {
  TaxScheme,
  TaxBucket,
  TaxTerm,
  TaxAlias,
  TaxTermNode,
  TaxBucketWithTerms,
  TaxSchemeDetail,
  TaxTermSearchHit,
} from '../models/metadata-taxonomy.types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Simple in-memory TTL cache
// ═══════════════════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000; // 60 s

class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }
}

const cache = new TtlCache();

// ═══════════════════════════════════════════════════════════════════════════
// Tree builder — converts flat term list into nested TaxTermNode[]
// ═══════════════════════════════════════════════════════════════════════════

function buildTermTree(
  flatTerms: TaxTerm[],
  aliasesByTermId: Map<string, TaxAlias[]>,
): TaxTermNode[] {
  const nodeMap = new Map<string, TaxTermNode>();

  // 1. Create a node for every term
  for (const t of flatTerms) {
    nodeMap.set(t.id, {
      ...t,
      aliases: aliasesByTermId.get(t.id) ?? [],
      children: [],
    });
  }

  // 2. Link children to parents
  const roots: TaxTermNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parent_term_id && nodeMap.has(node.parent_term_id)) {
      nodeMap.get(node.parent_term_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 3. Sort children at every level
  const sortNodes = (nodes: TaxTermNode[]): void => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
    for (const n of nodes) sortNodes(n.children);
  };
  sortNodes(roots);

  return roots;
}

// ═══════════════════════════════════════════════════════════════════════════
// Service API
// ═══════════════════════════════════════════════════════════════════════════

export const metadataTaxonomyService = {

  // -----------------------------------------------------------------------
  // List all schemes (lightweight)
  // -----------------------------------------------------------------------
  async listSchemes(): Promise<{ data: TaxScheme[] }> {
    const cacheKey = 'schemes:all';
    const cached = cache.get<TaxScheme[]>(cacheKey);
    if (cached) return { data: cached };

    const schemes = await repo.findAllSchemes();
    cache.set(cacheKey, schemes);
    return { data: schemes };
  },

  // -----------------------------------------------------------------------
  // Full scheme detail — scheme + buckets + nested term trees + aliases
  // -----------------------------------------------------------------------
  async getSchemeDetail(schemeKey: string): Promise<TaxSchemeDetail | null> {
    const cacheKey = `scheme:${schemeKey}`;
    const cached = cache.get<TaxSchemeDetail>(cacheKey);
    if (cached) return cached;

    // 1. Scheme
    const scheme = await repo.findSchemeByKey(schemeKey);
    if (!scheme) return null;

    // 2. Buckets
    const buckets = await repo.findBucketsBySchemeId(scheme.id);
    if (buckets.length === 0) {
      const detail: TaxSchemeDetail = { ...scheme, buckets: [] };
      cache.set(cacheKey, detail);
      return detail;
    }

    // 3. Terms (batch across all buckets)
    const bucketIds = buckets.map((b) => b.id);
    const allTerms = await repo.findTermsByBucketIds(bucketIds);

    // 4. Aliases (batch across all terms)
    const termIds = allTerms.map((t) => t.id);
    const allAliases = await repo.findAliasesByTermIds(termIds);

    // Group aliases by term_id
    const aliasesByTermId = new Map<string, TaxAlias[]>();
    for (const a of allAliases) {
      if (!aliasesByTermId.has(a.term_id)) aliasesByTermId.set(a.term_id, []);
      aliasesByTermId.get(a.term_id)!.push(a);
    }

    // Group terms by bucket_id
    const termsByBucket = new Map<string, TaxTerm[]>();
    for (const t of allTerms) {
      if (!termsByBucket.has(t.bucket_id)) termsByBucket.set(t.bucket_id, []);
      termsByBucket.get(t.bucket_id)!.push(t);
    }

    // 5. Assemble
    const bucketsWithTerms: TaxBucketWithTerms[] = buckets.map((b) => ({
      ...b,
      terms: buildTermTree(termsByBucket.get(b.id) ?? [], aliasesByTermId),
    }));

    const detail: TaxSchemeDetail = { ...scheme, buckets: bucketsWithTerms };
    cache.set(cacheKey, detail);
    return detail;
  },

  // -----------------------------------------------------------------------
  // Buckets for a scheme (flat, no terms)
  // -----------------------------------------------------------------------
  async listBuckets(schemeKey: string): Promise<{ data: TaxBucket[] } | null> {
    const scheme = await repo.findSchemeByKey(schemeKey);
    if (!scheme) return null;

    const cacheKey = `buckets:${scheme.id}`;
    const cached = cache.get<TaxBucket[]>(cacheKey);
    if (cached) return { data: cached };

    const buckets = await repo.findBucketsBySchemeId(scheme.id);
    cache.set(cacheKey, buckets);
    return { data: buckets };
  },

  // -----------------------------------------------------------------------
  // Terms for a specific bucket (flat list, not tree)
  // -----------------------------------------------------------------------
  async listTerms(
    schemeKey: string,
    bucketKey: string,
  ): Promise<{ data: TaxTermNode[] } | null> {
    const scheme = await repo.findSchemeByKey(schemeKey);
    if (!scheme) return null;

    const bucket = await repo.findBucketByKey(scheme.id, bucketKey);
    if (!bucket) return null;

    const cacheKey = `terms:${bucket.id}`;
    const cached = cache.get<TaxTermNode[]>(cacheKey);
    if (cached) return { data: cached };

    const terms = await repo.findTermsByBucketId(bucket.id);
    const termIds = terms.map((t) => t.id);
    const aliases = await repo.findAliasesByTermIds(termIds);

    const aliasesByTermId = new Map<string, TaxAlias[]>();
    for (const a of aliases) {
      if (!aliasesByTermId.has(a.term_id)) aliasesByTermId.set(a.term_id, []);
      aliasesByTermId.get(a.term_id)!.push(a);
    }

    const tree = buildTermTree(terms, aliasesByTermId);
    cache.set(cacheKey, tree);
    return { data: tree };
  },

  // -----------------------------------------------------------------------
  // Search terms by label or alias
  // -----------------------------------------------------------------------
  async searchTerms(
    q: string,
    opts: { limit?: number; schemeKey?: string; bucketKey?: string } = {},
  ): Promise<{ data: TaxTermSearchHit[] }> {
    if (!q || q.trim().length === 0) return { data: [] };

    const hits = await repo.searchTerms(q.trim(), opts);
    return { data: hits };
  },

  // -----------------------------------------------------------------------
  // Cache management (for future admin invalidation)
  // -----------------------------------------------------------------------
  clearCache(): void {
    cache.clear();
  },
};
