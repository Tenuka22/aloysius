CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `account_provider_account_idx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "user_role_check" CHECK("user"."role" IN ('user', 'admin'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
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
CREATE UNIQUE INDEX `achievements_slug_idx` ON `achievements` (`slug`);--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`cover_image` text,
	`logo_url` text,
	`banner_url` text,
	`images` text DEFAULT '[]',
	`type` text DEFAULT 'club' NOT NULL,
	`admin_email` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_slug_idx` ON `activities` (`slug`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
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
	`user_id` text NOT NULL,
	`activity_id` text,
	`review_status` text DEFAULT 'approved' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `announcements_slug_idx` ON `announcements` (`slug`);--> statement-breakpoint
CREATE TABLE `big_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`opponent` text NOT NULL,
	`cover_image` text,
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
CREATE UNIQUE INDEX `big_matches_slug_idx` ON `big_matches` (`slug`);--> statement-breakpoint
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
CREATE TABLE `club_members` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason` text,
	`decided_by` text,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `club_members_activity_user_idx` ON `club_members` (`activity_id`,`user_id`);--> statement-breakpoint
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
	`slug` text DEFAULT '' NOT NULL,
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
	`user_id` text NOT NULL,
	`activity_id` text,
	`review_status` text DEFAULT 'approved' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_idx` ON `events` (`slug`);--> statement-breakpoint
CREATE TABLE `exam_results` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_type` text NOT NULL,
	`exam_year` integer NOT NULL,
	`results_year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exam_results_type_year_idx` ON `exam_results` (`exam_type`,`exam_year`);--> statement-breakpoint
CREATE TABLE `exam_students` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_result_id` text NOT NULL,
	`name` text NOT NULL,
	`photo` text,
	`quote` text,
	`marks` integer,
	`overall_grade` text,
	`stream` text,
	`subjects` text DEFAULT '[]',
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`exam_result_id`) REFERENCES `exam_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exam_students_result_idx` ON `exam_students` (`exam_result_id`);--> statement-breakpoint
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
	`slug` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_id` text,
	`ob_event_id` text,
	`ob_donation_id` text,
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
	FOREIGN KEY (`ob_event_id`) REFERENCES `ob_events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`ob_donation_id`) REFERENCES `ob_donations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`student_work_id`) REFERENCES `student_works`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gallery_slug_idx` ON `gallery` (`slug`);--> statement-breakpoint
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
	`slug` text DEFAULT '' NOT NULL,
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
	`user_id` text NOT NULL,
	`activity_id` text,
	`review_status` text DEFAULT 'approved' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_idx` ON `news` (`slug`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`link` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`read`);--> statement-breakpoint
CREATE TABLE `ob_announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`audience` text DEFAULT 'alumni' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ob_announcements_slug_idx` ON `ob_announcements` (`slug`);--> statement-breakpoint
CREATE TABLE `ob_donations` (
	`id` text PRIMARY KEY NOT NULL,
	`donor_name` text NOT NULL,
	`donor_email` text,
	`amount` integer,
	`currency` text DEFAULT 'LKR' NOT NULL,
	`purpose` text,
	`message` text,
	`image` text,
	`is_anonymous` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`donated_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ob_donations_status_idx` ON `ob_donations` (`status`);--> statement-breakpoint
CREATE TABLE `ob_events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_image` text,
	`location` text,
	`event_date` integer,
	`end_date` integer,
	`is_all_day` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ob_events_slug_idx` ON `ob_events` (`slug`);--> statement-breakpoint
CREATE TABLE `ob_members` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`email` text,
	`photo` text,
	`bio` text,
	`year` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`decided_by` text,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ob_members_role_idx` ON `ob_members` (`role`);--> statement-breakpoint
CREATE INDEX `ob_members_user_idx` ON `ob_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `ob_members_year_idx` ON `ob_members` (`year`);--> statement-breakpoint
CREATE TABLE `ob_news` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ob_news_slug_idx` ON `ob_news` (`slug`);--> statement-breakpoint
CREATE TABLE `principals` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`title` text DEFAULT 'Principal' NOT NULL,
	`quote` text,
	`message` text,
	`bio` text,
	`education` text,
	`tenure` text,
	`year` text DEFAULT '' NOT NULL,
	`portrait` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `principals_slug_idx` ON `principals` (`slug`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`email` text,
	`photo` text,
	`bio` text,
	`year` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `staff_members_year_idx` ON `staff_members` (`year`);--> statement-breakpoint
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
	`slug` text DEFAULT '' NOT NULL,
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
	`user_id` text NOT NULL,
	`activity_id` text,
	`review_status` text DEFAULT 'approved' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_works_slug_idx` ON `student_works` (`slug`);--> statement-breakpoint
CREATE TABLE `university_admissions` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_result_id` text NOT NULL,
	`student_name` text NOT NULL,
	`university` text NOT NULL,
	`course` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`exam_result_id`) REFERENCES `exam_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `university_admissions_result_idx` ON `university_admissions` (`exam_result_id`);