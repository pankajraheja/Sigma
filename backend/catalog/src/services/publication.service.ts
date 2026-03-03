// ---------------------------------------------------------------------------
// Publication Service — promotion history and submission → published-asset lookup
// ---------------------------------------------------------------------------

import { publicationRepository } from '../repositories/publication.repository.js';
import { assetRepository } from '../repositories/asset.repository.js';
import type { PublicationPromotion, CatalogAsset } from '../models/catalog.types.js';
import { NotFoundError } from './asset.service.js';

export const publicationService = {
  // -------------------------------------------------------------------------
  // Get promotion history for a catalog asset
  // -------------------------------------------------------------------------
  async getPromotions(catalogAssetId: string): Promise<PublicationPromotion[]> {
    return publicationRepository.findPromotions(catalogAssetId);
  },

  // -------------------------------------------------------------------------
  // Given a submission ID, find the catalog asset it produced
  //
  // Flow:
  //   governance.asset_submissions  →  find approved submission
  //   → lookup catalog.assets by (source_module_id, source_entity_type, source_entity_id)
  // -------------------------------------------------------------------------
  async getPublishedAssetForSubmission(submissionId: string): Promise<CatalogAsset> {
    const submission = await publicationRepository.findSubmissionById(submissionId);

    if (!submission) {
      throw new NotFoundError(`Submission not found: ${submissionId}`);
    }

    if (submission.governance_status !== 'approved') {
      throw new NotFoundError(
        `Submission ${submissionId} has not been approved (status: ${submission.governance_status})`,
      );
    }

    const asset = await assetRepository.findBySourceEntity(
      submission.source_module_id,
      submission.source_entity_type,
      submission.source_entity_id,
    );

    if (!asset) {
      throw new NotFoundError(
        `No catalog asset found for approved submission ${submissionId}. ` +
          `The asset may not have been promoted to the catalog yet.`,
      );
    }

    return asset;
  },
};
