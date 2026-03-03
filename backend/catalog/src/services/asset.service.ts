// ---------------------------------------------------------------------------
// Asset Service — business logic for catalog asset retrieval
// ---------------------------------------------------------------------------

import { assetRepository } from '../repositories/asset.repository.js';
import type {
  AssetListQuery,
  AssetListResponse,
  AssetDetailResponse,
} from '../models/api.types.js';
import { parsePagination } from '../models/api.types.js';
import type {
  AssetVersion,
  AssetSourceRef,
  AssetClassification,
  AssetTag,
} from '../models/catalog.types.js';

export const assetService = {
  // -------------------------------------------------------------------------
  // List assets — normalises query params, returns flat pagination shape
  // -------------------------------------------------------------------------
  async list(rawQuery: Partial<AssetListQuery>): Promise<AssetListResponse> {
    const { page, pageSize } = parsePagination(rawQuery);

    const validSorts = ['name', 'published_at', 'updated_at'] as const;
    const sort = validSorts.includes(rawQuery.sort as never)
      ? rawQuery.sort!
      : 'updated_at';

    const query: AssetListQuery = {
      ...rawQuery,
      page,
      pageSize,
      sort,
      order: rawQuery.order === 'asc' ? 'asc' : 'desc',
    };

    const { assets, total } = await assetRepository.list(query);
    return { items: assets, page, pageSize, total };
  },

  // -------------------------------------------------------------------------
  // Get a single asset with its primary source ref
  // Runs both queries in parallel; throws 404 if asset not found
  // -------------------------------------------------------------------------
  async getById(id: string): Promise<AssetDetailResponse> {
    if (!isUuid(id)) throw new NotFoundError(`Asset not found: ${id}`);

    const [asset, refs] = await Promise.all([
      assetRepository.findById(id),
      assetRepository.findSourceRefs(id),
    ]);

    if (!asset) throw new NotFoundError(`Asset not found: ${id}`);

    // Return primary ref if one is flagged, otherwise first ref, otherwise null
    const sourceRef = refs.find((r) => r.is_primary) ?? refs[0] ?? null;
    return { asset, sourceRef };
  },

  // -------------------------------------------------------------------------
  // Get version history (validates asset exists first)
  // -------------------------------------------------------------------------
  async getVersions(assetId: string): Promise<AssetVersion[]> {
    await assetService.getById(assetId);
    return assetRepository.findVersions(assetId);
  },

  // -------------------------------------------------------------------------
  // Get all source references (validates asset exists first)
  // -------------------------------------------------------------------------
  async getSourceRefs(assetId: string): Promise<AssetSourceRef[]> {
    await assetService.getById(assetId);
    return assetRepository.findSourceRefs(assetId);
  },

  // -------------------------------------------------------------------------
  // Get taxonomy classifications for an asset (validates asset exists first)
  // -------------------------------------------------------------------------
  async getClassifications(assetId: string): Promise<AssetClassification[]> {
    await assetService.getById(assetId);
    return assetRepository.findClassifications(assetId);
  },

  // -------------------------------------------------------------------------
  // Get tags for an asset (validates asset exists first)
  // -------------------------------------------------------------------------
  async getAssetTags(assetId: string): Promise<AssetTag[]> {
    await assetService.getById(assetId);
    return assetRepository.findAssetTags(assetId);
  },
};

// ---------------------------------------------------------------------------
// Domain errors (caught by error middleware)
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
