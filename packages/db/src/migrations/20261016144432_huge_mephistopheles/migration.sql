CREATE TABLE `alumni_notable` (
	`id` text PRIMARY KEY,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`image_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_alumni_notable_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT "alumni_notable_category_check" CHECK("category" in ('public-service', 'academia', 'sport', 'arts-culture'))
);
--> statement-breakpoint
CREATE INDEX `alumni_notable_category_published_idx` ON `alumni_notable` (`category`,`published_at`);