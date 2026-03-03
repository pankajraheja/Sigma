# DDL Spec: `identity` Schema

> **Status:** DDL-ready design — not yet a runnable migration script.
> **DB target:** PostgreSQL 15+
> **Owner:** Shared / Platform

---

## Design Principles

- Identity is the single source of truth for all users, roles, and access control across SigAI.
- Authentication is handled externally (IdP / SSO). This schema is the platform's local projection of authenticated identity.
- Access control is **role-based**, not NFR-based. A user's ability to see or act on an asset comes from their roles and scope bindings — never from NFR fields like `data_classification` or `contains_pii`.
- `user_roles` assigns roles globally (platform-wide).
- `user_scope_bindings` assigns roles within a specific organisational or module boundary. These are additive to global roles.
- `role_permissions` is the bridge between roles and atomic capabilities.

---

## Tables

### `identity.users`

**Purpose:** Platform's local user record. Created or updated on first authenticated login from the IdP. Identity attributes (name, email) are sourced from the IdP; do not treat this table as the primary identity store.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | Surrogate key |
| `idp_subject` | `VARCHAR(500)` | YES | NULL | UNIQUE | External IdP subject identifier (e.g. Okta user ID, Azure OID) |
| `email` | `VARCHAR(320)` | NO | — | UNIQUE | Canonical email from IdP; RFC 5321 max length |
| `display_name` | `VARCHAR(200)` | NO | — | — | Full name for display |
| `given_name` | `VARCHAR(100)` | YES | NULL | — | First / given name |
| `family_name` | `VARCHAR(100)` | YES | NULL | — | Last / family name |
| `status` | `VARCHAR(20)` | NO | `'active'` | CHECK (see values) | `active` \| `suspended` \| `deprovisioned` |
| `last_login_at` | `TIMESTAMPTZ` | YES | NULL | — | Last successful authentication timestamp |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Unique Constraints:**
- `email`
- `idp_subject` (when not NULL)

**Check Constraints:**
- `status IN ('active', 'suspended', 'deprovisioned')`

**Recommended Indexes:**
- `(email)` — covered by unique constraint; primary lookup key
- `(idp_subject)` — covered by unique constraint; used during IdP callback
- `(status)` — filter active users in admin views

**Notes:** `idp_subject` may be NULL for system/service accounts created directly in the platform. For human users, it should always be populated after first login. `email` should be treated as case-insensitive; consider storing as `lower(email)` or using a case-insensitive collation.

---

### `identity.roles`

**Purpose:** Named collections of permissions representing functional capability sets. Roles are defined by platform or module administrators, not end users. A role's `scope_type` indicates what kind of scope it is meaningful within (e.g. `org_data_steward` only makes sense scoped to an OpCo or country).

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `name` | `VARCHAR(100)` | NO | — | UNIQUE | Machine-readable key, e.g. `platform_admin`, `catalog_editor`, `governance_reviewer` |
| `display_name` | `VARCHAR(200)` | NO | — | — | Human-readable label |
| `description` | `TEXT` | YES | NULL | — | What this role allows |
| `scope_type` | `VARCHAR(20)` | NO | — | CHECK (see values) | `global` \| `module` \| `country` \| `opco` \| `function_group` — the type of scope this role is meaningful within |
| `is_system` | `BOOLEAN` | NO | `false` | — | If true, this role is built-in and cannot be deleted or renamed |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Unique Constraints:**
- `name`

**Check Constraints:**
- `scope_type IN ('global', 'module', 'country', 'opco', 'function_group')`

**Recommended Indexes:**
- `(scope_type)` — for filtering roles by their applicable scope type

**Seed roles:**

| name | scope_type | is_system | Description |
|------|-----------|-----------|-------------|
| `platform_admin` | `global` | true | Full platform administration |
| `catalog_viewer` | `global` | true | Read-only access to published catalog |
| `catalog_editor` | `module` | true | Edit catalog metadata |
| `catalog_publisher` | `module` | true | Promote catalog assets |
| `governance_reviewer` | `global` | true | Review and vote on submissions |
| `governance_certifier` | `global` | true | Issue certifications |
| `module_contributor` | `module` | true | Submit assets from a source module |
| `org_data_steward` | `opco` | false | Data steward scoped to an OpCo |

---

### `identity.permissions`

**Purpose:** Atomic capability codes. Defined by the platform and individual modules during setup. Not user-configurable. Each permission represents the finest-grained action on a specific resource type.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `code` | `VARCHAR(200)` | NO | — | UNIQUE | Dotted resource:action code, e.g. `catalog:asset:read`, `governance:submission:approve` |
| `resource_type` | `VARCHAR(100)` | NO | — | — | Target resource, e.g. `catalog.asset`, `governance.submission` |
| `action` | `VARCHAR(50)` | NO | — | CHECK (see values) | `read` \| `write` \| `submit` \| `review` \| `approve` \| `publish` \| `admin` \| `certify` \| `delete` |
| `description` | `TEXT` | YES | NULL | — | What this permission allows in plain language |
| `module_id` | `UUID` | YES | NULL | FK → `platform.modules(id)` ON DELETE CASCADE | Owning module (NULL = platform-level permission) |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `module_id` → `platform.modules(id)` ON DELETE CASCADE

**Unique Constraints:**
- `code`

**Check Constraints:**
- `action IN ('read', 'write', 'submit', 'review', 'approve', 'publish', 'admin', 'certify', 'delete')`

**Recommended Indexes:**
- `(resource_type)` — permissions grouped by resource
- `(module_id)` — module-owned permissions

