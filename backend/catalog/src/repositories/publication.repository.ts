// ---------------------------------------------------------------------------
// Publication Repository — governance.publication_promotions + submission lookup
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';
import type {
  PublicationPromotion,
  AssetSubmissionSummary,
} from '../models/catalog.types.js';

export const publicationRepository = {
  // -------------------------------------------------------------------------
  // Get all promotion history for a catalog asset (oldest first)
  // -------------------------------------------------------------------------
  async findPromotions(catalogAssetId: string): Promise<PublicationPromotion[]> {
    const sql = `
      SELECT p.*
      FROM governance.publication_promotions p
      WHERE p.catalog_asset_id = $1
      ORDER BY p.promoted_at ASC
    `;
    const result = await db.query<PublicationPromotion>(sql, [catalogAssetId]);
    return result.rows;
  },

  // -------------------------------------------------------------------------
  // Find the approved submission that sourced a given source_entity_id
  // Used by GET /submissions/:id/published-asset
  // -------------------------------------------------------------------------
  async findSubmissionById(submissionId: string): Promise<AssetSubmissionSummary | null> {
    const sql = `
      SELECT
        s.id,
        s.governance_status,
        s.source_entity_id,
        s.source_entity_type,
        s.source_module_id,
        s.resolved_at
      FROM governance.asset_submissions s
      WHERE s.id = $1
    `;
    const result = await db.query<AssetSubmissionSummary>(sql, [submissionId]);
    return result.rows[0] ?? null;
  },
};
