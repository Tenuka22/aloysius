CREATE TABLE `club` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`description` text,
	`cover_image_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "club_role_check" CHECK("role" in ('society', 'cadet_corps', 'band', 'media'))
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_announcement` (
	`id` text PRIMARY KEY,
	`club` text,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`audience` text DEFAULT 'all' NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`image_id` text,
	`effective_from` integer,
	`expires_at` integer,
	`published_at` integer,
	`author_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_announcement_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_announcement_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_announcement_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "announcement_window_ordered" CHECK("expires_at" is null or "effective_from" is null or "expires_at" > "effective_from"),
	CONSTRAINT "announcement_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "announcement_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_announcement`(`id`, `club`, `slug`, `title`, `body`, `audience`, `severity`, `is_pinned`, `image_id`, `effective_from`, `expires_at`, `published_at`, `author_id`, `status`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`, `updated_at`) SELECT `id`, `club`, `slug`, `title`, `body`, `audience`, `severity`, `is_pinned`, `image_id`, `effective_from`, `expires_at`, `published_at`, `author_id`, `status`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`, `updated_at` FROM `announcement`;--> statement-breakpoint
DROP TABLE `announcement`;--> statement-breakpoint
ALTER TABLE `__new_announcement` RENAME TO `announcement`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_gallery` (
	`id` text PRIMARY KEY,
	`club` text,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`description` text,
	`album_url` text,
	`cover_image_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_by_id` text NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`published_at` integer,
	`linked_kind` text,
	`linked_news_id` text,
	`linked_event_id` text,
	`linked_achievement_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_cover_image_id_files_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_gallery_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_linked_news_id_news_post_id_fk` FOREIGN KEY (`linked_news_id`) REFERENCES `news_post`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_linked_event_id_event_id_fk` FOREIGN KEY (`linked_event_id`) REFERENCES `event`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_linked_achievement_id_achievement_id_fk` FOREIGN KEY (`linked_achievement_id`) REFERENCES `achievement`(`id`) ON DELETE SET NULL,
	CONSTRAINT "gallery_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "gallery_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null)),
	CONSTRAINT "gallery_album_url_http" CHECK("album_url" is null or "album_url" like 'http://%' or "album_url" like 'https://%'),
	CONSTRAINT "gallery_linked_kind_check" CHECK("linked_kind" is null or "linked_kind" in ('news', 'event', 'achievement')),
	CONSTRAINT "gallery_linked_fields_paired" CHECK(("linked_kind" is null and "linked_news_id" is null and "linked_event_id" is null and "linked_achievement_id" is null)
          or ("linked_kind" = 'news' and "linked_news_id" is not null and "linked_event_id" is null and "linked_achievement_id" is null)
          or ("linked_kind" = 'event' and "linked_event_id" is not null and "linked_news_id" is null and "linked_achievement_id" is null)
          or ("linked_kind" = 'achievement' and "linked_achievement_id" is not null and "linked_news_id" is null and "linked_event_id" is null))
);
--> statement-breakpoint
INSERT INTO `__new_gallery`(`id`, `club`, `slug`, `title`, `description`, `album_url`, `cover_image_id`, `status`, `created_by_id`, `reviewed_by_id`, `reviewed_at`, `review_note`, `published_at`, `linked_kind`, `linked_news_id`, `linked_event_id`, `linked_achievement_id`, `created_at`, `updated_at`) SELECT `id`, `club`, `slug`, `title`, `description`, `album_url`, `cover_image_id`, `status`, `created_by_id`, `reviewed_by_id`, `reviewed_at`, `review_note`, `published_at`, `linked_kind`, `linked_news_id`, `linked_event_id`, `linked_achievement_id`, `created_at`, `updated_at` FROM `gallery`;--> statement-breakpoint
DROP TABLE `gallery`;--> statement-breakpoint
ALTER TABLE `__new_gallery` RENAME TO `gallery`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_news_post` (
	`id` text PRIMARY KEY,
	`club` text,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`summary` text,
	`body` text NOT NULL,
	`category` text,
	`cover_image_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by_id` text NOT NULL,
	`published_at` integer,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_news_post_cover_image_id_files_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_news_post_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_news_post_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "news_post_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "news_post_category_check" CHECK("category" in ('academic', 'sports', 'arts', 'achievement', 'general')),
	CONSTRAINT "news_post_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_news_post`(`id`, `club`, `slug`, `title`, `summary`, `body`, `category`, `cover_image_id`, `status`, `submitted_by_id`, `published_at`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`, `updated_at`) SELECT `id`, `club`, `slug`, `title`, `summary`, `body`, `category`, `cover_image_id`, `status`, `submitted_by_id`, `published_at`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`, `updated_at` FROM `news_post`;--> statement-breakpoint
DROP TABLE `news_post`;--> statement-breakpoint
ALTER TABLE `__new_news_post` RENAME TO `news_post`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_event` (
	`id` text PRIMARY KEY,
	`club` text,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`cover_image_id` text,
	`published_at` integer,
	`submitted_by_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_event_cover_image_id_files_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_event_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_event_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "event_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "event_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_event`(`id`, `club`, `slug`, `title`, `description`, `location`, `starts_at`, `ends_at`, `cover_image_id`, `published_at`, `submitted_by_id`, `status`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`, `updated_at`) SELECT `id`, `club`, `slug`, `title`, `description`, `location`, `starts_at`, `ends_at`, `cover_image_id`, `published_at`, `submitted_by_id`, `status`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`, `updated_at` FROM `event`;--> statement-breakpoint
DROP TABLE `event`;--> statement-breakpoint
ALTER TABLE `__new_event` RENAME TO `event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `announcement_audience_idx` ON `announcement` (`audience`);--> statement-breakpoint
CREATE INDEX `announcement_pinned_idx` ON `announcement` (`is_pinned`);--> statement-breakpoint
CREATE INDEX `announcement_publishedAt_idx` ON `announcement` (`published_at`);--> statement-breakpoint
CREATE INDEX `announcement_author_idx` ON `announcement` (`author_id`);--> statement-breakpoint
CREATE INDEX `announcement_club_status_idx` ON `announcement` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `gallery_club_status_idx` ON `gallery` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `gallery_published_idx` ON `gallery` (`published_at`);--> statement-breakpoint
CREATE INDEX `gallery_created_by_idx` ON `gallery` (`created_by_id`);--> statement-breakpoint
CREATE INDEX `news_post_club_status_idx` ON `news_post` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `news_post_published_idx` ON `news_post` (`published_at`);--> statement-breakpoint
CREATE INDEX `news_post_submitted_by_idx` ON `news_post` (`submitted_by_id`);--> statement-breakpoint
CREATE INDEX `event_published_starts_idx` ON `event` (`published_at`,`starts_at`);--> statement-breakpoint
CREATE INDEX `event_club_status_idx` ON `event` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `club_role_idx` ON `club` (`role`);