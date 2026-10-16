CREATE TABLE `results_al_ranker` (
	`id` text PRIMARY KEY,
	`year_id` text NOT NULL,
	`stream` text NOT NULL,
	`name` text NOT NULL,
	`result` text NOT NULL,
	`z_score` text,
	`district_rank` text,
	`island_rank` text,
	`image_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_results_al_ranker_year_id_results_year_id_fk` FOREIGN KEY (`year_id`) REFERENCES `results_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_results_al_ranker_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT "results_al_ranker_stream_check" CHECK("stream" in ('physical-science', 'biological-science', 'commerce', 'arts', 'engineering-technology', 'bio-systems-technology'))
);
--> statement-breakpoint
CREATE TABLE `results_nine_a` (
	`id` text PRIMARY KEY,
	`year_id` text NOT NULL,
	`name` text NOT NULL,
	`image_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_results_nine_a_year_id_results_year_id_fk` FOREIGN KEY (`year_id`) REFERENCES `results_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_results_nine_a_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `results_nine_a_band` (
	`id` text PRIMARY KEY,
	`year_id` text NOT NULL,
	`band` text NOT NULL,
	`count` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_results_nine_a_band_year_id_results_year_id_fk` FOREIGN KEY (`year_id`) REFERENCES `results_year`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `results_scholarship` (
	`id` text PRIMARY KEY,
	`year_id` text NOT NULL,
	`name` text NOT NULL,
	`marks` text NOT NULL,
	`class_name` text,
	`image_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_results_scholarship_year_id_results_year_id_fk` FOREIGN KEY (`year_id`) REFERENCES `results_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_results_scholarship_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `results_year` (
	`id` text PRIMARY KEY,
	`year` text NOT NULL,
	`al_university_entrants` text,
	`al_three_a` text,
	`ol_nine_a` text,
	`scholarship_passers` text,
	`nine_a_total` text,
	`scholarship_cut_off` text,
	`scholarship_highest` text,
	`scholarship_pdf_href` text,
	`created_by_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_results_year_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `results_al_ranker_year_stream_idx` ON `results_al_ranker` (`year_id`,`stream`);--> statement-breakpoint
CREATE INDEX `results_nine_a_year_idx` ON `results_nine_a` (`year_id`);--> statement-breakpoint
CREATE INDEX `results_nine_a_band_year_idx` ON `results_nine_a_band` (`year_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `results_nine_a_band_year_band_uq` ON `results_nine_a_band` (`year_id`,`band`);--> statement-breakpoint
CREATE INDEX `results_scholarship_year_idx` ON `results_scholarship` (`year_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `results_year_year_uq` ON `results_year` (`year`);