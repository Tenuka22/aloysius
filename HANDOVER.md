# Handover Spec: CMS & Page Integration

This document outlines the changes made to the **aloysius** repository to support comprehensive Content Management System (CMS) capabilities across all major site pages, serving as a guide for the incoming developer/agent.

---

## 🚀 What We Did So Far

We expanded the content management endpoints and editor screens from the initial skeleton (which only supported Homepage and About pages) to cover all other core school pages. This enables site administrators to edit page headers, layout configs, taglines, hero images, and page-specific options without needing code modifications.

### 1. Expanded Page Blocks Configuration (`packages/ui/src/content/cms.ts`)

- Defined CMS structures (`PageBlock` schemas and default values) for:
  - **News**: Title, tagline, landscape hero image, and news feed configurations (recent articles heading, custom items-per-page counts).
  - **Notices**: Title, tagline, landscape hero image, and display configurations (e.g., toggle option to pin urgent/important notices).
  - **Contact**: Hero title/tagline, contact information (physical address, phone, email, and social media URLs), and interactive Google Maps embed URL.
  - **Alumni**: OBA title/tagline, a comprehensive about body-copy editor, main OBA featured image, and fast quick links (OBA portal registration, events calendar).
  - **Media Gallery**: Title, tagline, hero image, and custom gallery settings (items-per-page grid count).
  - **Student Life**: Title, tagline, hero image, and activities section configurations.
- Added `getImageAspectRatio(fieldId)` to map image fields to modern, preset aspect ratio tokens (e.g., `aspectRatios.hero` or `aspectRatios.newsCard`), preventing Layout Shift (CLS) when loading media.

### 2. Upgraded CMS API endpoints (`packages/api/src/routers/cms/index.ts`)

- Created full oRPC schemas and handlers for each new page.
- Implemented core operations for each:
  - `getNews` / `getNewsDraft` / `getNewsHistory` / `updateNews` / `watchNews` / `publishNews`
  - `getNotices` / `getNoticesDraft` / `getNoticesHistory` / `updateNotices` / `watchNotices` / `publishNotices`
  - `getContact` / `getContactDraft` / `getContactHistory` / `updateContact` / `watchContact` / `publishContact`
  - `getAlumni` / `getAlumniDraft` / `getAlumniHistory` / `updateAlumni` / `watchAlumni` / `publishAlumni`
  - `getMedia` / `getMediaDraft` / `getMediaHistory` / `updateMedia` / `watchMedia` / `publishMedia`
  - `getStudents` / `getStudentsDraft` / `getStudentsHistory` / `updateStudents` / `watchStudents` / `publishStudents`

### 3. Developed CMS Route Layout & Editor Screens (`apps/web/src/routes/cms/*`)

- Updated the main CMS Shell navigation in `apps/web/src/routes/cms/route.tsx` to display all **nine (01-09)** page editors beautifully.
- Created dedicated client-side editor routes for each new page:
  - `apps/web/src/routes/cms/news.tsx`
  - `apps/web/src/routes/cms/notices.tsx`
  - `apps/web/src/routes/cms/contact.tsx`
  - `apps/web/src/routes/cms/alumni.tsx`
  - `apps/web/src/routes/cms/media.tsx`
  - `apps/web/src/routes/cms/students.tsx`
- Integrated draft saving, instant revisions history lookup, publishing triggers, and file/media-upload flows with oRPC procedures.

### 4. Dynamic Page Mappers (`packages/ui/src/content/cms-to-pages.ts`)

- Added typed `blocksTo{Page}Props` mappers to map flat JSON block snapshots seamlessly into strongly-typed page React properties.
- Properly handles section-level `hidden` attributes so that entire blocks or headers can be toggled hidden by the user.

### 5. Renderers Integration (`packages/ui/src/components/pages/*` & `apps/web/src/routes/*`)

- Structured clean components under `packages/ui/src/components/pages/` to consume mapped props and render beautiful StyleX interfaces.
- Connected the routes under `apps/web/src/routes/` to call the oRPC queries and render page layouts dynamically.

### 6. Corrected Responsive Media Layouts (`packages/ui/src/components/primitives/media.tsx`)

- Enforced image-aspect ratios on the `<Media />` primitive component to reserve precise containers and prevent page-jumping during load.
- **Fixed a syntax issue**: Resolved an unclosed brace syntax issue on the `Media` component.

---

## 📋 Current Workspace Status

- **Linting & Formatting**: `bun run check` and `bun run fix` run successfully. Formatting check completes on all 37 modified files with StyleX configurations.
- **Tests**:
  - `web:test`, `building:test`, `@aloysius/ui:test`, and `@aloysius/storage:test` pass cleanly.
  - Note: `@aloysius/auth` and `@aloysius/api` have no tests (Vitest exits cleanly or flags no files).
  - Note: `@aloysius/db` has a pre-existing failing test in its index suite (`AssertionError: expected null to be 'user'`), unrelated to the CMS updates.

---

## 🛠️ Next Steps & Recommendations for the Next Agent

1. **Verify End-to-End CMS Browsing**:
   - Start the local SQLite db & infrastructure: `bun run dev`.
   - Access the admin CMS portal at `/cms`.
   - Test draft updates, media uploading, publishing, and revision lookups for each of the new editors (News, Notices, Contact, Alumni, Media, Students).
2. **Review Code Standards Compliance**:
   - Verify that all newly added components use the zero-config **Ultracite** preset standard by running `bun run check`.
3. **Commit the Completed Work**:
   - Review changes with `git status` and `git diff`.
   - Commit files in clean logical chunks (e.g., `feat(api): add CMS page routes`, `feat(ui): implement news/notices/contact/alumni editor pages`, etc.) matching the repository style.
