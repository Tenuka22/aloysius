CREATE TABLE `gallery` (
	`id` text PRIMARY KEY,
	`club` text,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`description` text,
	`album_url` text,
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
	CONSTRAINT `fk_gallery_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_gallery_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_linked_news_id_news_post_id_fk` FOREIGN KEY (`linked_news_id`) REFERENCES `news_post`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_linked_event_id_event_id_fk` FOREIGN KEY (`linked_event_id`) REFERENCES `event`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_linked_achievement_id_achievement_id_fk` FOREIGN KEY (`linked_achievement_id`) REFERENCES `achievement`(`id`) ON DELETE SET NULL,
	CONSTRAINT "gallery_club_check" CHECK("club" is null or "club" in ('photography')),
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
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_club_photo` (
	`id` text PRIMARY KEY,
	`gallery_id` text NOT NULL,
	`file_id` text NOT NULL,
	`caption` text NOT NULL,
	`alt_text` text NOT NULL,
	`submitted_by_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_club_photo_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_photo_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_photo_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_club_photo`(`id`, `file_id`, `caption`, `alt_text`, `submitted_by_id`, `submitted_at`) SELECT `id`, `file_id`, `caption`, `alt_text`, `submitted_by_id`, `submitted_at` FROM `club_photo`;--> statement-breakpoint
DROP TABLE `club_photo`;--> statement-breakpoint
ALTER TABLE `__new_club_photo` RENAME TO `club_photo`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `club_photo_club_status_idx`;--> statement-breakpoint
CREATE INDEX `club_photo_gallery_idx` ON `club_photo` (`gallery_id`);--> statement-breakpoint
CREATE INDEX `club_photo_file_idx` ON `club_photo` (`file_id`);--> statement-breakpoint
CREATE INDEX `club_photo_submitted_by_idx` ON `club_photo` (`submitted_by_id`);--> statement-breakpoint
CREATE INDEX `gallery_club_status_idx` ON `gallery` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `gallery_published_idx` ON `gallery` (`published_at`);--> statement-breakpoint
CREATE INDEX `gallery_created_by_idx` ON `gallery` (`created_by_id`);