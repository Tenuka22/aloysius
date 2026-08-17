# Features: St. Aloysius' College Website

A comprehensive modern website for St. Aloysius' College, Galle — a prestigious school founded in 1862. Serving students, parents, faculty, alumni, and the broader community.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TanStack Router/Start, React, Vite, Tailwind CSS |
| Backend | Hono (Cloudflare Workers), oRPC + OpenAPI REST |
| Database | Drizzle ORM + Cloudflare D1 (SQLite) |
| Auth | Clerk (JWT-based, 3-tier roles) |
| Storage | Cloudflare R2 (images, documents) |
| Animation | GSAP + ScrollTrigger |
| Editor | Lexical 0.49 (30+ plugins) + Minimal Tiptap |
| Infrastructure | Alchemy IaC (Cloudflare D1, R2, Workers) |

---

## 1. Public Pages

### Homepage (`/`)
- Hero carousel with auto-play (4s), swipe, keyboard nav, and infinite loop
- Multi-source content aggregation (news, events, student works, achievements, gallery, announcements)
- Stats counters section (Heritage, Alumni, Programs, Achievements)
- Principal's message section with portrait
- Academics department showcase
- Student life section with labeled photo tiles (Sports, Music & Drama, Clubs, Houses, Prefects, Scouts, Faith & Service)
- Quick links section
- Exam results section
- News & events feed
- Achievement wall
- Alumni/OB section with donation tracking
- Gallery masonry preview
- Marquee announcement strip (configurable notice bar with priority levels)
- GSAP scroll-triggered fade-up animations throughout

### About (`/about`)
- School history timeline with GSAP animations
- Founders section
- Principals history
- Mission, Vision & Values
- School anthem rendered as interactive sheet music (VexFlow notation)
- Admin-editable rich-text content sections

### Academics (`/academics`)
- Programs of study listing
- Academic streams
- Exam results table (filterable by grade, year, term)
- Rich-text academic content

### Achievements (`/achievements`)
- Paginated achievement cards with category filtering and search
- Individual achievement pages (`/achievements/$slug`) with full rich-text detail

### Admissions (`/admissions`)
- Admission information, requirements, and process
- Fully admin-editable rich content

### Alumni / Old Boys (`/alumni`, `/ob`)
- Old Boys directory with year-based filtering
- Member profiles with photos and bios
- Committee structure display (Patron, President, Secretary, Treasurer, VPs)
- OB news, announcements, events, and galleries
- Donation tracking with donor recognition
- Membership application form (PDF download)
- Role-based member ordering (President first, Secretary second, etc.)

### Announcements (`/announcements/$slug`)
- Individual announcement detail pages
- Rich text content, author info, date

### Clubs (`/clubs`, `/clubs/$id`)
- Club listing with photos
- Individual club pages with photo albums
- Join/leave membership system
- Album browsing

