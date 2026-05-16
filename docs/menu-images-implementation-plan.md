## Menu Images Implementation Plan (Medusa v2, ChefV)

### Defaults and Scope

- Multiple images per menu
- Ordering persisted via rank; drag-and-drop in Admin UI
- API payload uses images: string[] and optional thumbnail?: string | null
- Update replaces entire image set (idempotent by order)
- Admin and Store GETs return images (and thumbnail) by default
- Store File Module file_id in metadata for clean deletions
- Immediate upload on selection in Admin; immediate delete on remove in UI
- Auto-thumbnail set to first image if not explicitly provided

### Directory Map (key files)

- Backend (module)
  - `apps/medusa/src/modules/menu/models/menu.ts`
  - `apps/medusa/src/modules/menu/models/menu-image.ts` (new)
  - `apps/medusa/src/modules/menu/service.ts`
  - `apps/medusa/src/modules/menu/migrations/MigrationYYYYMMDDHHMMSS_add_menu_images.ts` (new)
  - `apps/medusa/src/modules/menu/migrations/MigrationYYYYMMDDHHMMSS_add_menu_thumbnail.ts` (new)
- Backend (API)
  - `apps/medusa/src/api/admin/menus/route.ts`
  - `apps/medusa/src/api/admin/menus/[id]/route.ts` (add if needed)
  - `apps/medusa/src/api/store/menus/route.ts`
  - `apps/medusa/src/api/store/menus/[id]/route.ts` (ensure includes images)
- SDK/Types
  - `apps/medusa/src/sdk/admin/admin-menus.ts`
  - `apps/medusa/src/sdk/store/store-menus.ts`
- Admin UI
  - `apps/medusa/src/admin/routes/menus/components/menu-media/MenuMedia.tsx` (new)
  - Wire into `apps/medusa/src/admin/routes/menus/page.tsx` and edit pages
  - Hooks: `apps/medusa/src/admin/hooks/menus.ts`

### 1) Data Models and Migrations

#### 1.1 MenuImage model

Add a new model `menu_image` with snake_case columns and soft deletes.

```ts
// apps/medusa/src/modules/menu/models/menu-image.ts
import { model } from "@medusajs/framework/utils"
import { Menu } from "./menu"

export const MenuImage = model.define("menu_image", {
  id: model.id().primaryKey(),
  menu_id: model.text(),
  url: model.text(),
  rank: model.number().default(0),
  metadata: model.json().nullable(),
  menu: model.belongsTo(() => Menu),
}).indexes([
  { on: ["menu_id"] },
])
```

Extend `Menu` to include a one-to-many relation and optional `thumbnail`:

```ts
// apps/medusa/src/modules/menu/models/menu.ts
import { model } from "@medusajs/framework/utils"
import { Course } from "./course"
import { MenuImage } from "./menu-image"

export const Menu = model.define("menu", {
  name: model.text(),
  id: model.id().primaryKey(),
  courses: model.hasMany(() => Course),
  images: model.hasMany(() => MenuImage),
  thumbnail: model.text().nullable(),
}).cascades({
  delete: ["courses", "images"],
})
```

#### 1.2 Migrations (Mikro-ORM)

Create `menu_image` table and add `thumbnail` to `menu`.

```ts
// apps/medusa/src/modules/menu/migrations/MigrationYYYYMMDDHHMMSS_add_menu_images.ts
import { Migration } from '@mikro-orm/migrations'

export class MigrationYYYYMMDDHHMMSS_add_menu_images extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "menu_image" (
      "id" text not null,
      "menu_id" text not null,
      "url" text not null,
      "rank" int not null default 0,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "menu_image_pkey" primary key ("id")
    );`)

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_menu_image_menu_id" ON "menu_image" (menu_id) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_menu_image_deleted_at" ON "menu_image" (deleted_at) WHERE deleted_at IS NULL;`)

    this.addSql(`alter table if exists "menu_image" add constraint "menu_image_menu_id_foreign" foreign key ("menu_id") references "menu" ("id") on update cascade on delete cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "menu_image" cascade;`)
  }
}
```

