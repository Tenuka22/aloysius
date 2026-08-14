import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

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
    authorType: text("author_type", { enum: ["student", "faculty", "club", "org"] }),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] })
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
    authorType: text("author_type", { enum: ["student", "faculty", "club", "org"] }),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    audience: text("audience", { enum: ["all", "students", "parents", "staff", "alumni"] })
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
    reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] })
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
    organizerType: text("organizer_type", { enum: ["student", "faculty", "club", "org"] }),
    location: text("location"),
    startDate: integer("start_date", { mode: "timestamp" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp" }),
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    isAllDay: integer("is_all_day", { mode: "boolean" }).notNull().default(false),
    recurrenceRule: text("recurrence_rule"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] })
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
  outcome: text("outcome", { enum: ["success", "postponed", "failed"] }).notNull(),
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
    category: text("category", {
      enum: ["academic", "sports", "arts", "clubs", "community", "other"],
    })
      .notNull()
      .default("other"),
    recipientNames: text("recipient_names", { mode: "json" }).$type<string[]>().default([]),
    recipientType: text("recipient_type", { enum: ["student", "faculty", "club", "org"] })
      .notNull()
      .default("student"),
    year: integer("year"),
    coverImage: text("cover_image"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    studentWorkId: text("student_work_id").references(() => studentWorks.id, {
      onDelete: "set null",
    }),
    achievementId: text("achievement_id").references(() => achievements.id, {
      onDelete: "set null",
    }),
    coverImage: text("cover_image"),
    authorName: text("author_name"),
    authorType: text("author_type", { enum: ["student", "faculty", "club", "org"] }),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    category: text("category", {
      enum: ["film", "art", "music", "writing", "design", "photography", "code", "other"],
    })
      .notNull()
      .default("other"),
    studentNames: text("student_names", { mode: "json" }).$type<string[]>().default([]),
    studentGrade: text("student_grade"),
    authorType: text("author_type", { enum: ["student", "faculty", "club", "org"] }),
    coverImage: text("cover_image"),
    contentUrl: text("content_url"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] })
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
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    images: text("images", { mode: "json" }).default([]),
    type: text("type", { enum: ["club", "sport", "other"] })
      .notNull()
      .default("club"),
    adminEmail: text("admin_email"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
    status: text("status", { enum: ["pending", "approved", "rejected", "revoked"] })
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
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] })
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
    examType: text("exam_type", { enum: ["scholarship", "ol", "al"] }).notNull(),
    examYear: integer("exam_year").notNull(),
    resultsYear: integer("results_year").notNull(),
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    stream: text("stream", { enum: ["physical_science", "biological_science", "commerce", "arts", "technology"] }),
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
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    adminEmail: text("admin_email"),
    photo: text("photo"),
    bio: text("bio"),
    year: text("year").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: ["pending", "approved", "rejected", "revoked"] })
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
  (table) => [index("ob_members_role_idx").on(table.role), index("ob_members_user_idx").on(table.userId), index("ob_members_year_idx").on(table.year)],
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
    status: text("status", { enum: ["draft", "published", "archived"] })
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
    status: text("status", { enum: ["pending", "confirmed", "cancelled"] })
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

// --- Notifications table (in-app alerts for membership/content decisions) ---

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    type: text("type", {
      enum: [
        "membership_request",
        "membership_approved",
        "membership_rejected",
        "membership_revoked",
        "content_approved",
        "content_rejected",
      ],
    }).notNull(),
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
