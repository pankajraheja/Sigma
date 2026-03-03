import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
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
} from 'lucide-react'
import { Panel, PanelRow } from '../../components/ui/Panel'
import { Card, CardBody, CardFooter } from '../../components/ui/Card'
import AssetKindBadge from './components/AssetKindBadge'
import PublicationStatusBadge from './components/PublicationStatusBadge'
import { getAssetById, getRelatedAssets } from './mock/assets'
import type { LinkedResourceKind } from './types'

// ── Linked resource icon map ──────────────────────────────────────────────────

const RESOURCE_ICON: Record<LinkedResourceKind, React.ElementType> = {
  documentation: BookOpen,
  source:        FileText,
  lineage:       GitBranch,
  runbook:       Wrench,
  jira:          ClipboardList,
  github:        Github,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function fmtShort(iso: string) {
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

function RelatedAssetCard({ asset }: { asset: ReturnType<typeof getAssetById> }) {
  if (!asset) return null
  return (
    <Card>
      <CardBody className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <AssetKindBadge kind={asset.kind} size="sm" />
          <PublicationStatusBadge status={asset.publicationStatus} size="sm" />
        </div>
        <p className="text-[12px] font-semibold text-ink leading-snug">{asset.name}</p>
        <p className="text-[11px] text-ink-faint mt-0.5">{asset.owner}</p>
      </CardBody>
      <CardFooter>
        <Link
          to={`/catalog/assets/${asset.id}`}
          className="text-[11px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          View <ArrowRight size={10} strokeWidth={2} />
        </Link>
      </CardFooter>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogAssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const asset   = id ? getAssetById(id) : undefined

  if (!asset) return <Navigate to="/catalog" replace />

  const related = getRelatedAssets(asset)

  return (
    <div className="px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-[12px] text-ink-faint mb-5" aria-label="Breadcrumb">
          <Link to="/catalog"           className="hover:text-primary-600 transition-colors">Catalog</Link>
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
            <AssetKindBadge kind={asset.kind} />
            <PublicationStatusBadge status={asset.publicationStatus} />
            {asset.nfrs.containsPII && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-sm border bg-warning-bg border-warning/20 text-warning">
                <ShieldAlert size={10} strokeWidth={2} />
                Contains PII
              </span>
            )}
            {asset.nfrs.dataClassification !== 'Internal' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-sm border bg-surface-subtle border-border text-ink-muted">
                {asset.nfrs.dataClassification}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-ink tracking-tight mb-3">
            {asset.name}
          </h1>

          <p className="text-[14px] text-ink-muted leading-relaxed mb-4 max-w-2xl">
            {asset.shortSummary}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Globe size={12} strokeWidth={1.75} className="text-ink-faint" />
              {asset.domain}
            </span>
            <span className="text-border-strong" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <User size={12} strokeWidth={1.75} className="text-ink-faint" />
              {asset.owner}
            </span>
            <span className="text-border-strong" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} strokeWidth={1.75} className="text-ink-faint" />
              Updated {fmtShort(asset.updatedAt)}
            </span>
            {asset.publishedAt && (
              <>
                <span className="text-border-strong" aria-hidden="true">·</span>
                <span className="text-[13px] text-ink-muted">
                  Published {fmtShort(asset.publishedAt)}
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
            <Panel title="Description" Icon={Info}>
              <div className="px-4 py-4">
                <p className="text-[13px] text-ink leading-relaxed">
                  {asset.description}
                </p>
              </div>
            </Panel>

            {/* Taxonomy & Classification */}
            <Panel title="Taxonomy & Classification" Icon={Globe} meta="Governance metadata">
              <PanelRow>
                <span className="text-ink-faint w-32 shrink-0">Domain</span>
                <span className="text-ink">{asset.domain}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-32 shrink-0">Function Group</span>
                <span className="text-ink">{asset.functionGroup}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-32 shrink-0">Industry Sector</span>
                <span className="text-ink">{asset.industrySector}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-32 shrink-0">Service Offering</span>
                <span className="text-ink">{asset.serviceOffering}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-32 shrink-0">Countries</span>
                <div className="flex flex-wrap gap-1">
                  {asset.country.map(c => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 border border-primary-100 text-primary-600 font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-32 shrink-0">OpCo</span>
                <div className="flex flex-wrap gap-1">
                  {asset.opco.map(o => (
                    <span key={o} className="text-[11px] text-ink">{o}</span>
                  ))}
                </div>
              </PanelRow>
            </Panel>

            {/* Tags */}
            <Panel title="Tags" Icon={Tag} meta={`${asset.tags.length} tags`}>
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {asset.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-sm bg-surface-subtle border border-border text-[11px] font-mono text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Panel>

            {/* NFRs */}
            <Panel title="Non-Functional Requirements" Icon={ShieldCheck} meta="Informational">
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Data Classification</span>
                <span className="text-ink font-medium">{asset.nfrs.dataClassification}</span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Hosting Type</span>
                <span className="flex items-center gap-1.5 text-ink">
                  <Server size={11} strokeWidth={1.75} className="text-ink-faint" />
                  {asset.nfrs.hostingType}
                </span>
              </PanelRow>
              <PanelRow>
                <span className="text-ink-faint w-40 shrink-0">Contains PII</span>
                <span className={`flex items-center gap-1.5 font-medium ${asset.nfrs.containsPII ? 'text-warning' : 'text-success'}`}>
                  {asset.nfrs.containsPII
                    ? <><ShieldAlert size={11} strokeWidth={2} /> Yes</>
                    : <><ShieldCheck size={11} strokeWidth={2} /> No</>
                  }
                </span>
              </PanelRow>
              {asset.nfrs.sla && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">SLA</span>
                  <span className="text-ink">{asset.nfrs.sla}</span>
                </PanelRow>
              )}
              {asset.nfrs.retentionPolicy && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Retention Policy</span>
                  <span className="text-ink">{asset.nfrs.retentionPolicy}</span>
                </PanelRow>
              )}
              {asset.nfrs.complianceTags.length > 0 && (
                <PanelRow>
                  <span className="text-ink-faint w-40 shrink-0">Compliance</span>
                  <div className="flex flex-wrap gap-1">
                    {asset.nfrs.complianceTags.map(ct => (
                      <span key={ct} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-ink-muted font-mono">
                        {ct}
                      </span>
                    ))}
                  </div>
                </PanelRow>
              )}
            </Panel>

            {/* Linked Resources */}
            {asset.linkedResources.length > 0 && (
              <Panel title="Linked Resources" Icon={Link2} meta={`${asset.linkedResources.length}`}>
                {asset.linkedResources.map((res) => {
                  const ResIcon = RESOURCE_ICON[res.kind] ?? ExternalLink
                  return (
                    <PanelRow key={res.label}>
                      <ResIcon size={12} strokeWidth={1.75} className="text-ink-faint shrink-0" />
                      <span className="text-ink flex-1">{res.label}</span>
                      <a
                        href={res.href}
                        className="text-[11px] text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors shrink-0"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open <ExternalLink size={10} strokeWidth={2} />
                      </a>
                    </PanelRow>
                  )
                })}
              </Panel>
            )}

            {/* Version History */}
            <Panel title="Version History" Icon={History} meta={`v${asset.currentVersion} current`}>
              {asset.versions.map((ver) => (
                <PanelRow key={ver.version}>
                  <span className="text-[11px] font-mono font-semibold text-ink w-16 shrink-0">
                    v{ver.version}
                  </span>
                  <span className="text-ink flex-1 text-[12px]">{ver.summary}</span>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-ink-faint">{fmtShort(ver.releasedAt)}</p>
                    <p className="text-[10px] text-ink-faint">{ver.changedBy}</p>
                  </div>
                </PanelRow>
              ))}
            </Panel>

            {/* Audit Timeline */}
            <Panel title="Audit Timeline" Icon={ClipboardList} meta="Change log">
              {asset.auditLog.length === 0 ? (
                <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                  No audit entries yet.
                </div>
              ) : (
                <div className="px-4 py-3">
                  <ol className="relative border-l border-border-muted space-y-4 ml-2">
                    {asset.auditLog.map((entry, i) => (
                      <li key={i} className="pl-4">
                        <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-surface border-2 border-primary-300" aria-hidden="true" />
                        <p className="text-[12px] font-medium text-ink">{entry.action}</p>
                        <p className="text-[11px] text-ink-faint mt-0.5">
                          {entry.performedBy} · {fmtShort(entry.at)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </Panel>

            {/* Certification Summary */}
            {asset.certification ? (
              <Panel title="Certification Summary" Icon={Award} meta="Governance approval">
                <PanelRow>
                  <span className="text-ink-faint w-32 shrink-0">Certified by</span>
                  <span className="text-ink">{asset.certification.certifiedBy}</span>
                </PanelRow>
                <PanelRow>
                  <span className="text-ink-faint w-32 shrink-0">Certified on</span>
                  <span className="text-ink">{fmt(asset.certification.certifiedAt)}</span>
                </PanelRow>
                <PanelRow>
                  <span className="text-ink-faint w-32 shrink-0">Valid until</span>
                  <span className="text-ink">{fmt(asset.certification.validUntil)}</span>
                </PanelRow>
                <PanelRow>
                  <span className="text-ink-faint w-32 shrink-0">Standard</span>
                  <span className="text-ink">{asset.certification.standard}</span>
                </PanelRow>
                <PanelRow>
                  <span className="text-ink-faint w-32 shrink-0">Compliance score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${asset.certification.score}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-success">
                      {asset.certification.score}/100
                    </span>
                  </div>
                </PanelRow>
              </Panel>
            ) : (
              <Panel title="Certification Summary" Icon={Award} meta="Pending">
                <div className="px-4 py-3 text-[12px] text-ink-faint italic">
                  This asset has not yet been certified. Certification is required before publication.
                </div>
              </Panel>
            )}
          </div>

          {/* ── Right: sidebar ────────────────────────────────────── */}
          <aside className="w-64 shrink-0 space-y-4 sticky top-4">

            {/* At a Glance */}
            <SidebarCard title="At a Glance">
              <MetaRow label="Version">
                <span className="text-[12px] font-mono font-semibold text-ink">v{asset.currentVersion}</span>
              </MetaRow>
              <MetaRow label="Usage">
                <span className="text-[12px] font-semibold text-ink">{asset.usageCount.toLocaleString()}</span>
              </MetaRow>
              <MetaRow label="Kind">
                <AssetKindBadge kind={asset.kind} size="sm" />
              </MetaRow>
              <MetaRow label="Status">
                <PublicationStatusBadge status={asset.publicationStatus} size="sm" />
              </MetaRow>
              <MetaRow label="Created">
                <span className="text-[12px] text-ink">{fmtShort(asset.createdAt)}</span>
              </MetaRow>
              <MetaRow label="Updated">
                <span className="text-[12px] text-ink">{fmtShort(asset.updatedAt)}</span>
              </MetaRow>
              {asset.publishedAt && (
                <MetaRow label="Published">
                  <span className="text-[12px] text-ink">{fmtShort(asset.publishedAt)}</span>
                </MetaRow>
              )}
            </SidebarCard>

            {/* Source Module */}
            <SidebarCard title="Source Module">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} strokeWidth={1.75} className="text-primary-600 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-ink capitalize">
                    {asset.sourceModule.replace(/-/g, ' ')}
                  </p>
                  {asset.sourceRef && (
                    <p className="text-[10px] text-ink-faint font-mono truncate mt-0.5">
                      {asset.sourceRef}
                    </p>
                  )}
                </div>
              </div>
            </SidebarCard>

            {/* Related assets in same domain */}
            {related.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-faint mb-3">
                  Related · {asset.domain}
                </div>
                <div className="space-y-3">
                  {related.map(rel => (
                    <RelatedAssetCard key={rel.id} asset={rel} />
                  ))}
                </div>
              </div>
            )}

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
