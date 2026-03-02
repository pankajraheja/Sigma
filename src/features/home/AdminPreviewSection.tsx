import { Link } from 'react-router-dom'
import {
  Network, Database, Tag,
  Users, Shield, Lock,
  ArrowRight,
} from 'lucide-react'
import clsx from 'clsx'
import { Panel, PanelRow } from '../../components/ui/Panel'
import SectionHeader from '../../components/ui/SectionHeader'

// ── Taxonomy panel ──────────────────────────────────────────────────────────

const TAXONOMY_TREE = [
  { label: 'Data & Analytics',      depth: 0 },
  { label: 'Streaming',             depth: 1 },
  { label: 'Batch Processing',      depth: 1 },
  { label: 'Data Products',         depth: 1 },
  { label: 'Customer Experience',   depth: 0 },
  { label: 'Portals & Interfaces',  depth: 1 },
  { label: 'Integration Layer',     depth: 1 },
]

function TaxonomyPanel() {
  return (
    <Panel title="Taxonomy" Icon={Network} meta="3 levels · 2 domains">
      {TAXONOMY_TREE.map((node) => (
        <PanelRow key={node.label}>
          <span
            className="text-ink-faint shrink-0 select-none"
            style={{ paddingLeft: `${node.depth * 12}px` }}
          >
            {node.depth === 0 ? '▸' : '·'}
          </span>
          <span className={clsx('truncate', node.depth === 0 ? 'text-ink' : 'text-ink-muted')}>
            {node.label}
          </span>
        </PanelRow>
      ))}
    </Panel>
  )
}

// ── Metadata schema panel ───────────────────────────────────────────────────

const SCHEMA_FIELDS = [
  { name: 'Name',        type: 'Text',    required: true  },
  { name: 'Owner',       type: 'User',    required: true  },
  { name: 'Domain',      type: 'Enum',    required: true  },
  { name: 'Status',      type: 'Enum',    required: false },
  { name: 'Tags',        type: 'Array',   required: false },
  { name: 'Description', type: 'Text',    required: false },
]

function MetadataSchemaPanel() {
  return (
    <Panel title="Metadata Schema" Icon={Database} meta={`${SCHEMA_FIELDS.length} fields`}>
      {SCHEMA_FIELDS.map((field) => (
        <PanelRow key={field.name}>
          <span className="text-ink flex-1">{field.name}</span>
          <span className="text-ink-faint w-10 shrink-0">{field.type}</span>
          <span className={clsx('text-[10px] font-semibold w-14 text-right shrink-0',
            field.required ? 'text-primary-600' : 'text-ink-faint'
          )}>
            {field.required ? 'Required' : 'Optional'}
          </span>
        </PanelRow>
      ))}
    </Panel>
  )
}

// ── Tags panel ──────────────────────────────────────────────────────────────

const TAGS_PREVIEW = [
  { name: 'financial-data',  count: 142 },
  { name: 'pii-sensitive',   count: 89  },
  { name: 'api-gateway',     count: 67  },
  { name: 'real-time',       count: 43  },
  { name: 'deprecated',      count: 12  },
  { name: 'gdpr-scoped',     count: 8   },
]

function TagsPanel() {
  return (
    <Panel title="Tags" Icon={Tag} meta={`${TAGS_PREVIEW.length} shown · 38 total`}>
      {TAGS_PREVIEW.map((tag) => (
        <PanelRow key={tag.name}>
          <span className="w-1.5 h-1.5 rounded-full bg-ribbon shrink-0" aria-hidden="true" />
          <span className="text-ink-muted flex-1 font-mono text-[11px] truncate">{tag.name}</span>
          <span className="text-ink-faint tabular-nums text-[11px]">{tag.count}</span>
        </PanelRow>
      ))}
    </Panel>
  )
}

// ── Users panel ─────────────────────────────────────────────────────────────

const USERS_PREVIEW = [
  { initials: 'AR', name: 'A. Rahman',   role: 'Admin'   },
  { initials: 'SC', name: 'S. Chen',     role: 'Editor'  },
  { initials: 'PK', name: 'P. Kumar',   role: 'Editor'  },
  { initials: 'LM', name: 'L. Müller',  role: 'Viewer'  },
  { initials: 'JO', name: 'J. Okafor',  role: 'Auditor' },
]

