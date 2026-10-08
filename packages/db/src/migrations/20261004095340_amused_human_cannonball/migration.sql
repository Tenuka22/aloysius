CREATE TABLE `gallery_proposal` (
	`id` text PRIMARY KEY,
	`gallery_id` text NOT NULL,
	`submitted_by_club_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text,
	`submitted_by_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_proposal_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_gallery_proposal_submitted_by_club_id_club_id_fk` FOREIGN KEY (`submitted_by_club_id`) REFERENCES `club`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_gallery_proposal_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_gallery_proposal_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "galleryProposal_reviewed_fields_paired" CHECK(("status" in ('pending', 'withdrawn') and "reviewed_at" is null and "reviewed_by_id" is null) or ("status" in ('approved', 'rejected') and "reviewed_at" is not null and "reviewed_by_id" is not null))
);
--> statement-breakpoint
CREATE TABLE `gallery_proposal_item` (
	`id` text PRIMARY KEY,
	`proposal_id` text NOT NULL,
	`operation` text NOT NULL,
	`target_id` text NOT NULL,
	`payload` text NOT NULL,
	`seq` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_proposal_item_proposal_id_gallery_proposal_id_fk` FOREIGN KEY (`proposal_id`) REFERENCES `gallery_proposal`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `gallery` ADD `banned_at` integer;--> statement-breakpoint
ALTER TABLE `gallery` ADD `banned_by_id` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `gallery` ADD `ban_reason` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_gallery` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`owner_club_id` text,
	`album_url` text,
	`album_label` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` integer,
	`banned_at` integer,
	`banned_by_id` text,
	`ban_reason` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_owner_club_id_club_id_fk` FOREIGN KEY (`owner_club_id`) REFERENCES `club`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_gallery_banned_by_id_user_id_fk` FOREIGN KEY (`banned_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "gallery_ban_fields_paired" CHECK(("banned_at" is null and "banned_by_id" is null) or ("banned_at" is not null and "banned_by_id" is not null))
);
--> statement-breakpoint
INSERT INTO `__new_gallery`(`id`, `slug`, `kind`, `title`, `summary`, `owner_club_id`, `album_url`, `album_label`, `status`, `published_at`, `created_at`, `updated_at`) SELECT `id`, `slug`, `kind`, `title`, `summary`, `owner_club_id`, `album_url`, `album_label`, `status`, `published_at`, `created_at`, `updated_at` FROM `gallery`;--> statement-breakpoint
DROP TABLE `gallery`;--> statement-breakpoint
ALTER TABLE `__new_gallery` RENAME TO `gallery`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text DEFAULT 'user',
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`username` text UNIQUE,
	`display_username` text
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`, `role`, `banned`, `ban_reason`, `ban_expires`, `username`, `display_username`) SELECT `id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`, `role`, `banned`, `ban_reason`, `ban_expires`, `username`, `display_username` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `gallery_kind_idx` ON `gallery` (`kind`);--> statement-breakpoint
CREATE INDEX `gallery_ownerClub_idx` ON `gallery` (`owner_club_id`);--> statement-breakpoint
CREATE INDEX `gallery_status_idx` ON `gallery` (`status`);--> statement-breakpoint
CREATE INDEX `gallery_banned_idx` ON `gallery` (`banned_at`);--> statement-breakpoint
CREATE INDEX `galleryProposal_gallery_idx` ON `gallery_proposal` (`gallery_id`);--> statement-breakpoint
CREATE INDEX `galleryProposal_status_idx` ON `gallery_proposal` (`status`);--> statement-breakpoint
CREATE INDEX `galleryProposal_submittedBy_idx` ON `gallery_proposal` (`submitted_by_id`);--> statement-breakpoint
CREATE INDEX `galleryProposal_club_idx` ON `gallery_proposal` (`submitted_by_club_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `galleryProposal_pending_uq` ON `gallery_proposal` (`gallery_id`) WHERE "gallery_proposal"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `galleryProposalItem_proposal_idx` ON `gallery_proposal_item` (`proposal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `galleryProposalItem_target_uq` ON `gallery_proposal_item` (`proposal_id`,`target_id`);