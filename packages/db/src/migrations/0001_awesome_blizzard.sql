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
ALTER TABLE `announcements` ADD `activity_id` text REFERENCES activities(id);--> statement-breakpoint
ALTER TABLE `announcements` ADD `review_status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `announcements` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `announcements` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `announcements` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `events` ADD `activity_id` text REFERENCES activities(id);--> statement-breakpoint
ALTER TABLE `events` ADD `review_status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `events` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `news` ADD `activity_id` text REFERENCES activities(id);--> statement-breakpoint
ALTER TABLE `news` ADD `review_status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `news` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `news` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `news` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `student_works` ADD `activity_id` text REFERENCES activities(id);--> statement-breakpoint
ALTER TABLE `student_works` ADD `review_status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `student_works` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `student_works` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `student_works` ADD `rejection_reason` text;