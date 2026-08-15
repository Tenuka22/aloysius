# Image Upload Aspect Ratios

This document tracks the crop aspect ratios used when uploading images across the admin forms and content types.

## Upload Component Defaults

The `ImageCropDialog` in `packages/ui/src/components/image-crop-dialog.tsx` defaults to `aspect = 16/9` when no explicit aspect is passed.

The `Dropzone` component in `apps/web/src/components/file-upload.tsx` also defaults to `aspect = 16/9`.

## Content Type Ratios

### Activities / Clubs (`apps/web/src/components-client/activities-form.tsx`)

- **Cover Image**: `16/9` (aspect-video)
- **Logo**: `1` (aspect-square)
- **Banner**: `16/9` (aspect-video)
- **Gallery Images**: free-form (no crop)

### Announcements (`apps/web/src/components-client/announcement-form.tsx`)

- **Cover Image**: `16/9`

### Achievements (`apps/web/src/components-client/achievement-form.tsx`)

- **Cover Image**: `16/9`

### Events (`apps/web/src/components-client/event-form.tsx`)

- **Cover Image**: `1` (aspect-square)
- **Body Image**: `16/9`

### Exam Results (`apps/web/src/components-client/exam-result-form.tsx`)

- **Student Photo**: `1` (aspect-square)

### Student Works (`apps/web/src/components-client/student-work-form.tsx`)

- **Cover Image**: `1` (aspect-square)

### Gallery (`apps/web/src/components-client/gallery-form.tsx`)

- **Cover Image**: `16/9`

### News (`apps/web/src/components-client/news-form.tsx`)

- **Cover Image**: `16/9`

### OB Events (`apps/web/src/components-client/ob-event-form.tsx`)

- **Event Image**: `16/9`

### OB Donations (`apps/web/src/components-client/ob-donation-form.tsx`)

- **Donation Image**: `16/9`

### OB Members (`apps/web/src/components-client/ob-member-form.tsx`)

- **Member Photo**: `4/3`

### Principals (`apps/web/src/components-client/principal-form.tsx`)

- **Portrait**: `3/4`

### Staff Editor (`apps/web/src/components-client/staff-editor.tsx`)

- **Staff Photo**: `1` (aspect-square)

## Admin Page Ratios

### Homepage (`apps/web/src/routes/admin.homepage.tsx`)

- **Hero Background**: `16/9`
- **Hero Archival Photos**: `4/3`
- **News Ticker Images**: `3/4`
- **Student Life Tiles**: varies (`16/9`, `4/3`, `3/4`, `1`)
- **CTA Background**: `16/9`
- **Footer Logo**: `1`

### About (`apps/web/src/routes/admin.about.tsx`)

- **Page Images**: `4/3` (default)
- **Staff Images**: `3/4`

### Academics (`apps/web/src/routes/admin.academics.tsx`)

- **Result Images**: `4/3`
- **Accreditation Logos**: `16/9`

### Alumni (`apps/web/src/routes/admin.alumni.tsx`)

- **Alumni Photos**: `3/4`

### Big Matches (`apps/web/src/routes/admin.big-matches.tsx`)

- **Match Cover**: `16/9`

### Gallery Images (`apps/web/src/routes/admin.gallery_.$id.images.tsx`)

- **Gallery Images**: `16/9`

### Students (`apps/web/src/routes/admin.students.tsx`)

- **Student Photos**: `4/3`

## Notes

- `16/9` = `aspect-video` — used for most covers, banners, and wide content
- `4/3` = `aspect-[4/3]` — used for photos, alumni, academics
- `3/4` = `aspect-[3/4]` — used for portraits (principals, about staff)
- `1` = `aspect-square` — used for logos, avatars, exam student photos, event covers
- The `getAspectRatio` helper reads a `ratio=W:H` query param from stored image URLs so the frontend can render with the correct aspect ratio even after upload
