CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'other' NOT NULL,
	`recipient_names` text DEFAULT '[]',
	`recipient_type` text DEFAULT 'student' NOT NULL,
	`year` integer,
	`cover_image` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`cover_image` text,
	`images` text DEFAULT '[]',
	`type` text DEFAULT 'club' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`author_name` text,
	`author_type` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`audience` text DEFAULT 'all' NOT NULL,
	`addressed_to` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `big_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`opponent` text NOT NULL,
	`type` text DEFAULT 'Cricket' NOT NULL,
	`year` integer,
	`event_id` text,
	`gallery_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `event_records` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`outcome` text NOT NULL,
	`reason` text,
	`notes` text,
	`recorded_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`body_image` text,
	`purpose` text,
	`organization` text,
	`organizer_name` text,
	`organizer_type` text,
	`location` text,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`is_recurring` integer DEFAULT false NOT NULL,
	`is_all_day` integer DEFAULT false NOT NULL,
	`recurrence_rule` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`type` text NOT NULL,
	`key` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gallery` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_id` text,
	`student_work_id` text,
	`achievement_id` text,
	`cover_image` text,
	`author_name` text,
	`author_type` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`student_work_id`) REFERENCES `student_works`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `gallery_images` (
	`id` text PRIMARY KEY NOT NULL,
	`gallery_id` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`author_name` text,
	`author_type` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stats` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_works` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'other' NOT NULL,
	`student_names` text DEFAULT '[]',
	`student_grade` text,
	`author_type` text,
	`cover_image` text,
	`content_url` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