```ts
// apps/medusa/src/modules/menu/migrations/MigrationYYYYMMDDHHMMSS_add_menu_thumbnail.ts
import { Migration } from '@mikro-orm/migrations'

export class MigrationYYYYMMDDHHMMSS_add_menu_thumbnail extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "menu" add column if not exists "thumbnail" text null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "menu" drop column if exists "thumbnail";`)
  }
}
```

Notes
- Keep snake_case, add partial indexes as above, and rely on FK cascade.
- If enforcing a custom ID prefix is desired, we can add it later; `model.id()` is sufficient.

### 2) Service Layer Integration

`apps/medusa/src/modules/menu/service.ts`

- Keep generated CRUD via `MedusaService` for `Menu`, `Course`, `Dish`, `Ingredient`, and register `MenuImage` as well.
- Add custom methods for image set replacement and single-image deletion.

Proposed signatures:

```ts
async replaceMenuImages(
  menuId: string,
  urls: string[],
  opts?: { thumbnail?: string | null; fileMap?: Record<string, string | undefined> }
): Promise<void>

async deleteMenuImage(menuId: string, imageId: string): Promise<void>
```

Behavior
- replaceMenuImages
  - Load existing `menu_image` rows for `menuId`.
  - Compute removed vs next set (full replace is acceptable and simpler).
  - Delete removed rows.
  - Create new rows with `rank = index`, `url`, `menu_id`, and set `metadata.file_id = fileMap[url]` when provided.
  - If `opts.thumbnail` provided, set it; else set to first image url or `null` if empty.
- deleteMenuImage
  - Validate ownership (`image.menu_id === menuId`).
  - If `metadata.file_id` exists, resolve File Module and `deleteFiles([file_id])`.
  - Soft delete the row.
- Menu deletion
  - Prior to deletion, fetch images, call `deleteFiles` for those with `file_id`, then delete menu (FK cascade removes rows).

Transactions
- Wrap replace operations in a single atomic transaction to keep images and thumbnail consistent.

File Module
- We do not upload binaries in the menu service (two-step flow). We only delete storage objects when removing images or deleting a menu.

### 3) Admin API

`apps/medusa/src/api/admin/menus/route.ts`

Schemas (Zod):

```ts
const imageUrlsSchema = z.array(z.string().url()).optional().default([])
const imageFilesSchema = z.array(z.object({
  url: z.string().url(),
  file_id: z.string().optional(),
})).optional()

const createMenuSchema = z.object({
  name: z.string().min(1, "Menu name is required"),
  courses: z.array(/* existing course schema */).optional().default([]),
  images: imageUrlsSchema,
  thumbnail: z.string().url().nullable().optional(),
  image_files: imageFilesSchema,
})
```

Handlers
- GET /admin/menus
  - Use `listAndCountMenus` with `relations: ["courses", "images"]`.
  - Return `{ menus, count, offset, limit }` with `images` and `thumbnail` per menu.
- POST /admin/menus
  - Validate body via `createMenuSchema`.
  - Run existing `createMenuWorkflow` to create base `menu`.
  - After creation, call `replaceMenuImages(menu.id, images, { thumbnail, fileMap })`, where `fileMap` is built from `image_files` by url.
  - Return created menu including `images` and `thumbnail`.

`apps/medusa/src/api/admin/menus/[id]/route.ts` (add if needed)
- GET: retrieve one menu including `images` and `thumbnail`.
- POST: update menu fields; if `images` provided, call `replaceMenuImages` with ordering and `thumbnail`.
- DELETE (optional single-image endpoint): `DELETE /admin/menus/:id/images/:imageId` invokes `deleteMenuImage`.

Response shape
- `images: Array<{ id: string; url: string; rank: number; created_at: string; updated_at: string }>`
- `thumbnail?: string | null`

### 4) Store API

`apps/medusa/src/api/store/menus/route.ts`
- Add `"images"` to relations: `relations: ["courses", "courses.dishes", "courses.dishes.ingredients", "images"]`.
- Include `thumbnail` in the JSON response.
- Keep existing cache headers (public, 30 minutes) as already implemented.

`apps/medusa/src/api/store/menus/[id]/route.ts`
- Ensure it returns `images` ordered by `rank` and `thumbnail`.

### 5) SDK and Types

`apps/medusa/src/sdk/admin/admin-menus.ts`

```ts
export interface AdminMenuImageDTO {
  id: string
  url: string
  rank: number
  created_at: string
  updated_at: string
}

export interface AdminMenuDTO {
  id: string
  name: string
  courses: AdminCourseDTO[]
  images: AdminMenuImageDTO[]
  thumbnail?: string | null
  created_at: string
  updated_at: string
}

export interface AdminCreateMenuDTO {
  name: string
  courses?: Array<{
    name: string
    dishes: Array<{
      name: string
      description?: string
      ingredients: Array<{ name: string; optional?: boolean }>
    }>
  }>
  images?: string[]
  thumbnail?: string | null
  image_files?: { url: string; file_id?: string }[]
}

