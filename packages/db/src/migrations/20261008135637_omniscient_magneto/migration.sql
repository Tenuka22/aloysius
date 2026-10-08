CREATE TABLE `club_photo` (
	`id` text PRIMARY KEY,
	`club` text NOT NULL,
	`file_id` text NOT NULL,
	`caption` text NOT NULL,
	`alt_text` text NOT NULL,
	`album_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	CONSTRAINT `fk_club_photo_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_photo_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_photo_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "club_photo_club_check" CHECK("club" in ('photography')),
	CONSTRAINT "club_photo_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "club_photo_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null)),
	CONSTRAINT "club_photo_album_url_http" CHECK("album_url" is null or "album_url" like 'http://%' or "album_url" like 'https://%')
);
--> statement-breakpoint
CREATE TABLE `news_post` (
	`id` text PRIMARY KEY,
	`club` text NOT NULL,
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
	CONSTRAINT "news_post_club_check" CHECK("club" in ('photography')),
	CONSTRAINT "news_post_status_check" CHECK("status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "news_post_category_check" CHECK("category" in ('academic', 'sports', 'arts', 'achievement', 'general')),
	CONSTRAINT "news_post_review_fields_paired" CHECK(("status" = 'pending' and "reviewed_by_id" is null and "reviewed_at" is null)
          or ("status" <> 'pending' and "reviewed_by_id" is not null and "reviewed_at" is not null))
);
--> statement-breakpoint
DROP INDEX IF EXISTS `admin_activity_created_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubContentSubmission_club_target_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubContentSubmission_status_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubContentSubmission_submittedBy_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubContentSubmission_pending_uq`;--> statement-breakpoint
DROP INDEX IF EXISTS `globalContentSubmission_target_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `globalContentSubmission_status_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `globalContentSubmission_submittedBy_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `globalContentSubmission_club_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `globalContentSubmission_pending_uq`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubAchievement_club_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubAchievement_publishedAt_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubAnnouncement_club_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubAnnouncement_global_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubAnnouncement_publishedAt_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubEvent_club_slug_uq`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubEvent_club_startsAt_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `clubEvent_startsAt_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `club_status_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `club_coverImage_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `gallery_kind_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `gallery_ownerClub_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `gallery_status_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `gallery_banned_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryItem_gallery_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryItem_file_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryItem_gallery_position_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryItem_cover_uq`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryItem_bannerRole_uq`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryItem_trendingPosition_uq`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryLink_gallery_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryLink_target_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `galleryLink_gallery_target_uq`;--> statement-breakpoint
CREATE INDEX `club_photo_club_status_idx` ON `club_photo` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `club_photo_file_idx` ON `club_photo` (`file_id`);--> statement-breakpoint
CREATE INDEX `club_photo_submitted_by_idx` ON `club_photo` (`submitted_by_id`);--> statement-breakpoint
CREATE INDEX `news_post_club_status_idx` ON `news_post` (`club`,`status`);--> statement-breakpoint
CREATE INDEX `news_post_published_idx` ON `news_post` (`published_at`);--> statement-breakpoint
CREATE INDEX `news_post_submitted_by_idx` ON `news_post` (`submitted_by_id`);--> statement-breakpoint
DROP TABLE `admin_activity`;--> statement-breakpoint
DROP TABLE `club_content_submission`;--> statement-breakpoint
DROP TABLE `global_content_submission`;--> statement-breakpoint
DROP TABLE `club_achievement`;--> statement-breakpoint
DROP TABLE `club_announcement`;--> statement-breakpoint
DROP TABLE `club_event`;--> statement-breakpoint
DROP TABLE `club`;--> statement-breakpoint
DROP TABLE `art_gallery`;--> statement-breakpoint
DROP TABLE `digital_gallery`;--> statement-breakpoint
DROP TABLE `gallery`;--> statement-breakpoint
DROP TABLE `gallery_item`;--> statement-breakpoint
DROP TABLE `gallery_link`;--> statement-breakpoint
DROP TABLE `photo_gallery`;