**Example permission codes:**

| code | resource_type | action |
|------|---------------|--------|
| `catalog:asset:read` | `catalog.asset` | `read` |
| `catalog:asset:write` | `catalog.asset` | `write` |
| `catalog:asset:publish` | `catalog.asset` | `publish` |
| `catalog:asset:delete` | `catalog.asset` | `delete` |
| `governance:submission:read` | `governance.submission` | `read` |
| `governance:submission:submit` | `governance.submission` | `submit` |
| `governance:submission:review` | `governance.submission` | `review` |
| `governance:submission:approve` | `governance.submission` | `approve` |
| `governance:certification:certify` | `governance.certification` | `certify` |
| `platform:module:admin` | `platform.module` | `admin` |

---

### `identity.role_permissions`

**Purpose:** Junction table binding atomic permissions to roles. Many-to-many. Determines what a role holder can do.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `role_id` | `UUID` | NO | — | PK (composite), FK → `identity.roles(id)` ON DELETE CASCADE | |
| `permission_id` | `UUID` | NO | — | PK (composite), FK → `identity.permissions(id)` ON DELETE CASCADE | |
| `granted_at` | `TIMESTAMPTZ` | NO | `now()` | — | When this permission was added to the role |
| `granted_by` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | Admin who assigned the permission to the role |

**Primary Key:** `(role_id, permission_id)`

**Foreign Keys:**
- `role_id` → `identity.roles(id)` ON DELETE CASCADE
- `permission_id` → `identity.permissions(id)` ON DELETE CASCADE
- `granted_by` → `identity.users(id)` ON DELETE SET NULL

**Recommended Indexes:**
- `(permission_id)` — reverse lookup: all roles that carry a given permission

---

### `identity.user_roles`

**Purpose:** Global (unscoped) role assignments for a user. A user assigned `catalog_viewer` here has that role across the entire platform. Supports time-bounded grants via `expires_at`.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `user_id` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE CASCADE | |
| `role_id` | `UUID` | NO | — | FK → `identity.roles(id)` ON DELETE RESTRICT | |
| `granted_by` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | Admin who granted this role |
| `granted_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `expires_at` | `TIMESTAMPTZ` | YES | NULL | — | NULL = permanent; set for time-bounded grants (contractor access, temp escalation) |
| `notes` | `TEXT` | YES | NULL | — | Reason for grant, ticket reference, etc. |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` → `identity.users(id)` ON DELETE CASCADE
- `role_id` → `identity.roles(id)` ON DELETE RESTRICT
- `granted_by` → `identity.users(id)` ON DELETE SET NULL

**Unique Constraints:**
- `(user_id, role_id)` — one global assignment per role per user; for multiple grants over time, revoke the previous or allow the application to handle expiry

**Recommended Indexes:**
- `(user_id)` — user's role list (most common auth query)
- `(expires_at)` — expiry job: find roles expiring soon
- Partial index: `(user_id, role_id) WHERE expires_at IS NULL OR expires_at > now()` — active role assignments

**Notes:** For re-granting after expiry, either extend `expires_at` on the existing row or insert a new row after the previous has expired. Do not allow two active rows for the same `(user_id, role_id)` simultaneously.

---

### `identity.user_scope_bindings`

**Purpose:** Scoped role assignments. Binds a user to a role within a specific organisational or module boundary. Additive on top of global `user_roles`. Example: User Alice has `org_data_steward` scoped to OpCo "APAC-Banking" — she has data steward capabilities only within that OpCo's assets.

| Column | PostgreSQL Type | Nullable | Default | Constraints | Description |
|--------|----------------|----------|---------|-------------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | |
| `user_id` | `UUID` | NO | — | FK → `identity.users(id)` ON DELETE CASCADE | |
| `role_id` | `UUID` | NO | — | FK → `identity.roles(id)` ON DELETE RESTRICT | |
| `scope_type` | `VARCHAR(20)` | NO | — | CHECK (see values) | `module` \| `country` \| `opco` \| `function_group` |
| `scope_ref_id` | `UUID` | NO | — | — | UUID of the scoping entity. Polymorphic soft reference: resolves to `platform.modules.id`, `org.countries.id`, `org.opcos.id`, or `org.function_groups.id` based on `scope_type` |
| `granted_by` | `UUID` | YES | NULL | FK → `identity.users(id)` ON DELETE SET NULL | |
| `granted_at` | `TIMESTAMPTZ` | NO | `now()` | — | |
| `expires_at` | `TIMESTAMPTZ` | YES | NULL | — | NULL = permanent |
| `notes` | `TEXT` | YES | NULL | — | |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` → `identity.users(id)` ON DELETE CASCADE
- `role_id` → `identity.roles(id)` ON DELETE RESTRICT
- `granted_by` → `identity.users(id)` ON DELETE SET NULL

**Unique Constraints:**
- `(user_id, role_id, scope_type, scope_ref_id)` — one scoped assignment per combination

**Check Constraints:**
- `scope_type IN ('module', 'country', 'opco', 'function_group')`

**Recommended Indexes:**
- `(user_id)` — user's scoped roles (auth context assembly)
- `(scope_type, scope_ref_id)` — all users scoped to a given entity (admin view)
- Partial index: `(user_id) WHERE expires_at IS NULL OR expires_at > now()` — active bindings

**Notes:** `scope_ref_id` is a polymorphic reference — no DB-level FK is defined. Application layer must validate that `scope_ref_id` exists in the table implied by `scope_type` before insert. A DB trigger or constraint trigger may be used to enforce this if desired.
