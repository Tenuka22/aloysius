CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `announcements` ADD `cover_image` text;--> statement-breakpoint
ALTER TABLE `announcements` ADD `tags` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `announcements` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `announcements` ADD `audience` text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `announcements` ADD `addressed_to` text;