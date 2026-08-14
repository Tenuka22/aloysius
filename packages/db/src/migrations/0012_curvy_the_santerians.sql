ALTER TABLE `ob_members` ADD `admin_email` text;--> statement-breakpoint
ALTER TABLE `ob_members` ADD `year` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `ob_members_year_idx` ON `ob_members` (`year`);