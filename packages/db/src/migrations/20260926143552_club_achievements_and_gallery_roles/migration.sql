CREATE TABLE `club_achievement` (
	`id` text PRIMARY KEY,
	`club_id` text NOT NULL,
	`title` text NOT NULL,
	`detail` text,
	`category` text,
	`achieved_on` text,
	`image_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_club_achievement_club_id_club_id_fk` FOREIGN KEY (`club_id`) REFERENCES `club`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_achievement_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
ALTER TABLE `gallery` ADD `album_url` text;--> statement-breakpoint
ALTER TABLE `gallery` ADD `album_label` text;--> statement-breakpoint
ALTER TABLE `gallery_item` ADD `image_role` text DEFAULT 'item' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_gallery_item` (
	`id` text PRIMARY KEY,
	`gallery_id` text NOT NULL,
	`file_id` text NOT NULL,
	`caption` text,
	`alt_text` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`image_role` text DEFAULT 'item' NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`is_trending` integer DEFAULT false NOT NULL,
	`trending_position` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_item_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_gallery_item_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE,
	CONSTRAINT "galleryItem_trendingPosition_range" CHECK("trending_position" between 1 and 5),
	CONSTRAINT "galleryItem_trendingPosition_required" CHECK(("is_trending" = 1 and "trending_position" is not null) or ("is_trending" = 0 and "trending_position" is null)),
	CONSTRAINT "galleryItem_cover_follows_role" CHECK(("image_role" = 'cover' and "is_cover" = 1) or ("image_role" <> 'cover' and "is_cover" = 0))
);
--> statement-breakpoint
INSERT INTO `__new_gallery_item`(`id`, `gallery_id`, `file_id`, `caption`, `alt_text`, `position`, `image_role`, `is_cover`, `is_trending`, `trending_position`, `created_at`, `updated_at`) SELECT `id`, `gallery_id`, `file_id`, `caption`, `alt_text`, `position`, (CASE WHEN "is_cover" = 1 THEN 'cover' ELSE 'item' END), `is_cover`, `is_trending`, `trending_position`, `created_at`, `updated_at` FROM `gallery_item`;--> statement-breakpoint
DROP TABLE `gallery_item`;--> statement-breakpoint
ALTER TABLE `__new_gallery_item` RENAME TO `gallery_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_club_content_submission` (
	`id` text PRIMARY KEY,
	`club_id` text NOT NULL,
	`target` text NOT NULL,
	`target_id` text,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`base_snapshot` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_club_content_submission_club_id_club_id_fk` FOREIGN KEY (`club_id`) REFERENCES `club`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_content_submission_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_content_submission_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "clubContentSubmission_create_has_no_target" CHECK(("operation" = 'create' and "target_id" is null) or ("operation" <> 'create' and "target_id" is not null)),
	CONSTRAINT "clubContentSubmission_reviewed_fields_paired" CHECK(("status" in ('pending', 'withdrawn') and "reviewed_at" is null and "reviewed_by_id" is null) or ("status" in ('approved', 'rejected') and "reviewed_at" is not null and "reviewed_by_id" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_club_content_submission`(`id`, `club_id`, `target`, `target_id`, `operation`, `payload`, `base_snapshot`, `status`, `submitted_by_id`, `submitted_at`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`) SELECT `id`, `club_id`, `target`, `target_id`, `operation`, `payload`, `base_snapshot`, `status`, `submitted_by_id`, `submitted_at`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at` FROM `club_content_submission`;--> statement-breakpoint
DROP TABLE `club_content_submission`;--> statement-breakpoint
ALTER TABLE `__new_club_content_submission` RENAME TO `club_content_submission`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_global_content_submission` (
	`id` text PRIMARY KEY,
	`target` text NOT NULL,
	`target_id` text,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`base_snapshot` text,
	`submitted_by_club_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_global_content_submission_submitted_by_club_id_club_id_fk` FOREIGN KEY (`submitted_by_club_id`) REFERENCES `club`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_global_content_submission_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_global_content_submission_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "globalContentSubmission_create_has_no_target" CHECK(("operation" = 'create' and "target_id" is null) or ("operation" <> 'create' and "target_id" is not null)),
	CONSTRAINT "globalContentSubmission_reviewed_fields_paired" CHECK(("status" in ('pending', 'withdrawn') and "reviewed_at" is null and "reviewed_by_id" is null) or ("status" in ('approved', 'rejected') and "reviewed_at" is not null and "reviewed_by_id" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_global_content_submission`(`id`, `target`, `target_id`, `operation`, `payload`, `base_snapshot`, `submitted_by_club_id`, `status`, `submitted_by_id`, `submitted_at`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at`) SELECT `id`, `target`, `target_id`, `operation`, `payload`, `base_snapshot`, `submitted_by_club_id`, `status`, `submitted_by_id`, `submitted_at`, `reviewed_by_id`, `reviewed_at`, `review_note`, `created_at` FROM `global_content_submission`;--> statement-breakpoint
DROP TABLE `global_content_submission`;--> statement-breakpoint
ALTER TABLE `__new_global_content_submission` RENAME TO `global_content_submission`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `galleryItem_gallery_idx` ON `gallery_item` (`gallery_id`);--> statement-breakpoint
CREATE INDEX `galleryItem_file_idx` ON `gallery_item` (`file_id`);--> statement-breakpoint
CREATE INDEX `galleryItem_gallery_position_idx` ON `gallery_item` (`gallery_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `galleryItem_cover_uq` ON `gallery_item` (`gallery_id`) WHERE "gallery_item"."is_cover" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `galleryItem_bannerRole_uq` ON `gallery_item` (`gallery_id`) WHERE "gallery_item"."image_role" = 'banner';--> statement-breakpoint
CREATE UNIQUE INDEX `galleryItem_trendingPosition_uq` ON `gallery_item` (`gallery_id`,`trending_position`) WHERE "gallery_item"."is_trending" = 1;--> statement-breakpoint
CREATE INDEX `clubContentSubmission_club_target_idx` ON `club_content_submission` (`club_id`,`target`,`target_id`);--> statement-breakpoint
CREATE INDEX `clubContentSubmission_status_idx` ON `club_content_submission` (`status`);--> statement-breakpoint
CREATE INDEX `clubContentSubmission_submittedBy_idx` ON `club_content_submission` (`submitted_by_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `clubContentSubmission_pending_uq` ON `club_content_submission` (`club_id`,`target`,`target_id`) WHERE "club_content_submission"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `globalContentSubmission_target_idx` ON `global_content_submission` (`target`,`target_id`);--> statement-breakpoint
CREATE INDEX `globalContentSubmission_status_idx` ON `global_content_submission` (`status`);--> statement-breakpoint
CREATE INDEX `globalContentSubmission_submittedBy_idx` ON `global_content_submission` (`submitted_by_id`);--> statement-breakpoint
CREATE INDEX `globalContentSubmission_club_idx` ON `global_content_submission` (`submitted_by_club_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `globalContentSubmission_pending_uq` ON `global_content_submission` (`target`,`target_id`) WHERE "global_content_submission"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `clubAchievement_club_idx` ON `club_achievement` (`club_id`);--> statement-breakpoint
CREATE INDEX `clubAchievement_publishedAt_idx` ON `club_achievement` (`published_at`);