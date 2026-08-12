ALTER TABLE `achievements` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `achievements_slug_idx` ON `achievements` (`slug`);--> statement-breakpoint
ALTER TABLE `activities` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `activities_slug_idx` ON `activities` (`slug`);--> statement-breakpoint
ALTER TABLE `announcements` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `announcements_slug_idx` ON `announcements` (`slug`);--> statement-breakpoint
ALTER TABLE `big_matches` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `big_matches_slug_idx` ON `big_matches` (`slug`);--> statement-breakpoint
ALTER TABLE `events` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_idx` ON `events` (`slug`);--> statement-breakpoint
ALTER TABLE `gallery` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `gallery_slug_idx` ON `gallery` (`slug`);--> statement-breakpoint
ALTER TABLE `news` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_idx` ON `news` (`slug`);--> statement-breakpoint
ALTER TABLE `student_works` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `student_works_slug_idx` ON `student_works` (`slug`);