export interface AdminUpdateMenuDTO {
  name?: string
  courses?: Array<{
    id?: string
    name: string
    dishes: Array<{
      id?: string
      name: string
      description?: string
      ingredients: Array<{ id?: string; name: string; optional?: boolean }>
    }>
  }>
  images?: string[]
  thumbnail?: string | null
  image_files?: { url: string; file_id?: string }[]
}
```

`apps/medusa/src/sdk/store/store-menus.ts`

```ts
export interface StoreMenuImageDTO { id: string; url: string; rank: number }

export interface StoreMenuDTO {
  id: string
  name: string
  courses: StoreCourseDTO[]
  images: StoreMenuImageDTO[]
  thumbnail?: string | null
  created_at: string
  updated_at: string
}
```

No new SDK methods are necessary with the two-step upload flow. If you add a specific image-delete endpoint, consider a helper like `deleteImage(menuId, imageId)`.

### 6) Workflows

`apps/medusa/src/workflows/create-menu.ts`
- Extend input type to include `images?: string[]`, `thumbnail?: string | null`, `image_files?: { url: string; file_id?: string }[]`.
- After the base menu is created, add a step to call `replaceMenuImages(menu.id, images, { thumbnail, fileMap })`.
- Return the final menu including `images` and `thumbnail`.

If an update workflow exists, mirror the same steps there. For delete workflows, include a step to delete storage files for any images with `metadata.file_id` before removing the menu.

### 7) Admin UI Implementation

Component
- `apps/medusa/src/admin/routes/menus/components/menu-media/MenuMedia.tsx` (new)
  - Multi-file upload input + drag-and-drop area
  - Previews for images
  - Drag-and-drop reordering to set display order (rank)
  - “Set as cover” action to set `thumbnail` (or derive from first item)
  - Remove image button per item

Upload behavior
- Use Admin Uploads API via SDK:
  - On selection, immediately upload: `sdk.admin.upload.create({ files: [file] })`
  - Grab `{ url, id }` (id is `file_id`) and push into local state as `{ url, file_id }`
  - Show progress and error feedback
- On removing an uploaded-but-unsaved image, immediately call `sdk.admin.upload.delete(file_id)` and remove from state to prevent orphans.

Submit behavior
- On create/update page submit:
  - Build ordered `images: string[]` from the current list
  - Build `image_files: { url, file_id }[]` from local state
  - Include `thumbnail?: string | null`
  - Call `sdk.admin.menus.create` or `sdk.admin.menus.update`
  - Invalidate queries using `useQueryClient` in `apps/medusa/src/admin/hooks/menus.ts`

Accessibility & UX
- Keyboard-friendly reorder controls and labels
- Client-side file type/size validation with clear errors
- “Cover” badge in the list for the current thumbnail

### 8) Deletion Semantics

Single image removal (saved menus)
- Preferred: send an update with the filtered `images` array (full replace). Backend detects removed rows and deletes storage objects for any with `metadata.file_id`.
- Optional: dedicated endpoint `DELETE /admin/menus/:id/images/:imageId` calling `deleteMenuImage`.

Menu deletion
- Fetch images; for each with `metadata.file_id`, call File Module `deleteFiles([file_id])`.
- Delete the menu (FK cascade removes `menu_image` rows).

Missing file_id
- If some URLs lack `file_id` (e.g., legacy), skip storage deletion. The admin upload flow minimizes this by deleting uploads immediately for removed pre-save items.

### 9) Validation and Error Handling

Admin Zod validation
- `images` and `thumbnail` must be valid absolute URLs.
- `image_files` mapping is optional; ignore unknown URLs; log mismatches.

Service errors
- 404 for missing menu/image, 400 for bad inputs, 500 for unexpected.
- Transactional guarantees on replace to avoid partial updates.

API errors
- Use structured JSON with `message` and optional `errors`.

### 10) Performance and Indexing

- Use partial indexes on `deleted_at` for all tables.
- Index `menu_image.menu_id` and consider composite `(menu_id, rank)` for ordered retrieval.
- Admin/store listing supports `limit/offset`; keep existing pagination structure.

### 11) Testing Plan

Integration (Admin)
- Create with images: verify count, rank ordering, thumbnail default.
- Update with replacement set: verify old images removed, new ranks applied, thumbnail updated.
- Delete single image: row removed and `deleteFiles` invoked when `file_id` exists (mock File Module).
- Delete menu: `deleteFiles` invoked for each image with `file_id` and rows removed by cascade.

Integration (Store)
- GET /store/menus: images ordered by `rank`, includes `thumbnail`.

UI tests
- Upload success path: previews render, URL and `file_id` captured.
- Remove pre-save: calls upload delete, state updated.
- Reorder reflects in submit payload ordering.
- Set cover toggles the expected thumbnail value.

### 12) Operations and Configuration

- Development uses Local File Provider (uploads folder). Backend must serve uploaded files.
- Production can switch to S3 provider via File Module configuration; no code changes required.
- Document recommended image size and file type constraints; enforce on client.

### 13) Rollout Checklist

1) Add `menu-image.ts` model and extend `menu.ts` with `images` and `thumbnail`.
2) Create and run migrations for `menu_image` and `menu.thumbnail`.
3) Register `MenuImage` in the module service context if needed.
4) Implement service helpers: `replaceMenuImages`, `deleteMenuImage` (+ File Module delete).
5) Update Admin routes:
   - Extend schemas to accept `images`, `thumbnail`, `image_files`.
   - Include `images` in relations on GET/list.
   - Replace images on create/update.
6) Update Store routes to include `images` and `thumbnail`.
7) Update SDK DTOs for Admin and Store to include `images` and `thumbnail`.
8) Implement `MenuMedia.tsx` with upload, reorder, remove, and cover selection.
9) Add tests (admin/store integration + UI where applicable).
10) Verify end-to-end manually:
    - Upload → attach → reorder → set cover → save → fetch → delete image → delete menu.

### Progress Checkpoints

- Models & Migrations
  - [ ] Create `apps/medusa/src/modules/menu/models/menu-image.ts`
  - [ ] Update `apps/medusa/src/modules/menu/models/menu.ts` with `images` and `thumbnail`
  - [ ] Add migration `MigrationYYYYMMDDHHMMSS_add_menu_images` (created and committed)
  - [ ] Add migration `MigrationYYYYMMDDHHMMSS_add_menu_thumbnail` (created and committed)
  - [ ] Run migrations locally (DB updated)

- Service Layer
  - [ ] Register `MenuImage` in service factory context (if needed)
  - [ ] Implement `replaceMenuImages(menuId, urls, { thumbnail, fileMap })`
  - [ ] Implement `deleteMenuImage(menuId, imageId)` with File Module deletion
  - [ ] Ensure operations are transactional

- Admin API
  - [ ] Extend Zod schema to accept `images`, `thumbnail`, `image_files`
  - [ ] GET /admin/menus includes `images` relation and `thumbnail`
  - [ ] POST /admin/menus attaches images and sets `thumbnail`
  - [ ] /admin/menus/:id GET/POST implemented for retrieve/update with images
  - [ ] (Optional) DELETE /admin/menus/:id/images/:imageId implemented

- Store API
  - [ ] GET /store/menus includes `images` and `thumbnail`
  - [ ] GET /store/menus/:id returns `images` ordered by `rank` and `thumbnail`

- SDK & Hooks
  - [ ] Update Admin DTOs to include `images` and `thumbnail`
  - [ ] Update Store DTOs to include `images` and `thumbnail`
  - [ ] Adjust admin hooks payload types for `images`, `thumbnail`, `image_files`

- Admin UI
  - [ ] Create `MenuMedia.tsx` with multi-upload and previews
  - [ ] Upload on select using `sdk.admin.upload.create`
  - [ ] Immediate delete on remove using upload delete API
  - [ ] Drag-and-drop reordering reflected in payload order
  - [ ] “Set as cover” toggles `thumbnail`
  - [ ] Wire into create/edit menu forms and submission

- Deletion Semantics
  - [ ] File Module deletes called on image removal when `file_id` exists
  - [ ] Menu deletion cleans up files for all attached images with `file_id`

- Testing
  - [ ] Admin integration: create, update (replace), delete image, delete menu
  - [ ] Store integration: lists/gets include images and thumbnail in order
  - [ ] UI: upload, remove pre-save, reorder, set cover

- Operations
  - [ ] Developer docs updated (image size/type guidance)
  - [ ] Production storage provider configured (e.g., S3) if applicable

- Tracking
  - Implementation owner(s): ______________________
  - Start date: __________  Target completion: __________
  - Related PRs:
    - [ ] Admin/Module: PR #____ — models, migrations, service
    - [ ] Admin API: PR #____ — routes and schemas
    - [ ] Store API: PR #____ — routes
    - [ ] SDK/Types: PR #____ — DTO updates
    - [ ] Admin UI: PR #____ — Menu media component and wiring
  - Deployments:
    - [ ] Dev
    - [ ] Staging
    - [ ] Production

---

This plan follows Medusa v2 patterns (modules, DML models, service factory, Admin/Store routes, and File Module integration), uses snake_case DB naming, and aligns with the current codebase structure in `apps/medusa` and the custom Admin UI.

