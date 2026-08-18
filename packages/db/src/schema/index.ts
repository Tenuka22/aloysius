import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import {
  ACTIVITY_TYPES,
  ACHIEVEMENT_CATEGORIES,
  AUDIENCES,
  AUTHOR_TYPES,
  CLUB_MEMBER_ROLES,
  CONTENT_STATUSES,
  DONATION_STATUSES,
  EVENT_OUTCOMES,
  EXAM_TYPES,
  MEMBERSHIP_STATUSES,
  NOTIFICATION_TYPES,
  REVIEW_STATUSES,
  STREAMS,
  STUDENT_WORK_CATEGORIES,
} from "../enums";

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  key: text("key").notNull(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- News table (general updates about the school/area) ---

export const news = sqliteTable(
  "news",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    authorName: text("author_name"),
    authorType: text("author_type", { enum: AUTHOR_TYPES }),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
    activityId: text("activity_id").references(() => activities.id, { onDelete: "set null" }),
    reviewStatus: text("review_status", { enum: REVIEW_STATUSES })
      .notNull()
      .default("approved"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [uniqueIndex("news_slug_idx").on(table.slug)],
);

// --- Announcements table (targeted communications to specific groups/people) ---

export const announcements = sqliteTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    authorName: text("author_name"),
    authorType: text("author_type", { enum: AUTHOR_TYPES }),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    audience: text("audience", { enum: AUDIENCES })
      .notNull()
      .default("all"),
    addressedTo: text("addressed_to"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
    activityId: text("activity_id").references(() => activities.id, { onDelete: "set null" }),
    reviewStatus: text("review_status", { enum: REVIEW_STATUSES })
      .notNull()
      .default("approved"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [uniqueIndex("announcements_slug_idx").on(table.slug)],
);

// --- Events table ---

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    bodyImage: text("body_image"),
    purpose: text("purpose"),
    organization: text("organization"),
    organizerName: text("organizer_name"),
    organizerType: text("organizer_type", { enum: AUTHOR_TYPES }),
    location: text("location"),
    startDate: integer("start_date", { mode: "timestamp" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp" }),
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    isAllDay: integer("is_all_day", { mode: "boolean" }).notNull().default(false),
    recurrenceRule: text("recurrence_rule"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
    activityId: text("activity_id").references(() => activities.id, { onDelete: "set null" }),
    reviewStatus: text("review_status", { enum: REVIEW_STATUSES })
      .notNull()
      .default("approved"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [uniqueIndex("events_slug_idx").on(table.slug)],
);

// --- Event Records (success/postponed/failed outcomes) ---

export const eventRecords = sqliteTable("event_records", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  outcome: text("outcome", { enum: EVENT_OUTCOMES }).notNull(),
  reason: text("reason"),
  notes: text("notes"),
  recordedAt: integer("recorded_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  userId: text("user_id").notNull(),
});

// --- Achievements table (student/school accomplishments) ---

export const achievements = sqliteTable(
  "achievements",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category", { enum: ACHIEVEMENT_CATEGORIES })
      .notNull()
      .default("other"),
    recipientNames: text("recipient_names", { mode: "json" }).$type<string[]>().default([]),
    recipientType: text("recipient_type", { enum: AUTHOR_TYPES })
      .notNull()
      .default("student"),
    year: integer("year"),
    coverImage: text("cover_image"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [uniqueIndex("achievements_slug_idx").on(table.slug)],
);

// --- Gallery table (photo albums connected to events) ---

export const gallery = sqliteTable(
  "gallery",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    description: text("description"),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    obEventId: text("ob_event_id").references(() => obEvents.id, { onDelete: "set null" }),
    obDonationId: text("ob_donation_id").references(() => obDonations.id, {
      onDelete: "set null",
    }),
    studentWorkId: text("student_work_id").references(() => studentWorks.id, {
      onDelete: "set null",
    }),
    achievementId: text("achievement_id").references(() => achievements.id, {
      onDelete: "set null",
    }),
    coverImage: text("cover_image"),
    authorName: text("author_name"),
    authorType: text("author_type", { enum: AUTHOR_TYPES }),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [uniqueIndex("gallery_slug_idx").on(table.slug)],
);

// --- Gallery Images table ---

export const galleryImages = sqliteTable("gallery_images", {
  id: text("id").primaryKey(),
  galleryId: text("gallery_id")
    .notNull()
    .references(() => gallery.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- Student Works table ---

export const studentWorks = sqliteTable(
  "student_works",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category", { enum: STUDENT_WORK_CATEGORIES })
      .notNull()
      .default("other"),
    studentNames: text("student_names", { mode: "json" }).$type<string[]>().default([]),
    studentGrade: text("student_grade"),
    authorType: text("author_type", { enum: AUTHOR_TYPES }),
    coverImage: text("cover_image"),
    contentUrl: text("content_url"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
    activityId: text("activity_id").references(() => activities.id, { onDelete: "set null" }),
    reviewStatus: text("review_status", { enum: REVIEW_STATUSES })
      .notNull()
      .default("approved"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [uniqueIndex("student_works_slug_idx").on(table.slug)],
);

// --- Stats table (editable homepage statistics) ---

export const stats = sqliteTable("stats", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- Site Settings table (key-value for homepage content) ---

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- Big Matches table (rivalry encounters for about page) ---

export const bigMatches = sqliteTable(
  "big_matches",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    name: text("name").notNull(),
    opponent: text("opponent").notNull(),
    coverImage: text("cover_image"),
    type: text("type").notNull().default("Cricket"),
    year: integer("year"),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    galleryId: text("gallery_id").references(() => gallery.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("big_matches_slug_idx").on(table.slug)],
);

// --- Activities table (clubs, societies, sports for about page) ---

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    name: text("name").notNull(),
    description: text("description"),
    coverImage: text("cover_image"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    images: text("images", { mode: "json" }).$type<string[]>().default([]),
    type: text("type", { enum: ACTIVITY_TYPES })
      .notNull()
      .default("club"),
    adminEmail: text("admin_email"),
    adminPasswordHash: text("admin_password_hash"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("activities_slug_idx").on(table.slug)],
);

// --- Club Members table (who belongs to each club/sport, and their status) ---

export const clubMembers = sqliteTable(
  "club_members",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    name: text("name"),
    role: text("role", { enum: CLUB_MEMBER_ROLES })
      .notNull()
      .default("member"),
    status: text("status", { enum: MEMBERSHIP_STATUSES })
      .notNull()
      .default("pending"),
    reason: text("reason"),
    decidedBy: text("decided_by"),
    decidedAt: integer("decided_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("club_members_activity_user_idx").on(table.activityId, table.userId)],
);

// --- Club Albums table (photo albums released by clubs, approved by site admin) ---

export const clubAlbums = sqliteTable(
  "club_albums",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    coverImage: text("cover_image"),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    reviewStatus: text("review_status", { enum: REVIEW_STATUSES })
      .notNull()
      .default("pending"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    rejectionReason: text("rejection_reason"),
    featuredOnHome: integer("featured_on_home", { mode: "boolean" }).notNull().default(false),
    userId: text("user_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("club_albums_activity_idx").on(table.activityId)],
);

// --- Club Album Images table ---

export const clubAlbumImages = sqliteTable("club_album_images", {
  id: text("id").primaryKey(),
  albumId: text("album_id")
    .notNull()
    .references(() => clubAlbums.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- Exam Results table (top scores per exam & year) ---

export const examResults = sqliteTable(
  "exam_results",
  {
    id: text("id").primaryKey(),
    examType: text("exam_type", { enum: EXAM_TYPES }).notNull(),
    examYear: integer("exam_year").notNull(),
    resultsYear: integer("results_year").notNull(),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [index("exam_results_type_year_idx").on(table.examType, table.examYear)],
);

// --- Exam Students table (top performers within an exam result) ---

export const examStudents = sqliteTable(
  "exam_students",
  {
    id: text("id").primaryKey(),
    examResultId: text("exam_result_id")
      .notNull()
      .references(() => examResults.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    photo: text("photo"),
    quote: text("quote"),
    marks: integer("marks"),
    overallGrade: text("overall_grade"),
    stream: text("stream", { enum: STREAMS }),
    subjects: text("subjects", { mode: "json" })
      .$type<{ subject: string; grade: string }[]>()
      .default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("exam_students_result_idx").on(table.examResultId)],
);

// --- University Admissions table (A/L students offered places at Sri Lankan
// universities, listed separately from top performers so every qualified
// student can be recorded) ---

export const universityAdmissions = sqliteTable(
  "university_admissions",
  {
    id: text("id").primaryKey(),
    examResultId: text("exam_result_id")
      .notNull()
      .references(() => examResults.id, { onDelete: "cascade" }),
    studentName: text("student_name").notNull(),
    university: text("university").notNull(),
    course: text("course").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("university_admissions_result_idx").on(table.examResultId)],
);

// --- Principals table (school principal profiles and messages) ---

export const principals = sqliteTable(
  "principals",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    name: text("name").notNull(),
    title: text("title").notNull().default("Principal"),
    quote: text("quote"),
    message: text("message"),
    bio: text("bio"),
    education: text("education"),
    tenure: text("tenure"),
    year: text("year").notNull().default(""),
    portrait: text("portrait"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [uniqueIndex("principals_slug_idx").on(table.slug)],
);

// --- Staff Members table (school staff roster, year by year) ---
// The principal is stored separately in `principals`; this table holds the
// rest of the staff (vice principals, heads, teachers, admin staff) per year.

export const staffMembers = sqliteTable(
  "staff_members",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    email: text("email"),
    photo: text("photo"),
    bio: text("bio"),
    year: text("year").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("staff_members_year_idx").on(table.year)],
);

// --- OB Members table (Old Boys' Association committee) ---

export const obMembers = sqliteTable(
  "ob_members",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    name: text("name").notNull(),
    role: text("role").notNull(),
    email: text("email"),
    photo: text("photo"),
    bio: text("bio"),
    year: text("year").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: MEMBERSHIP_STATUSES })
      .notNull()
      .default("approved"),
    decidedBy: text("decided_by"),
    decidedAt: integer("decided_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("ob_members_role_idx").on(table.role),
    index("ob_members_user_idx").on(table.userId),
    index("ob_members_year_idx").on(table.year),
  ],
);

// --- OB Events table (Old Boys' Association events) ---

export const obEvents = sqliteTable(
  "ob_events",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    description: text("description"),
    coverImage: text("cover_image"),
    location: text("location"),
    eventDate: integer("event_date", { mode: "timestamp" }),
    endDate: integer("end_date", { mode: "timestamp" }),
    isAllDay: integer("is_all_day", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [uniqueIndex("ob_events_slug_idx").on(table.slug)],
);

// --- OB Donations table ---

export const obDonations = sqliteTable(
  "ob_donations",
  {
    id: text("id").primaryKey(),
    donorName: text("donor_name").notNull(),
    donorEmail: text("donor_email"),
    amount: integer("amount"), // stored in cents
    currency: text("currency").notNull().default("LKR"),
    purpose: text("purpose"),
    message: text("message"),
    image: text("image"),
    isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: DONATION_STATUSES })
      .notNull()
      .default("pending"),
    donatedAt: integer("donated_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [index("ob_donations_status_idx").on(table.status)],
);

// --- OB News table (Old Boys' Association self-published news; OB admin
// publishes directly, no site-admin approval gate) ---

export const obNews = sqliteTable(
  "ob_news",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [uniqueIndex("ob_news_slug_idx").on(table.slug)],
);

// --- OB Announcements table (targeted communications from the OB admin) ---

export const obAnnouncements = sqliteTable(
  "ob_announcements",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    audience: text("audience", { enum: AUDIENCES })
      .notNull()
      .default("alumni"),
    status: text("status", { enum: CONTENT_STATUSES })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    userId: text("user_id").notNull(),
  },
  (table) => [uniqueIndex("ob_announcements_slug_idx").on(table.slug)],
);

// --- Notifications table (in-app alerts for membership/content decisions) ---

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    type: text("type", { enum: NOTIFICATION_TYPES }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("notifications_user_read_idx").on(table.userId, table.read)],
);

// Re-export auth tables from auth.ts
export { user, session, account, verification, userRelations, sessionRelations, accountRelations } from "./auth";