### Contact (`/contact`)
- School address, phone, email, office hours (admin-configurable)
- Google Maps embed with "View on Map" link
- Mailto-based contact approach (opens visitor's email client)

### News (`/news-events`, `/news/$slug`)
- News listing with search, tag filtering, and pagination
- Individual news articles with rich text, author, comments

### Principals (`/principals/$slug`)
- Individual principal profile pages
- Sticky portrait on desktop (stays visible while scrolling)
- Rich-text message, bio, education & qualifications, tenure

### Student Works (`/student-works/$slug`)
- Student creative works showcase with categories
- Individual work detail pages with descriptions and media

### Exam Results (`/exam-results`)
- Public exam results viewer
- Filterable by grade, year, and term

---

## 2. Site Admin Panel (`/admin`)

All behind `/admin` prefix, guarded by `role === "admin"` in Clerk session metadata.

### Dashboard (`/admin`)
- Admin overview with quick links

### Homepage CMS (`/admin/homepage`)
- **14 configurable sections**, each with its own settings:
  1. **General**: School Name, Motto, Contact Email, Phone, Address
  2. **Notice Strip**: Label, Priority (standard/gold or high/red), linked announcement, text, link URL, link label
  3. **Hero Section**: Eyebrow, Location, Title, Tagline, Scroll Hint, Background Photo (16:9 crop), Primary & Secondary buttons
  4. **Heritage Section**: Eyebrow, Founding Year, Heading, Introduction, Labels, CTA, two Archival Photos (4:3)
  5. **Principal's Message**: Eyebrow, Photo (3:4 portrait), Quote, Name, Title, CTA
  6. **Academics Section**: Eyebrow, Heading, 4 departments (Name + Description each), CTA
  7. **Quick Links Section**: Eyebrow, Heading, 4 tiles (Text + URL each), CTA
  8. **Exam Results Section**: Eyebrow, Heading, CTA
  9. **Student Life Section**: Eyebrow, Heading, 7 labeled photo tiles (Sports, Music & Drama, Clubs, Houses, Prefects, Scouts, Faith & Service)
  10. **News & Events**: Eyebrow, Heading, CTA
  11. **Achievement Wall**: Eyebrow, Heading, Description
  12. **Alumni Section**: Eyebrow, Heading Quote, Description, Photos, OB Admin Email, CTAs
  13. **Gallery Section**: Eyebrow, Heading, CTA
  14. **Footer**: Copyright (with `{year}` placeholder), Facebook, Instagram, YouTube URLs

### Content Management
- **About** (`/admin/about`): Edit about page sections (history, founders, values, etc.)
- **Academics** (`/admin/academics`): Manage academic programs and streams
- **Admissions** (`/admin/admissions`): Edit admission info page content
- **Contact** (`/admin/contact`): Edit contact page content and map settings
- **Stats** (`/admin/stats`): Edit homepage stat counters (years, students, staff, etc.)

### Content CRUD
- **Achievements** (`/admin/achievements`): Create/edit/delete achievements with categories and image upload
- **Activities** (`/admin/activities`): Manage school activities, assign admin emails
- **Announcements** (`/admin/announcements`): Create/edit with rich editor, scheduling, status management
- **Big Matches** (`/admin/big-matches`): Manage sports/matches section
- **News** (`/admin/news`): Create/edit news articles with rich editor, featured image, tags
- **Principals** (`/admin/principals`): Add/edit principal profiles and messages
- **Staff** (`/admin/staff`): Manage staff directory (auto-synced principal)
- **Students** (`/admin/students`): Manage student data
- **Student Works** (`/admin/student-works`): Upload/manage student creative works by category
- **University Admissions** (`/admin/university-admissions`): Manage university placement data

### Gallery Management (`/admin/gallery`)
- DataTable with server-side pagination, sorting, and column filtering
- Album CRUD with status workflow (Draft → Published → Archived)
- Individual album image management (`/admin/gallery/$id/images`)
- Batch image upload with drag-and-drop reordering
- Featured album toggle
- Status transitions: Publish, Unpublish, Archive, Restore to Draft

### Content Review Queue (`/admin/reviews`)
- Unified review queue for 5 content types: News, Events, Announcements, Student Works, Photo Albums
- Color-coded type badges
- Rich inline preview dialog (ContentPreviewDialog) for each type
- Approve/Reject actions with rejection reason (visible to content author)
- Empty state when nothing pending

### Other
- **Notifications** (`/admin/notifications`): View/manage site notifications
- **OB Gallery** (`/admin/ob-gallery`): Manage OB-specific photo galleries

---

## 3. OB Admin Panel (`/ob-admin`)

Behind `/ob-admin`, guarded by email match against `siteSettings.ob_admin_email`. Single site-wide OB admin — no per-year scoping.

### Dashboard (`/ob-admin`)
- Stats strip: Members count, Published events, Confirmed donations, Published news/announcements
- "Needs your attention" card with pending membership requests
- Recent donations table

### Members (`/ob-admin/members`)
- **Pending approval section**: Cards with avatar, name, role, year, email, and Approve/Reject buttons
- **All members DataTable**: Columns for Photo, Name, Role, Year, Email, Status (color-coded badges)
- Search by name
- Actions per row: Edit, Approve (pending), Reject (pending), Revoke (approved), Delete
- Add/Edit member dialog with `OBMemberForm`

### Committee (`/ob-admin/committee`)
- **Slot-based committee editor** with predefined hierarchical structure:
  - Patron & Clergy (3 roles)
  - Executive Committee (President, Secretary, Treasurer)
  - Vice Presidents (6 roles)
  - Assistant Officers (4 roles)
  - Committee Members (6 slots)
  - Advisory Board (10 slots)
- Combobox for picking existing members or typing new names
- Photo upload per slot (4:3 ratio)
- Email field per slot
- Bulk save in one mutation call
- Term picker (single year or year range)
- Read-only mode for non-OB admins
- Auto-syncs principal as President on load

### Content Management
- **Announcements** (`/ob-admin/announcements`): Create OB-specific announcements
- **Events** (`/ob-admin/events`): Create OB events with dates, descriptions, images
- **News** (`/ob-admin/news`): Create OB news articles
- **Gallery** (`/ob-admin/gallery`): Manage OB photo albums and images

### Donations (`/ob-admin/donations`)
- Track OB donations with amounts, donors, dates, status
- Create/edit donation records

---

## 4. Activity Admin Panel (`/activities-admin/$activityId/`)

Behind `/activities-admin/$activityId/`, guarded by email match to activity's `adminEmail` OR being an approved club member. Dual-path access control.

- **Dashboard**: Activity overview
- **Announcements**: Activity-specific announcements
- **Events**: Activity-specific events
- **Gallery**: Activity photo albums
- **Members**: Activity member management
- **News**: Activity news articles

---

## 5. Auth & Access Control

### Three-Tier Authentication
1. **`publicProcedure`** — No auth required
2. **`protectedProcedure`** — Requires `auth.userId` (any logged-in user)
3. **`adminProcedure`** — Requires `auth.userId` AND `auth.role === "admin"` (site admin only)

### Specialized Access Layers
- **OB Admin**: Single email match against `siteSettings.ob_admin_email` — one OB admin for the entire site
- **Activity Admin**: Dual-path — matches admin email OR approved club membership
- **Club Access**: Resolves admin/member status via `clubMembers` DB row or email match
- **Site Admin Bypass**: Site admins always bypass all club-level and activity-level checks

### Client-Side Auth
- Better Auth session token pattern
- Automatic `Authorization: Bearer` header injection on all oRPC calls

---

## 6. Rich Text Editor

### Lexical Editor (Primary — 30+ plugins)
- **Core**: RichText, History (undo/redo), AutoFocus, Selection Always On Display
- **Formatting**: Font Family, Font Size, Font Format, Font Color, Font Background, Subscript/Superscript
- **Blocks**: Paragraph, Heading (H1-H6), Lists (bullet, numbered, check), Code Block, Quote, Horizontal Rule
- **Media**: Images with upload, YouTube embeds, Twitter embeds
- **Tables**: Full table editing with cells, rows, columns
- **Layouts**: Multi-column layout containers
- **Links**: Auto-link detection, inline link editing, URL validation
- **Advanced**: Markdown shortcuts, Emoji picker, @Mentions with autocomplete, Speech-to-text (Web Speech API), Date-time insertion
- **Developer**: TreeView debug plugin, Code language selector (Shiki/Prism highlighting)
- **Utility**: Character limit (50,000), Clear formatting, Draggable blocks, Context menu, Slash commands (ComponentPicker)
- **Import/Export**: Lexical state import/export

### Minimal Tiptap Editor (Secondary — simplified forms)
- StarterKit, Underline, TextAlign, Highlight, Image, TaskList, CodeBlockLowlight, Link
- Throttled updates, HTML/JSON/text output

---

## 7. Image Pipeline

### Client-Side Processing
1. **WebP Conversion**: Browser Canvas API at 85% quality (skips if already WebP)
2. **Cropping**: Configurable aspect ratios (16:9, 4:3, 3:4, 1:1) via Dropzone + ImageCropDialog
3. **Aspect Ratio Metadata**: Appended as `?ratio=W:H` query parameter to URL

### Server-Side Storage
4. **Upload**: oRPC `files.uploadFile` → Cloudflare R2 at `{userId}/{uuid}.{ext}`
5. **Validation**: 10 MB max, whitelist (JPEG, PNG, GIF, WebP, AVIF)
6. **File Records**: Database entry with metadata (name, size, type, key, userId)

### Serving & Caching
7. **Image Routes**: `/image/*` with 1-year cache (`public, max-age=31536000`)
8. **File Routes**: `/files/*` with 1-hour cache (`private, max-age=3600`)
9. **User Isolation**: Files scoped to userId; delete operations verify ownership

### In-Editor Handling
10. **Suspense-Based Loading**: `useSuspenseImage()` with in-memory cache
11. **Broken Image Fallback**: Graceful placeholder on load failure

---

## 8. Content Review Workflow

- **5 content types** in unified queue: News, Events, Announcements, Student Works, Photo Albums
- **Club-submitted content** enters `pending` review status
- **Site-admin-created content** auto-approves (bypasses review)
- **Non-admin edits** reset to `pending` review and `draft` status
- **Rejection with reason**: Visible to content author on their club page
- **Review fields**: `reviewStatus`, `reviewedBy`, `reviewedAt`, `rejectionReason`

---

## 9. Principal Auto-Sync

`ensurePrincipalAsStaffAndPresident()`:
- Idempotently syncs published principal into a `staff_members` row with role "Principal"
- Auto-fills the OB President slot for the current year (only if empty)
- Manual assignment always wins over auto-fill
- Called on read — no manual sync button needed

---

## 10. Notification System

- **Event-driven**: Triggered by club membership lifecycle (request, approve, reject, revoke)
- **Types**: `membership_request`, `membership_approved`, `membership_rejected`, `membership_revoked`
- **Fire-and-forget**: `createNotification()` never throws
- **CRUD**: `myNotifications` (paginated), `unreadCount`, `markRead`, `markAllRead`
- **Database-backed**: Full persistence in `notifications` table

---

## 11. Gallery System

### Homepage Gallery
- CSS columns masonry/pinterest-style layout
- GSAP ScrollTrigger animations (fade-in + scale with stagger)
- Settings-driven content (eyebrow, heading, CTA)
- Max 20 preview images

### Admin Gallery Management
- DataTable with server-side pagination, sorting, filtering
- Status workflow: Draft → Published → Archived
- Batch image upload
- Drag-and-drop image reordering
- Featured album toggle

### Club/OB Galleries
- Per-activity photo albums
- Review workflow for club-submitted albums
- `featuredOnHome` flag

---

## 11. Committee Editor (Slot-Based)

- **Predefined hierarchical structure**: 6 tiers with exact role counts
- **Slot-based UI**: Fixed slots per role (e.g., 2 Assistant Secretaries, 6 Committee Members, 10 Advisory Board)
- **Combobox member picker**: Search existing pool or type new name to create
- **Photo upload per slot**: 4:3 aspect ratio
- **Email field per slot**
- **Batch save**: Entire committee saved in one mutation call
- **Read-only mode**: For non-OB admins
- **Year/range picker**: Single year or year range (e.g., 2026-2028)

---

## 12. Dual-API Server

The Hono server exposes **two parallel API protocols**:
1. **`/rpc/*`** — oRPC RPC handler (type-safe calls from the web client)
2. **`/api-reference/*`** — OpenAPI REST handler with auto-generated specs

Both share the same `appRouter` and `createContext`.

---

## 13. Unique & Notable Features

1. **Brutalist Corner Design**: Sharp, angular edges with minimal/no border-radius throughout
2. **Dual Rich Text Editors**: Lexical (full-featured, 30+ plugins) + Minimal Tiptap (simplified)
3. **Speech-to-Text**: Browser Web Speech API integration in the editor
4. **Slash Commands**: Component picker menu triggered by `/` in the editor
5. **@Mentions**: Autocomplete mentions in rich text content
6. **School Anthem as Sheet Music**: VexFlow-rendered interactive notation
7. **Multi-Source Hero Carousel**: Aggregates 6 content types with source-specific styling
8. **Slot-Based Committee Editor**: Fixed organizational chart with batch save
9. **Principal Auto-Sync**: Publishes to staff + OB President simultaneously
10. **Content Review Queue**: 5 content types in one unified moderation interface
11. **Dual-Path Activity Admin**: Email match OR club membership for access
12. **Cross-Table Tag Aggregation**: Tags aggregated across 5+ tables via SQLite `json_each()`
13. **Image Aspect Ratio Metadata**: Preserved via URL query parameter
14. **Auto-Slug Generation**: Collision-safe slugs with `-1`, `-2` suffixes
15. **Homepage CMS**: 14 fully configurable sections via key-value settings
16. **Notice Strip**: Configurable priority banner (standard gold or high red)
17. **Marquee Announcements**: Auto-scrolling announcement strip
18. **GSAP Scroll Animations**: Consistent fade-up, stagger, and scale effects across all pages
19. **In-Memory Image Cache**: Editor-level image dimension caching
20. **Sticky Principal Portrait**: Portrait stays visible while scrolling on desktop
21. **Role-Based Member Ordering**: President first, Secretary second, etc.
22. **Donation Tracking**: Full OB donation system with donor recognition
23. **Membership Application**: PDF download for offline submission
24. **Club Join/Leave**: Self-service club membership with admin approval
25. **Auto-Seeding**: Stats table auto-populates with defaults (150+ years, 4500+ students)
26. **Alchemy IaC**: Infrastructure-as-Code for Cloudflare D1, R2, Workers
27. **No Email Service**: Contact uses mailto: approach (no SMTP/transactional email)
28. **No Rate Limiting**: Application-level rate limiting not yet implemented
29. **No i18n**: Single-language (English) — no internationalization
30. **No SSR/ISR Caching**: Uses TanStack Start with 60s default staleTime

---

## 14. Database Schema (30+ tables)

Core tables: `users`, `news`, `announcements`, `events`, `achievements`, `galleryAlbums`, `galleryImages`, `studentWorks`, `staffMembers`, `principals`, `obMembers`, `obEvents`, `obDonations`, `obNews`, `obAnnouncements`, `obGalleries`, `obGalleryImages`, `clubAlbums`, `clubAlbumImages`, `activities`, `activityMembers`, `clubs`, `clubMembers`, `examResults`, `universityAdmissions`, `bigMatches`, `tags`, `taggables`, `stats`, `siteSettings`, `notifications`, `contentReviews`, `contacts`, `files`.

---

## 15. Key API Routers

| Router | Capabilities |
|--------|-------------|
| `files` | Upload to R2, auto-WebP conversion, image optimization, multi-file upload |
| `news` | CRUD, search, pagination, tag filtering, featured flag |
| `announcements` | CRUD, scheduling (publishDate), tag filtering |
| `events` | CRUD, date-based filtering |
| `achievements` | CRUD, category filtering, student info |
| `gallery` | Album CRUD, image CRUD, batch upload, reorder, featured albums |
| `student-works` | CRUD, category filtering |
| `stats` | CRUD, auto-seeding defaults |
| `tags` | Cross-table aggregation via `json_each()`, tag autocomplete |
| `settings` | Key-value site settings CRUD |
| `activities` | CRUD, admin email assignment, member management |
| `clubs` | CRUD, join/leave/approve/reject membership, member lists |
| `club-albums` | Album CRUD with review workflow, `featuredOnHome` flag |
| `principals` | CRUD, auto-sync to staff + OB President |
| `staff` | CRUD, auto-synced principal row |
| `exam-results` | CRUD, bulk upload, grade/year/term filtering |
| `ob` | Full OB system — members, events, donations, news, announcements, galleries, committee, year-based access |
| `notifications` | User notification CRUD, mark read, bulk operations |
| `admin.settings` | Site-wide settings management |
| `admin.clubs` | Content review approve/reject with reason |

---

*Last updated: August 2026*
