ALTER TABLE `announcement` ADD `club` text NOT NULL;--> statement-breakpoint
ALTER TABLE `announcement` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `announcement` ADD `reviewed_by_id` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `announcement` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `announcement` ADD `review_note` text;--> statement-breakpoint
ALTER TABLE `event` ADD `club` text NOT NULL;--> statement-breakpoint
ALTER TABLE `event` ADD `submitted_by_id` text NOT NULL REFERENCES user(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `event` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `event` ADD `reviewed_by_id` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `event` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `event` ADD `review_note` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_announcement` (
	`id` text PRIMARY KEY,
	`club` text NOT NULL,
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
	CONSTRAINT "announcement_club_check" CHECK("club" in ('photography')),
	CONSTRAINT "announcement_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "announcement_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_announcement`(`id`, `slug`, `title`, `body`, `audience`, `severity`, `is_pinned`, `image_id`, `effective_from`, `expires_at`, `published_at`, `author_id`, `created_at`, `updated_at`) SELECT `id`, `slug`, `title`, `body`, `audience`, `severity`, `is_pinned`, `image_id`, `effective_from`, `expires_at`, `published_at`, `author_id`, `created_at`, `updated_at` FROM `announcement`;--> statement-breakpoint
DROP TABLE `announcement`;--> statement-breakpoint
ALTER TABLE `__new_announcement` RENAME TO `announcement`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_event` (
	`id` text PRIMARY KEY,
	`club` text NOT NULL,
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
	CONSTRAINT "event_club_check" CHECK("club" in ('photography')),
	CONSTRAINT "event_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "event_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_event`(`id`, `slug`, `title`, `description`, `location`, `starts_at`, `ends_at`, `cover_image_id`, `published_at`, `created_at`, `updated_at`) SELECT `id`, `slug`, `title`, `description`, `location`, `starts_at`, `ends_at`, `cover_image_id`, `published_at`, `created_at`, `updated_at` FROM `event`;--> statement-breakpoint
DROP TABLE `event`;--> statement-breakpoint
ALTER TABLE `__new_event` RENAME TO `event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `announcement_audience_idx` ON `announcement` (`audience`);--> statement-breakpoint
CREATE INDEX `announcement_pinned_idx` ON `announcement` (`is_pinned`);--> statement-breakpoint
CREATE INDEX `announcement_publishedAt_idx` ON `announcement` (`published_at`);--> statement-breakpoint
CREATE INDEX `announcement_author_idx` ON `announcement` (`author_id`);--> statement-breakpoint
CREATE INDEX `announcement_club_status_idx` ON `announcement` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `event_published_starts_idx` ON `event` (`published_at`,`starts_at`);--> statement-breakpoint
CREATE INDEX `event_club_status_idx` ON `event` (`club`,`status`);