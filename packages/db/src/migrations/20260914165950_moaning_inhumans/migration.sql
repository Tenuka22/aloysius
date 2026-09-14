CREATE TABLE `content_version` (
	`id` text PRIMARY KEY,
	`page` text NOT NULL,
	`block_id` text NOT NULL,
	`action` text NOT NULL,
	`snapshot` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_content_version_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `content_version_page_idx` ON `content_version` (`page`);--> statement-breakpoint
CREATE INDEX `content_version_block_idx` ON `content_version` (`block_id`);--> statement-breakpoint
CREATE INDEX `content_version_page_block_idx` ON `content_version` (`page`,`block_id`);--> statement-breakpoint
CREATE INDEX `content_version_published_idx` ON `content_version` (`published`);--> statement-breakpoint
CREATE INDEX `content_version_author_idx` ON `content_version` (`author_id`);