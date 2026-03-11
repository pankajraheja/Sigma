// ---------------------------------------------------------------------------
// PrototypeGovernancePage — Admin governance for Prototype Lab.
//
// Shows: approved block registry, workspace policies, brand validation
// enforcement, and page limits. Phase 1 is read-only display of current
// config. Phase 2 will add edit/save capabilities.
// ---------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom'
import {
  PenTool,
  CheckCircle2,
  XCircle,
  Shield,
  Blocks,
  LayoutGrid,
  Paintbrush,
} from 'lucide-react'
import PageShell, { PageContent } from '../../../components/shell/PageShell'
import PageHeader from '../../../components/shell/PageHeader'
import { APPROVED_BLOCKS } from '../../prototype-builder/lib/block-registry'
import { WORKSPACE_POLICIES, type WorkspaceType } from '../../prototype-builder/lib/workspace-policy'
import { DEFAULT_PROTOTYPE_GOVERNANCE } from '../../../shared/types/governance'

export default function PrototypeGovernancePage() {
  const navigate = useNavigate()
  const config = DEFAULT_PROTOTYPE_GOVERNANCE

  return (
    <PageShell>
      <PageHeader
        icon={PenTool}
        title="Prototype Governance"
        subtitle="Manage approved blocks, workspace policies, and brand validation for Prototype Lab"
        onBack={() => navigate('/admin')}
      />

      <PageContent className="space-y-6">
        {/* Platform settings */}
        <Section icon={Shield} title="Platform Settings">
          <div className="grid grid-cols-2 gap-4">
            <SettingRow
              label="Brand Validation"
              value={config.enforceBrandValidation ? 'Enforced' : 'Advisory'}
              active={config.enforceBrandValidation}
            />
            <SettingRow
              label="Max Pages per Workspace"
              value={String(config.maxPagesPerWorkspace)}
              active
            />
            <SettingRow
              label="Block Allowlist"
              value={config.allowedBlockIds ? `${config.allowedBlockIds.length} blocks` : 'All blocks allowed'}
              active
            />
            <SettingRow
              label="Workspace Types"
              value={config.allowedWorkspaceTypes ? `${config.allowedWorkspaceTypes.length} types` : 'All types allowed'}
              active
            />
          </div>
        </Section>

        {/* Approved blocks */}
        <Section icon={Blocks} title="Approved Block Registry" count={APPROVED_BLOCKS.length}>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-surface-subtle border-b border-border">
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Block</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Category</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Slots</th>
                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-ink-faint uppercase tracking-wider w-20">Singleton</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {APPROVED_BLOCKS.map((block) => (
                  <tr key={block.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="px-3 py-2">
                      <div>
                        <span className="font-medium text-ink">{block.name}</span>
                        <p className="text-[10px] text-ink-faint mt-0.5">{block.id}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-ink-muted text-[10px] font-medium">
                        {block.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{block.slots.length}</td>
                    <td className="px-3 py-2 text-center">
                      {block.singleton
                        ? <CheckCircle2 size={12} className="inline text-success" />
                        : <XCircle size={12} className="inline text-ink-faint" />
                      }
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {block.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-surface-subtle text-ink-faint border border-border-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Workspace policies */}
        <Section icon={LayoutGrid} title="Workspace Policies" count={Object.keys(WORKSPACE_POLICIES).length}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.entries(WORKSPACE_POLICIES) as [WorkspaceType, typeof WORKSPACE_POLICIES[WorkspaceType]][]).map(
              ([type, policy]) => (
                <div key={type} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold text-ink">{policy.name}</span>
                    <span className="text-[10px] font-mono text-ink-faint">{type}</span>
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {policy.allowedBlockIds
                      ? `${policy.allowedBlockIds.length} of ${APPROVED_BLOCKS.length} blocks`
                      : 'All blocks allowed'
                    }
                  </div>
                  {Object.keys(policy.pageOverrides).length > 0 && (
                    <div className="mt-1.5 text-[10px] text-ink-faint">
                      Page overrides: {Object.keys(policy.pageOverrides).join(', ')}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </Section>

        {/* Brand validation */}
        <Section icon={Paintbrush} title="Brand Validation Rules">
          <div className="text-[12px] text-ink-muted space-y-2">
            <RuleRow label="Color palette enforcement" description="Off-palette colors are auto-corrected to the nearest brand color" />
            <RuleRow label="Font family enforcement" description="All font-family declarations are replaced with the brand font" />
            <RuleRow label="Button border-radius enforcement" description="Button border-radius matches the configured button style (pill/rounded/square)" />
          </div>
          <p className="mt-3 text-[10px] text-ink-faint italic">
            Phase 2: configurable rule severity (error / warning / info) and custom rules.
          </p>
        </Section>
      </PageContent>
    </PageShell>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Shield
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-muted">
        <Icon size={14} className="text-ink-muted" />
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        {count != null && (
          <span className="text-[10px] text-ink-faint font-medium ml-1">({count})</span>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-subtle">
      <span className="text-[11px] text-ink-muted">{label}</span>
      <span className={`text-[11px] font-medium ${active ? 'text-ink' : 'text-ink-faint'}`}>
        {value}
      </span>
    </div>
  )
}

function RuleRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 size={12} className="text-success shrink-0 mt-0.5" />
      <div>
        <span className="font-medium text-ink">{label}</span>
        <p className="text-[10px] text-ink-faint mt-0.5">{description}</p>
      </div>
    </div>
  )
}
