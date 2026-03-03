// ---------------------------------------------------------------------------
// Asset Repository — data access for catalog.assets, asset_versions, asset_source_refs
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';
import type { AssetListQuery } from '../models/api.types.js';
import type {
  CatalogAsset,
  AssetVersion,
  AssetSourceRef,
  AssetClassification,
  AssetTag,
} from '../models/catalog.types.js';

export interface AssetPage {
  assets: CatalogAsset[];
  total: number;
}

export const assetRepository = {
  // -------------------------------------------------------------------------
  // List assets with optional filters + pagination
  // -------------------------------------------------------------------------
  async list(query: AssetListQuery): Promise<AssetPage> {
    const {
      publication_status,
      asset_kind,
      compliance_tag,
      domain,
      primary_country_id: country_id,
      opco_id,
      function_group_id,
      industry_sector_id,
      service_offering_id,
      page = 1,
      pageSize = 20,
      sort = 'updated_at',
      order = 'desc',
    } = query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Default: only discoverable assets
    if (publication_status) {
      conditions.push(`a.publication_status = $${idx++}`);
      params.push(publication_status);
    } else {
      conditions.push(`a.publication_status IN ('ga', 'preview')`);
    }

    if (asset_kind) {
      conditions.push(`a.asset_kind = $${idx++}`);
      params.push(asset_kind);
    }
    if (compliance_tag) {
      conditions.push(`$${idx++} = ANY(a.compliance_tags)`);
      params.push(compliance_tag);
    }
    if (domain) {
      conditions.push(`a.domain = $${idx++}`);
      params.push(domain);
    }
    if (country_id) {
      conditions.push(`a.primary_country_id = $${idx++}`);
      params.push(country_id);
    }
    if (opco_id) {
      conditions.push(`a.opco_id = $${idx++}`);
      params.push(opco_id);
    }
    if (function_group_id) {
      conditions.push(`a.function_group_id = $${idx++}`);
      params.push(function_group_id);
    }
    if (industry_sector_id) {
      conditions.push(`a.industry_sector_id = $${idx++}`);
      params.push(industry_sector_id);
    }
    if (service_offering_id) {
      conditions.push(`a.service_offering_id = $${idx++}`);
      params.push(service_offering_id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSorts: Record<string, string> = {
      name: 'a.name',
      published_at: 'a.published_at',
      updated_at: 'a.updated_at',
    };
    const orderCol = allowedSorts[sort] ?? 'a.updated_at';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const sql = `
      SELECT a.*
      FROM catalog.assets a
      ${where}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(pageSize, offset);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM catalog.assets a
      ${where}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query<CatalogAsset>(sql, params),
      db.query<{ total: number }>(countSql, params.slice(0, -2)),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    return { assets: dataResult.rows, total };
  },

  // -------------------------------------------------------------------------
  // Get a single asset by ID
  // -------------------------------------------------------------------------
  async findById(id: string): Promise<CatalogAsset | null> {
    const sql = `
      SELECT a.*
      FROM catalog.assets a
      WHERE a.id = $1
    `;
    const result = await db.query<CatalogAsset>(sql, [id]);
    return result.rows[0] ?? null;
  },

  // -------------------------------------------------------------------------
  // Get all versions for an asset (most recent first)
  // -------------------------------------------------------------------------
  async findVersions(assetId: string): Promise<AssetVersion[]> {
    const sql = `
      SELECT v.*
      FROM catalog.asset_versions v
      WHERE v.asset_id = $1
      ORDER BY v.released_at DESC NULLS LAST, v.created_at DESC
    `;
    const result = await db.query<AssetVersion>(sql, [assetId]);
    return result.rows;
  },

  // -------------------------------------------------------------------------
  // Get source refs for an asset (primary first)
  // -------------------------------------------------------------------------
  async findSourceRefs(assetId: string): Promise<AssetSourceRef[]> {
    const sql = `
      SELECT r.*
      FROM catalog.asset_source_refs r
      WHERE r.asset_id = $1
      ORDER BY r.is_primary DESC, r.added_at ASC
    `;
    const result = await db.query<AssetSourceRef>(sql, [assetId]);
    return result.rows;
  },

  // -------------------------------------------------------------------------
  // Find asset by source entity (for submission → published-asset lookup)
  // -------------------------------------------------------------------------
  async findBySourceEntity(
    sourceModuleId: string,
    sourceEntityType: string,
    sourceEntityId: string,
  ): Promise<CatalogAsset | null> {
    const sql = `
      SELECT a.*
      FROM catalog.assets a
      WHERE a.source_module_id = $1
        AND a.source_entity_type = $2
        AND a.source_entity_id = $3
    `;
    const result = await db.query<CatalogAsset>(sql, [
      sourceModuleId,
      sourceEntityType,
      sourceEntityId,
    ]);
    return result.rows[0] ?? null;
  },

  // -------------------------------------------------------------------------
  // Get taxonomy classifications for an asset (joined with term details)
  // -------------------------------------------------------------------------
  async findClassifications(assetId: string): Promise<AssetClassification[]> {
    const sql = `
      SELECT
        ac.id,
        ac.asset_id,
        ac.term_id,
        ac.scheme_code,
        ac.classified_by,
        ac.classified_at,
        t.label  AS term_label,
        t.code   AS term_code
      FROM catalog.asset_classifications ac
      JOIN metadata.taxonomy_terms t ON t.id = ac.term_id
      WHERE ac.asset_id = $1
      ORDER BY ac.scheme_code, t.label
    `;
    const result = await db.query<AssetClassification>(sql, [assetId]);
    return result.rows;
  },

  // -------------------------------------------------------------------------
  // Get tags for an asset (joined with tag label)
  // -------------------------------------------------------------------------
  async findAssetTags(assetId: string): Promise<AssetTag[]> {
    const sql = `
      SELECT
        at2.asset_id,
        at2.tag_id,
        at2.tagged_by,
        at2.tagged_at,
        tg.label AS tag_label
      FROM catalog.asset_tags at2
      JOIN metadata.tags tg ON tg.id = at2.tag_id
      WHERE at2.asset_id = $1
      ORDER BY tg.label
    `;
    const result = await db.query<AssetTag>(sql, [assetId]);
    return result.rows;
  },
};
