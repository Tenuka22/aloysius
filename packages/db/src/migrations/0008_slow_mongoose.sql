ALTER TABLE `ob_members` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `ob_members` ADD `status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `ob_members` ADD `decided_by` text;--> statement-breakpoint
ALTER TABLE `ob_members` ADD `decided_at` integer;--> statement-breakpoint
CREATE INDEX `ob_members_user_idx` ON `ob_members` (`user_id`);--> statement-breakpoint
ALTER TABLE `ob_members` DROP COLUMN `is_active`;