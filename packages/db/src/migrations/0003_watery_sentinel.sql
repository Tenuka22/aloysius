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
	`location` text,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`is_recurring` integer DEFAULT false NOT NULL,
	`recurrence_rule` text,
	`tags` text DEFAULT '[]',
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL
);
