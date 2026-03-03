# Schema: `identity`

> **Owner:** Shared / Platform
> **Purpose:** Central store for users, roles, permissions, and scope bindings. This schema is the single source of truth for authentication identity and authorisation rules across all SigAI modules.

---

## Design Notes

- Access control is **role-based**, not NFR-based. A user's ability to see or act on an asset is derived from their roles and scope bindings — not from fields like `data_classification` or `contains_pii`.
- **Global roles** (`user_roles`) assign a role platform-wide.
- **Scoped roles** (`user_scope_bindings`) assign a role within a boundary such as a specific country, OpCo, or module. Scoped assignments are additive on top of global assignments.
- `permissions` define the lowest-level capabilities. Roles aggregate permissions. Users get permissions via roles.
- `expires_at` on both `user_roles` and `user_scope_bindings` supports time-bounded access grants (e.g. contractor access, temporary escalation).

---

## Tables

### `identity.users`

Represents an authenticated person in the platform. Identity is managed externally (SSO/IdP); this table is the platform's local projection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Surrogate key |
| `email` | VARCHAR(320) | NOT NULL, UNIQUE | Canonical identity from IdP |
| `display_name` | VARCHAR(200) | NOT NULL | Full name for display |
| `given_name` | VARCHAR(100) | | First name |
| `family_name` | VARCHAR(100) | | Last name |
| `status` | ENUM | NOT NULL, DEFAULT `active` | `active` \| `suspended` \| `deprovisioned` |
| `last_login_at` | TIMESTAMPTZ | | Last successful authentication |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `email`

---

### `identity.roles`

Named collections of permissions. A role describes a functional capability set (e.g. `catalog_editor`, `governance_reviewer`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Machine-readable key, e.g. `platform_admin` |
| `display_name` | VARCHAR(200) | NOT NULL | Human-readable label |
| `description` | TEXT | | What this role can do |
| `scope_type` | ENUM | NOT NULL | `global` \| `module` \| `country` \| `opco` \| `function_group` — the kinds of scope this role is meaningful within |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Seed roles (examples):**

| name | scope_type | Description |
|------|-----------|-------------|
| `platform_admin` | `global` | Full platform administration |
| `catalog_viewer` | `global` | Read-only access to published catalog |
| `catalog_editor` | `module` | Can edit catalog metadata |
| `catalog_publisher` | `module` | Can promote assets to GA |
| `governance_reviewer` | `global` | Can review and approve submissions |
| `governance_certifier` | `global` | Can issue certifications |
| `module_contributor` | `module` | Can submit assets from a source module |
| `org_data_steward` | `opco` | Data steward scoped to an OpCo |

---

### `identity.permissions`

Atomic capability codes. These are defined by the platform and modules, not user-configurable.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | VARCHAR(200) | NOT NULL, UNIQUE | Dotted resource:action format, e.g. `catalog:asset:read` |
| `description` | TEXT | | What this permission allows |
| `resource_type` | VARCHAR(100) | NOT NULL | e.g. `catalog.asset`, `governance.submission` |
| `action` | VARCHAR(50) | NOT NULL | e.g. `read`, `write`, `submit`, `review`, `approve`, `publish`, `admin` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Example permission codes:**

| code | resource_type | action |
|------|---------------|--------|
| `catalog:asset:read` | `catalog.asset` | `read` |
| `catalog:asset:write` | `catalog.asset` | `write` |
| `catalog:asset:publish` | `catalog.asset` | `publish` |
| `governance:submission:read` | `governance.submission` | `read` |
| `governance:submission:review` | `governance.submission` | `review` |
| `governance:submission:approve` | `governance.submission` | `approve` |
| `governance:certification:write` | `governance.certification` | `write` |
| `platform:module:admin` | `platform.module` | `admin` |

---

### `identity.role_permissions`

Junction table binding permissions to roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `role_id` | UUID | FK → `identity.roles.id` | |
| `permission_id` | UUID | FK → `identity.permissions.id` | |

**Primary key:** `(role_id, permission_id)`

---

### `identity.user_roles`

Global (unscoped) role assignments for a user. A user assigned `catalog_viewer` here has that role across the entire platform.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, FK → `identity.users.id` | |
| `role_id` | UUID | NOT NULL, FK → `identity.roles.id` | |
| `granted_by` | UUID | FK → `identity.users.id` | Who assigned this role |
| `granted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `expires_at` | TIMESTAMPTZ | | NULL = permanent; set for time-bounded grants |
| `notes` | TEXT | | Reason for grant, ticket reference, etc. |

**Unique constraint:** `(user_id, role_id)`

---

### `identity.user_scope_bindings`

Scoped role assignments. Binds a user to a role within a specific organisational or module boundary. Additive on top of global `user_roles`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, FK → `identity.users.id` | |
| `role_id` | UUID | NOT NULL, FK → `identity.roles.id` | |
| `scope_type` | ENUM | NOT NULL | `module` \| `country` \| `opco` \| `function_group` |
| `scope_ref_id` | UUID | NOT NULL | FK to the scoping entity: `platform.modules.id`, `org.countries.id`, `org.opcos.id`, or `org.function_groups.id` depending on `scope_type` |
| `granted_by` | UUID | FK → `identity.users.id` | |
| `granted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `expires_at` | TIMESTAMPTZ | | NULL = permanent |
| `notes` | TEXT | | |

**Unique constraint:** `(user_id, role_id, scope_type, scope_ref_id)`

**Example:** User Alice has `org_data_steward` scoped to OpCo "APAC-Banking":
```
user_id     = Alice's UUID
role_id     = org_data_steward role UUID
scope_type  = 'opco'
scope_ref_id = APAC-Banking opco UUID
```

---

## Key Relationships

```
users ──< user_roles >── roles ──< role_permissions >── permissions
users ──< user_scope_bindings >── roles
user_scope_bindings.scope_ref_id → (platform.modules | org.countries | org.opcos | org.function_groups)
```

- A user can have multiple global roles.
- A user can have the same role scoped to multiple different org units.
- `user_scope_bindings.scope_ref_id` is a polymorphic FK; the target table is determined by `scope_type`. This is intentionally left as a soft reference at the DB level; application layer enforces the target.

---

## What is Shared vs Module-Owned

| Concern | Owner |
|---------|-------|
| User records | `identity` — shared |
| Role definitions | `identity` — shared (modules may register their own roles at setup) |
| Permission codes | `identity` — shared (modules contribute their own codes) |
| Role assignments | `identity` — shared |
| Scope bindings | `identity` — shared |
| Session / token management | External IdP / auth service — not in this schema |
