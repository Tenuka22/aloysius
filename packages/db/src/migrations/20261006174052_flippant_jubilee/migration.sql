ALTER TABLE `content_version` ADD `batch_id` text;--> statement-breakpoint
CREATE INDEX `content_version_page_batch_idx` ON `content_version` (`page`,`batch_id`);