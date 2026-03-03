import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Globe,
  Calendar,
  BarChart2,
  Tag,
  Info,
  ShieldCheck,
  Link2,
  History,
  ClipboardList,
  Award,
  Server,
  ShieldAlert,
  ExternalLink,
  GitBranch,
  FileText,
  Github,
  BookOpen,
  Wrench,
  AlertCircle,
  Sparkles,
  Lightbulb,
  Wand2,
  AlertTriangle,
} from 'lucide-react'
import { Panel, PanelRow } from '../../components/ui/Panel'
import AssetKindBadge from './components/AssetKindBadge'
import PublicationStatusBadge from './components/PublicationStatusBadge'
import { useCatalogAssetDetail } from './hooks/useCatalogAssetDetail'
import { useAssetTaxonomy } from './hooks/useAssetTaxonomy'
import { useSimilarAssets } from './hooks/useSimilarAssets'
import { useAssetSummary } from './hooks/useAssetSummary'
import { useAssetRecommendations } from './hooks/useAssetRecommendations'
import { useAssetEnrichmentSuggestions } from './hooks/useAssetEnrichmentSuggestions'
import type { BackendAssetVersion, BackendSourceRef, BackendSimilarAsset, ApiAssetRecommendation } from './api/types'

// ── Source-ref → icon / kind map ──────────────────────────────────────────────

type RefKind = 'documentation' | 'source' | 'lineage' | 'runbook' | 'jira' | 'github'

const REF_TYPE_KIND: Record<BackendSourceRef['ref_type'], RefKind> = {
  forge_asset_id:  'lineage',
  github_repo:     'github',
  dbt_model:       'source',
  confluence_page: 'documentation',
  jira_project:    'jira',
  other:           'source',
}

