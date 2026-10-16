CREATE TABLE `alumni_branch` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`contact` text,
	`href` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_department` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`telephone` text,
	`email` text,
	`sort_order` integer,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `facility` (
	`id` text PRIMARY KEY,
	`tag` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_facility_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `media_link` (
	`id` text PRIMARY KEY,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`meta` text,
	`href` text,
	`file_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_media_link_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT "media_link_kind_check" CHECK("kind" in ('publication', 'press'))
);
--> statement-breakpoint
CREATE TABLE `sport_tile` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`image_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_sport_tile_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `facility_published_idx` ON `facility` (`published_at`);--> statement-breakpoint
CREATE INDEX `media_link_kind_published_idx` ON `media_link` (`kind`,`published_at`);