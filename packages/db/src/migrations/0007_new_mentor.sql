CREATE TABLE `ob_donations` (
	`id` text PRIMARY KEY NOT NULL,
	`donor_name` text NOT NULL,
	`donor_email` text,
	`amount` integer,
	`currency` text DEFAULT 'LKR' NOT NULL,
	`purpose` text,
	`message` text,
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
	`name` text NOT NULL,
	`role` text NOT NULL,
	`email` text,
	`photo` text,
	`bio` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ob_members_role_idx` ON `ob_members` (`role`);