import { ENTERPRISE_STANDARDS } from '../registry/standards'
import type { EnterpriseStandard, StandardDomain } from '../types'

// ---------------------------------------------------------------------------
// standardsHelpers — query helpers for the enterprise standards registry.
// ---------------------------------------------------------------------------

/** Return a standard by id, or undefined if not found. */
export function getStandardById(id: string): EnterpriseStandard | undefined {
  return ENTERPRISE_STANDARDS.find((s) => s.id === id)
}

/** Return all standards in a given governance domain. */
export function getStandardsByDomain(domain: StandardDomain): EnterpriseStandard[] {
  return ENTERPRISE_STANDARDS.filter((s) => s.domain === domain)
}

/** Return a deduplicated list of all domains present in the registry. */
export function getAllDomains(): StandardDomain[] {
  return [...new Set(ENTERPRISE_STANDARDS.map((s) => s.domain))]
}
