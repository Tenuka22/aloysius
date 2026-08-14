ALTER TABLE `principals` ADD `slug` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `principals` ADD `message` text;--> statement-breakpoint
ALTER TABLE `principals` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `principals` ADD `education` text;--> statement-breakpoint
ALTER TABLE `principals` ADD `tenure` text;--> statement-breakpoint
CREATE UNIQUE INDEX `principals_slug_idx` ON `principals` (`slug`);