function UsersPanel() {
  return (
    <Panel title="Users" Icon={Users} meta="24 provisioned">
      {USERS_PREVIEW.map((user) => (
        <PanelRow key={user.name}>
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-primary-700 leading-none">{user.initials}</span>
          </div>
          <span className="text-ink flex-1 truncate">{user.name}</span>
          <span className="text-ink-faint text-[11px] shrink-0">{user.role}</span>
        </PanelRow>
      ))}
    </Panel>
  )
}

// ── Roles panel ─────────────────────────────────────────────────────────────

const ROLES_PREVIEW = [
  { role: 'Admin',   scope: 'Full access — all modules',    users: 3  },
  { role: 'Editor',  scope: 'Read + Write — owned domains', users: 9  },
  { role: 'Viewer',  scope: 'Read only — assigned catalog',  users: 11 },
  { role: 'Auditor', scope: 'Read + Audit log access',       users: 2  },
]

function RolesPanel() {
  return (
    <Panel title="Roles" Icon={Shield} meta={`${ROLES_PREVIEW.length} defined`}>
      {ROLES_PREVIEW.map((item) => (
        <PanelRow key={item.role}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" aria-hidden="true" />
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <span className="text-ink font-medium leading-none">{item.role}</span>
            <span className="text-[10px] text-ink-faint truncate leading-none">{item.scope}</span>
          </div>
          <span className="text-ink-faint text-[11px] shrink-0">{item.users}u</span>
        </PanelRow>
      ))}
    </Panel>
  )
}

// ── Permissions panel ───────────────────────────────────────────────────────

type AccessLevel = 'full' | 'write' | 'read' | 'none'

const ACCESS_DOT: Record<AccessLevel, string> = {
  full:  'bg-success',
  write: 'bg-primary-400',
  read:  'bg-ribbon',
  none:  'bg-border-strong',
}
const ACCESS_LABEL: Record<AccessLevel, string> = {
  full:  'Full',
  write: 'Write',
  read:  'Read',
  none:  '—',
}

const PERMISSIONS_MATRIX: {
  role: string
  catalog: AccessLevel
  build: AccessLevel
  admin: AccessLevel
}[] = [
  { role: 'Admin',   catalog: 'full',  build: 'full',  admin: 'full'  },
  { role: 'Editor',  catalog: 'write', build: 'write', admin: 'none'  },
  { role: 'Viewer',  catalog: 'read',  build: 'none',  admin: 'none'  },
  { role: 'Auditor', catalog: 'read',  build: 'none',  admin: 'read'  },
]

function PermissionsPanel() {
  return (
    <Panel title="Permissions" Icon={Lock} meta="role × module">
      {/* Column headers */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border text-[10px] font-semibold tracking-wide uppercase text-ink-faint bg-surface-subtle">
        <span className="flex-1">Role</span>
        <span className="w-12 text-center">Catalog</span>
        <span className="w-12 text-center">Build</span>
        <span className="w-12 text-center">Admin</span>
      </div>

      {PERMISSIONS_MATRIX.map((row) => (
        <PanelRow key={row.role}>
          <span className="text-ink flex-1">{row.role}</span>
          {(['catalog', 'build', 'admin'] as const).map((col) => {
            const level = row[col]
            return (
              <div key={col} className="w-12 flex items-center justify-center gap-1" title={ACCESS_LABEL[level]}>
                <span className={clsx('w-2 h-2 rounded-full shrink-0', ACCESS_DOT[level])} aria-hidden="true" />
                <span className="text-[10px] text-ink-faint">{ACCESS_LABEL[level]}</span>
              </div>
            )
          })}
        </PanelRow>
      ))}
    </Panel>
  )
}

// ── AdminPreviewSection ─────────────────────────────────────────────────────

export default function AdminPreviewSection() {
  return (
    <section
      className="bg-surface-raised border-b border-border px-8 py-12"
      aria-labelledby="admin-preview-heading"
    >
      <SectionHeader
        id="admin-preview-heading"
        eyebrow="Admin Module · Preview"
        title="Central Governance Controls"
        subtitle="Taxonomy, metadata, access control, and permissions — managed from a single governance plane."
        action={
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Go to Admin
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        }
      />

      {/* Panel grid — 3-col on lg, 2-col on sm */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <TaxonomyPanel />
        <MetadataSchemaPanel />
        <TagsPanel />
        <UsersPanel />
        <RolesPanel />
        <PermissionsPanel />
      </div>
    </section>
  )
}
