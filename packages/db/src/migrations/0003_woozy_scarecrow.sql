CREATE TABLE `club_album_images` (
	`id` text PRIMARY KEY NOT NULL,
	`album_id` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `club_albums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `club_albums` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_image` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`featured_on_home` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `club_albums_activity_idx` ON `club_albums` (`activity_id`);--> statement-breakpoint
ALTER TABLE `activities` ADD `logo_url` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `banner_url` text;