const REF_KIND_ICON: Record<RefKind, React.ElementType> = {
  documentation: BookOpen,
  source:        FileText,
  lineage:       GitBranch,
  runbook:       Wrench,
  jira:          ClipboardList,
  github:        Github,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtShort(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4 shadow-card">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-faint mb-3">
        {title}
      </div>
      {children}
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border-muted last:border-0">
      <span className="text-[12px] text-ink-faint shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function VersionRow({ ver }: { ver: BackendAssetVersion }) {
  return (
    <PanelRow>
      <span className="text-[11px] font-mono font-semibold text-ink w-20 shrink-0">
        v{ver.version}
        {ver.is_current && (
          <span className="ml-1.5 text-[9px] font-semibold text-success border border-success/30 bg-success-bg rounded px-1 py-0.5 align-middle">
            current
          </span>
        )}
      </span>
      <span className="text-ink flex-1 text-[12px]">{ver.change_summary ?? '—'}</span>
      <div className="text-right shrink-0">
        <p className="text-[11px] text-ink-faint">{fmtShort(ver.released_at)}</p>
        {ver.released_by && (
          <p className="text-[10px] text-ink-faint">{ver.released_by}</p>
        )}
      </div>
    </PanelRow>
  )
}

function SimilarAssetRow({ asset: a }: { asset: BackendSimilarAsset }) {
  return (
    <PanelRow>
      <AssetKindBadge kind={a.asset_kind} size="sm" />
      <Link
        to={`/catalog/assets/${a.id}`}
        className="flex-1 text-[12px] text-primary-600 hover:text-primary-700 truncate transition-colors"
        title={a.name}
      >
        {a.name}
      </Link>
      {a.domain && (
        <span className="text-[11px] text-ink-faint shrink-0 hidden sm:block">
          {a.domain}
        </span>
      )}
      <PublicationStatusBadge status={a.publication_status} size="sm" />
    </PanelRow>
  )
}

function AiGeneratedBadge({ provider, model }: { provider: string; model: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
      <Sparkles size={10} className="text-ribbon shrink-0" aria-hidden="true" />
      <span className="text-[10px] text-ink-faint">
        AI-generated · {provider === 'openai' ? model : 'preview mode'} · not authoritative
      </span>
    </div>
  )
}

function RecommendedAssetRow({ rec }: { rec: ApiAssetRecommendation }) {
  const a = rec.asset
  return (
    <PanelRow>
      <AssetKindBadge kind={a.asset_kind} size="sm" />
      <div className="flex-1 min-w-0">
        <Link
          to={`/catalog/assets/${a.id}`}
          className="block text-[12px] text-primary-600 hover:text-primary-700 truncate transition-colors"
          title={a.name}
        >
          {a.name}
        </Link>
        {rec.reason && (
          <span className="block text-[11px] text-ink-faint italic truncate">{rec.reason}</span>
        )}
      </div>
      <PublicationStatusBadge status={a.publication_status} size="sm" />
    </PanelRow>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="px-8 py-10 animate-pulse">
      <div className="max-w-6xl mx-auto">
        <div className="h-3 w-48 bg-surface-subtle rounded mb-6" />
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-16 bg-surface-subtle rounded" />
            <div className="h-5 w-12 bg-surface-subtle rounded" />
          </div>
          <div className="h-7 w-2/3 bg-surface-subtle rounded mb-3" />
          <div className="h-4 w-full bg-surface-subtle rounded mb-1.5" />
          <div className="h-4 w-4/5 bg-surface-subtle rounded" />
        </div>
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-4 h-28" />
            ))}
          </div>
          <div className="w-64 space-y-4">
            <div className="bg-surface border border-border rounded-md p-4 h-40" />
            <div className="bg-surface border border-border rounded-md p-4 h-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogAssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { detail, versions, loading, error, notFound } = useCatalogAssetDetail(id)
  const { classifications, tags: assetTags } = useAssetTaxonomy(detail?.asset.id)
  const { assets: similarAssets, loading: similarLoading } = useSimilarAssets(detail?.asset.id)
  const { summary, loading: summaryLoading } = useAssetSummary(detail?.asset.id)
  const { recommendations, provider: recProvider, loading: recLoading } = useAssetRecommendations(detail?.asset.id)
  const { suggestions, loading: enrichLoading } = useAssetEnrichmentSuggestions(detail?.asset.id)

  if (loading) return <LoadingSkeleton />

  if (notFound) return <Navigate to="/catalog" replace />

  if (error) {
    return (
      <div className="px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/catalog/discovery"
            className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Back to Discovery
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-[13px]">
            <AlertCircle size={15} strokeWidth={2} />
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!detail) return null

  const { asset, sourceRef } = detail
  const currentVersion = versions.find((v) => v.is_current) ?? versions[0] ?? null

  // Group taxonomy classifications by scheme_code
  const classificationGroups = Object.entries(
    classifications.reduce<Record<string, typeof classifications>>((acc, c) => {
      const key = c.scheme_code
      ;(acc[key] ??= []).push(c)
      return acc
    }, {}),
  )

  // Build linked resources list from the primary source ref
  const linkedResources = sourceRef
    ? [{
        label:   sourceRef.label ?? sourceRef.ref_value,
        href:    sourceRef.href,
        icon:    REF_KIND_ICON[REF_TYPE_KIND[sourceRef.ref_type]],
        refValue: sourceRef.ref_value,
      }]
    : []

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-[12px] text-ink-faint mb-5" aria-label="Breadcrumb">
          <Link to="/catalog"           className="hover:text-primary-600 transition-colors">AI Navigator</Link>
          <span aria-hidden="true">/</span>
          <Link to="/catalog/discovery" className="hover:text-primary-600 transition-colors">Discovery</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink truncate max-w-52">{asset.name}</span>
        </nav>

        {/* ── Back link ────────────────────────────────────────────── */}
        <Link
          to="/catalog/discovery"
          className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-primary-600 transition-colors mb-6"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back to Discovery
        </Link>

        {/* ── Asset header ─────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-6 shadow-card">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <AssetKindBadge kind={asset.asset_kind} />
            <PublicationStatusBadge status={asset.publication_status} />
            {asset.contains_pii && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-sm border bg-warning-bg border-warning/20 text-warning">
                <ShieldAlert size={10} strokeWidth={2} />
                Contains PII
              </span>
            )}
            {asset.data_classification && asset.data_classification !== 'Internal' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-sm border bg-surface-subtle border-border text-ink-muted">
                {asset.data_classification}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-ink tracking-tight mb-3">
            {asset.name}
          </h1>

          <p className="text-[14px] text-ink-muted leading-relaxed mb-4 max-w-2xl">
            {asset.short_summary ?? ''}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            {asset.domain && (
              <>
                <span className="flex items-center gap-1.5">
                  <Globe size={12} strokeWidth={1.75} className="text-ink-faint" />
                  {asset.domain}
                </span>
                <span className="text-border-strong" aria-hidden="true">·</span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <User size={12} strokeWidth={1.75} className="text-ink-faint" />
              <span className="font-mono text-[12px] truncate max-w-40" title={asset.owner_id}>
                {asset.owner_id}
              </span>
            </span>
            <span className="text-border-strong" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} strokeWidth={1.75} className="text-ink-faint" />
              Updated {fmtShort(asset.updated_at)}
            </span>
            {asset.published_at && (
              <>
                <span className="text-border-strong" aria-hidden="true">·</span>
                <span className="text-[13px] text-ink-muted">
                  Published {fmtShort(asset.published_at)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Two-column layout ────────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* ── Left: main detail panels ──────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Description */}
            {asset.description && (
              <Panel title="Description" Icon={Info}>
                <div className="px-4 py-4">
                  <p className="text-[13px] text-ink leading-relaxed">
                    {asset.description}
                  </p>
                </div>
              </Panel>
            )}

            {/* AI Summary */}
            <Panel title="AI Summary" Icon={Sparkles} meta={summaryLoading ? '…' : summary ? summary.provider : undefined}>
              {summaryLoading ? (
                <div className="px-4 py-3 space-y-2 animate-pulse">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-3 bg-surface-subtle rounded" style={{ width: `${85 - i * 10}%` }} />
                  ))}
                </div>
              ) : summary ? (
                <div>
                  <AiGeneratedBadge provider={summary.provider} model={summary.model} />
                  <div className="px-4 py-3 space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-1">Business</p>
                      <p className="text-[13px] text-ink leading-relaxed">{summary.businessSummary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-1">Technical</p>
                      <p className="text-[13px] text-ink leading-relaxed">{summary.technicalSummary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-1">Reuse Guidance</p>
                      <p className="text-[13px] text-ink leading-relaxed">{summary.reuseGuidance}</p>
                    </div>
                    {summary.keyRisks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-1">Key Risks</p>
                        <ul className="space-y-1">
                          {summary.keyRisks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[12px] text-warning">
                              <AlertTriangle size={11} strokeWidth={2} className="shrink-0 mt-0.5" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                  Summary not available.
                </div>
              )}
            </Panel>

            {/* Taxonomy & Classification */}
            <Panel title="Taxonomy & Classification" Icon={Globe} meta="Governance metadata">
              {asset.domain && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Domain</span>
                  <span className="text-ink">{asset.domain}</span>
                </PanelRow>
              )}
              {classificationGroups.map(([scheme, items]) => (
                <PanelRow key={scheme}>
                  <span className="text-ink-faint w-40 shrink-0 capitalize">
                    {scheme.replace(/_/g, ' ')}
                  </span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {items.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center px-1.5 py-0.5 bg-surface-subtle border border-border rounded-sm text-[11px] font-semibold text-ink-muted"
                      >
                        {item.term_label}
                      </span>
                    ))}
                  </div>
                </PanelRow>
              ))}
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Function Group</span>
                <span className="text-ink font-mono text-[11px]">{asset.function_group_id ?? '—'}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Industry Sector</span>
                <span className="text-ink font-mono text-[11px]">{asset.industry_sector_id ?? '—'}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Service Offering</span>
                <span className="text-ink font-mono text-[11px]">{asset.service_offering_id ?? '—'}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Country</span>
                <span className="text-ink font-mono text-[11px]">{asset.primary_country_id ?? '—'}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">OpCo</span>
                <span className="text-ink font-mono text-[11px]">{asset.opco_id ?? '—'}</span>
              </PanelRow>
            </Panel>

            {/* Compliance tags */}
            {asset.compliance_tags.length > 0 && (
              <Panel title="Compliance Tags" Icon={Tag} meta={`${asset.compliance_tags.length}`}>
                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {asset.compliance_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-sm bg-surface-subtle border border-border text-[11px] font-mono text-ink-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Panel>
            )}

            {/* Informal tags — from catalog.asset_tags */}
            {assetTags.length > 0 && (
              <Panel title="Tags" Icon={Tag} meta={`${assetTags.length}`}>
                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {assetTags.map((t) => (
                    <span
                      key={t.tag_id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[11px] text-ink-muted"
                    >
                      #{t.tag_label}
                    </span>
                  ))}
                </div>
              </Panel>
            )}

            {/* NFRs */}
            <Panel title="Non-Functional Requirements" Icon={ShieldCheck} meta="Informational">
              {asset.data_classification && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Data Classification</span>
                  <span className="text-ink font-medium">{asset.data_classification}</span>
                </PanelRow>
              )}
              {asset.hosting_type && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Hosting Type</span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <Server size={11} strokeWidth={1.75} className="text-ink-faint" />
                    {asset.hosting_type}
                  </span>
                </PanelRow>
              )}
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Contains PII</span>
                <span className={`flex items-center gap-1.5 font-medium ${asset.contains_pii ? 'text-warning' : 'text-success'}`}>
                  {asset.contains_pii
                    ? <><ShieldAlert size={11} strokeWidth={2} /> Yes</>
                    : <><ShieldCheck size={11} strokeWidth={2} /> No</>
                  }
                </span>
              </PanelRow>
              {asset.sla_description && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">SLA</span>
                  <span className="text-ink">{asset.sla_description}</span>
                </PanelRow>
              )}
              {asset.retention_requirement && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Retention Policy</span>
                  <span className="text-ink">{asset.retention_requirement}</span>
                </PanelRow>
              )}
              {asset.data_residency && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Data Residency</span>
                  <span className="text-ink">{asset.data_residency}</span>
                </PanelRow>
              )}
              {asset.audience_type && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Audience</span>
                  <span className="text-ink">{asset.audience_type}</span>
                </PanelRow>
              )}
              {asset.business_criticality && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Business Criticality</span>
                  <span className="text-ink">{asset.business_criticality}</span>
                </PanelRow>
              )}
            </Panel>

            {/* Linked Resources — from source refs */}
            {linkedResources.length > 0 && (
              <Panel title="Linked Resources" Icon={Link2} meta={`${linkedResources.length}`}>
                {linkedResources.map((res) => {
                  const ResIcon = res.icon
                  return (
                    <PanelRow key={res.label}>
                      <ResIcon size={12} strokeWidth={1.75} className="text-ink-faint shrink-0" />
                      <span className="text-ink flex-1">{res.label}</span>
                      {res.href ? (
                        <a
                          href={res.href}
                          className="text-[11px] text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors shrink-0"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open <ExternalLink size={10} strokeWidth={2} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-ink-faint font-mono truncate max-w-32 shrink-0">
                          {res.refValue}
                        </span>
                      )}
                    </PanelRow>
                  )
                })}
              </Panel>
            )}

            {/* Version History */}
            <Panel
              title="Version History"
              Icon={History}
              meta={currentVersion ? `v${currentVersion.version} current` : 'no versions'}
            >
              {versions.length === 0 ? (
                <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                  No version records found.
                </div>
              ) : (
                versions.map((ver) => <VersionRow key={ver.id} ver={ver} />)
              )}
            </Panel>

            {/* Similar Assets — heuristic similarity (Phase 1) */}
            <Panel
              title="Similar Assets"
              Icon={Sparkles}
              meta={similarLoading ? '…' : `${similarAssets.length}`}
            >
              {similarLoading ? (
                <div className="px-4 py-3 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-8 bg-surface-subtle rounded animate-pulse" />
                  ))}
                </div>
              ) : similarAssets.length === 0 ? (
                <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                  No similar assets found.
                </div>
              ) : (
                similarAssets.map((a) => <SimilarAssetRow key={a.id} asset={a} />)
              )}
            </Panel>

            {/* Recommended Assets — AI-explained reasons */}
            <Panel
              title="Recommended Assets"
              Icon={Lightbulb}
              meta={recLoading ? '…' : `${recommendations.length}`}
            >
              {recLoading ? (
                <div className="px-4 py-3 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-8 bg-surface-subtle rounded animate-pulse" />
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                  No recommendations found.
                </div>
              ) : (
                <>
                  <AiGeneratedBadge provider={recProvider ?? 'stub'} model="stub-v1" />
                  {recommendations.map((rec) => (
                    <RecommendedAssetRow key={rec.asset.id} rec={rec} />
                  ))}
                </>
              )}
            </Panel>

            {/* Enrichment Suggestions — AI metadata quality hints */}
            <Panel title="Enrichment Suggestions" Icon={Wand2}>
              {enrichLoading ? (
                <div className="px-4 py-3 space-y-2 animate-pulse">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-8 bg-surface-subtle rounded" />
                  ))}
                </div>
              ) : !suggestions || (
                suggestions.suggestedTags.length === 0 &&
                suggestions.suggestedClassifications.length === 0 &&
                suggestions.nfrClarifications.length === 0
              ) ? (
                <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                  No enrichment suggestions at this time.
                </div>
              ) : (
                <div>
                  <AiGeneratedBadge provider={suggestions.provider} model="stub-v1" />
                  <div className="px-4 py-3 space-y-4">
                    {suggestions.suggestedTags.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-2">Suggested Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.suggestedTags.map((s, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[11px] text-ink-muted">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.confidence === 'high' ? 'bg-success' : s.confidence === 'medium' ? 'bg-warning' : 'bg-border-strong'}`} />
                              #{s.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.suggestedClassifications.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-2">Classifications</p>
                        <div className="space-y-1.5">
                          {suggestions.suggestedClassifications.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-[12px]">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.confidence === 'high' ? 'bg-success' : s.confidence === 'medium' ? 'bg-warning' : 'bg-border-strong'}`} />
                              <span className="text-ink-faint capitalize">{s.value.scheme_code.replace(/_/g, ' ')}</span>
                              <span className="text-ink font-medium">{s.value.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.nfrClarifications.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-2">NFR Clarifications</p>
                        <div className="space-y-1.5">
                          {suggestions.nfrClarifications.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-[12px]">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1 bg-warning" />
                              <div>
                                <span className="text-ink-faint capitalize">{s.value.field.replace(/_/g, ' ')}</span>
                                <span className="text-ink-faint mx-1">→</span>
                                <span className="text-ink font-medium">{s.value.suggestedValue}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Panel>

            {/* Audit Timeline — not yet available from backend */}
            <Panel title="Audit Timeline" Icon={ClipboardList} meta="Change log">
              <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                Audit log not yet available.
              </div>
            </Panel>

            {/* Certification Summary — not yet available from backend */}
            <Panel title="Certification Summary" Icon={Award} meta="Pending">
              <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                This asset has not yet been certified. Certification is required before publication.
              </div>
            </Panel>
          </div>

          {/* ── Right: sidebar ────────────────────────────────────── */}
          <aside className="w-64 shrink-0 space-y-4 sticky top-4">

            {/* At a Glance */}
            <SidebarCard title="At a Glance">
              {currentVersion && (
                <MetaRow label="Version">
                  <span className="text-[12px] font-mono font-semibold text-ink">
                    v{currentVersion.version}
                  </span>
                </MetaRow>
              )}
              <MetaRow label="Usage">
                <span className="text-[12px] font-semibold text-ink">
                  {asset.usage_count.toLocaleString()}
                </span>
              </MetaRow>
              <MetaRow label="Kind">
                <AssetKindBadge kind={asset.asset_kind} size="sm" />
              </MetaRow>
              <MetaRow label="Status">
                <PublicationStatusBadge status={asset.publication_status} size="sm" />
              </MetaRow>
              <MetaRow label="Created">
                <span className="text-[12px] text-ink">{fmtShort(asset.created_at)}</span>
              </MetaRow>
              <MetaRow label="Updated">
                <span className="text-[12px] text-ink">{fmtShort(asset.updated_at)}</span>
              </MetaRow>
              {asset.published_at && (
                <MetaRow label="Published">
                  <span className="text-[12px] text-ink">{fmtShort(asset.published_at)}</span>
                </MetaRow>
              )}
            </SidebarCard>

            {/* Source Module */}
            <SidebarCard title="Source Module">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} strokeWidth={1.75} className="text-primary-600 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-ink capitalize">
                    {asset.source_module_id.replace(/-/g, ' ')}
                  </p>
                  <p className="text-[10px] text-ink-faint font-mono truncate mt-0.5">
                    {asset.source_entity_type} · {asset.source_entity_id}
                  </p>
                </div>
              </div>
            </SidebarCard>

            {/* Navigation */}
            <Link
              to="/catalog/discovery"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-md border border-border bg-surface hover:bg-surface-subtle text-[12px] font-medium text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={12} strokeWidth={2} />
              Back to Discovery
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
