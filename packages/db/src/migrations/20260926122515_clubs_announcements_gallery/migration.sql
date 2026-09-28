CREATE TABLE `admin_activity` (
	`id` text PRIMARY KEY,
	`actor_user_id` text NOT NULL,
	`actor_username` text,
	`actor_role` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `announcement` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`audience` text DEFAULT 'all' NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`image_id` text,
	`effective_from` integer,
	`expires_at` integer,
	`published_at` integer,
	`author_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_announcement_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_announcement_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT "announcement_window_ordered" CHECK("expires_at" is null or "effective_from" is null or "expires_at" > "effective_from")
);
--> statement-breakpoint
CREATE TABLE `club_content_submission` (
	`id` text PRIMARY KEY,
	`club_id` text NOT NULL,
	`target` text NOT NULL,
	`target_id` text,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`base_snapshot` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_club_content_submission_club_id_club_id_fk` FOREIGN KEY (`club_id`) REFERENCES `club`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_content_submission_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_content_submission_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "clubContentSubmission_create_has_no_target" CHECK(("operation" = 'create' and "target_id" is null) or ("operation" <> 'create' and "target_id" is not null)),
	CONSTRAINT "clubContentSubmission_reviewed_fields_paired" CHECK(("status" = 'pending' and "reviewed_at" is null and "reviewed_by_id" is null) or ("status" <> 'pending' and "reviewed_at" is not null and "reviewed_by_id" is not null))
);
--> statement-breakpoint
CREATE TABLE `global_content_submission` (
	`id` text PRIMARY KEY,
	`target` text NOT NULL,
	`target_id` text,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`base_snapshot` text,
	`submitted_by_club_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_global_content_submission_submitted_by_club_id_club_id_fk` FOREIGN KEY (`submitted_by_club_id`) REFERENCES `club`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_global_content_submission_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_global_content_submission_reviewed_by_id_user_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT "globalContentSubmission_create_has_no_target" CHECK(("operation" = 'create' and "target_id" is null) or ("operation" <> 'create' and "target_id" is not null)),
	CONSTRAINT "globalContentSubmission_reviewed_fields_paired" CHECK(("status" = 'pending' and "reviewed_at" is null and "reviewed_by_id" is null) or ("status" <> 'pending' and "reviewed_at" is not null and "reviewed_by_id" is not null))
);
--> statement-breakpoint
CREATE TABLE `club_announcement` (
	`id` text PRIMARY KEY,
	`club_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`image_id` text,
	`global_announcement_id` text,
	`effective_from` integer,
	`expires_at` integer,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_club_announcement_club_id_club_id_fk` FOREIGN KEY (`club_id`) REFERENCES `club`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_announcement_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_club_announcement_global_announcement_id_announcement_id_fk` FOREIGN KEY (`global_announcement_id`) REFERENCES `announcement`(`id`) ON DELETE SET NULL,
	CONSTRAINT "clubAnnouncement_window_ordered" CHECK("expires_at" is null or "effective_from" is null or "expires_at" > "effective_from")
);
--> statement-breakpoint
CREATE TABLE `club_event` (
	`id` text PRIMARY KEY,
	`club_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`cover_image_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_club_event_club_id_club_id_fk` FOREIGN KEY (`club_id`) REFERENCES `club`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_club_event_cover_image_id_files_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT "clubEvent_window_ordered" CHECK("ends_at" >= "starts_at")
);
--> statement-breakpoint
CREATE TABLE `club` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text,
	`cover_image_id` text,
	`background_image_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_club_cover_image_id_files_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_club_background_image_id_files_id_fk` FOREIGN KEY (`background_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `art_gallery` (
	`gallery_id` text PRIMARY KEY,
	`medium` text,
	`artist` text,
	`venue` text,
	`year` integer,
	CONSTRAINT `fk_art_gallery_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `digital_gallery` (
	`gallery_id` text PRIMARY KEY,
	`format` text NOT NULL,
	`duration_seconds` integer,
	`poster_image_id` text,
	CONSTRAINT `fk_digital_gallery_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_digital_gallery_poster_image_id_files_id_fk` FOREIGN KEY (`poster_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `gallery` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`owner_club_id` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_owner_club_id_club_id_fk` FOREIGN KEY (`owner_club_id`) REFERENCES `club`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `gallery_item` (
	`id` text PRIMARY KEY,
	`gallery_id` text NOT NULL,
	`file_id` text NOT NULL,
	`caption` text,
	`alt_text` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`is_trending` integer DEFAULT false NOT NULL,
	`trending_position` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_item_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_gallery_item_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE,
	CONSTRAINT "galleryItem_trendingPosition_range" CHECK("trending_position" between 1 and 5),
	CONSTRAINT "galleryItem_trendingPosition_required" CHECK(("is_trending" = 1 and "trending_position" is not null) or ("is_trending" = 0 and "trending_position" is null))
);
--> statement-breakpoint
CREATE TABLE `gallery_link` (
	`id` text PRIMARY KEY,
	`gallery_id` text NOT NULL,
	`target` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_gallery_link_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `photo_gallery` (
	`gallery_id` text PRIMARY KEY,
	`shot_on` text,
	`location` text,
	`camera` text,
	`lens` text,
	`exposure` text,
	CONSTRAINT `fk_photo_gallery_gallery_id_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `achievement` (
	`id` text PRIMARY KEY,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`image_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_achievement_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `event` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`cover_image_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_event_cover_image_id_files_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `person` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`role` text,
	`bio` text,
	`image_id` text,
	`published_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_person_image_id_files_id_fk` FOREIGN KEY (`image_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS `class_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `class_grade_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `gsc_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `gsc_grade_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `gsc_basket_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `subject_assignment_staff_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `subject_assignment_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `subject_assignment_subject_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `exam_type_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `exam_type_category_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `exam_type_grade_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `grade_scale_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `grade_scale_subject_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `student_admission_number_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `student_name_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `student_admission_type_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sa_student_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sa_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sa_type_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sca_student_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sca_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sca_class_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sss_student_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sss_year_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sss_active_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `sm_assignment_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sm_exam_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sm_subject_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sm_entered_by_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `employment_verification_staff_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `employment_verification_status_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `employment_verification_type_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `password_rotation_staff_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `password_rotation_changed_by_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `teacher_qualification_staff_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `teacher_qualification_doc_status_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `staff_email_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `staff_nic_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `staff_appointment_type_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `staff_employment_status_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `staff_position_staff_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `staff_position_year_idx`;--> statement-breakpoint
CREATE INDEX `admin_activity_created_idx` ON `admin_activity` (`created_at`);--> statement-breakpoint
CREATE INDEX `announcement_audience_idx` ON `announcement` (`audience`);--> statement-breakpoint
CREATE INDEX `announcement_pinned_idx` ON `announcement` (`is_pinned`);--> statement-breakpoint
CREATE INDEX `announcement_publishedAt_idx` ON `announcement` (`published_at`);--> statement-breakpoint
CREATE INDEX `announcement_author_idx` ON `announcement` (`author_id`);--> statement-breakpoint
CREATE INDEX `clubContentSubmission_club_target_idx` ON `club_content_submission` (`club_id`,`target`,`target_id`);--> statement-breakpoint
CREATE INDEX `clubContentSubmission_status_idx` ON `club_content_submission` (`status`);--> statement-breakpoint
CREATE INDEX `clubContentSubmission_submittedBy_idx` ON `club_content_submission` (`submitted_by_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `clubContentSubmission_pending_uq` ON `club_content_submission` (`club_id`,`target`,`target_id`) WHERE "club_content_submission"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `globalContentSubmission_target_idx` ON `global_content_submission` (`target`,`target_id`);--> statement-breakpoint
CREATE INDEX `globalContentSubmission_status_idx` ON `global_content_submission` (`status`);--> statement-breakpoint
CREATE INDEX `globalContentSubmission_submittedBy_idx` ON `global_content_submission` (`submitted_by_id`);--> statement-breakpoint
CREATE INDEX `globalContentSubmission_club_idx` ON `global_content_submission` (`submitted_by_club_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `globalContentSubmission_pending_uq` ON `global_content_submission` (`target`,`target_id`) WHERE "global_content_submission"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `clubAnnouncement_club_idx` ON `club_announcement` (`club_id`);--> statement-breakpoint
CREATE INDEX `clubAnnouncement_global_idx` ON `club_announcement` (`global_announcement_id`);--> statement-breakpoint
CREATE INDEX `clubAnnouncement_publishedAt_idx` ON `club_announcement` (`published_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `clubEvent_club_slug_uq` ON `club_event` (`club_id`,`slug`);--> statement-breakpoint
CREATE INDEX `clubEvent_club_startsAt_idx` ON `club_event` (`club_id`,`starts_at`);--> statement-breakpoint
CREATE INDEX `clubEvent_startsAt_idx` ON `club_event` (`starts_at`);--> statement-breakpoint
CREATE INDEX `club_status_idx` ON `club` (`status`);--> statement-breakpoint
CREATE INDEX `club_coverImage_idx` ON `club` (`cover_image_id`);--> statement-breakpoint
CREATE INDEX `gallery_kind_idx` ON `gallery` (`kind`);--> statement-breakpoint
CREATE INDEX `gallery_ownerClub_idx` ON `gallery` (`owner_club_id`);--> statement-breakpoint
CREATE INDEX `gallery_status_idx` ON `gallery` (`status`);--> statement-breakpoint
CREATE INDEX `galleryItem_gallery_idx` ON `gallery_item` (`gallery_id`);--> statement-breakpoint
CREATE INDEX `galleryItem_file_idx` ON `gallery_item` (`file_id`);--> statement-breakpoint
CREATE INDEX `galleryItem_gallery_position_idx` ON `gallery_item` (`gallery_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `galleryItem_cover_uq` ON `gallery_item` (`gallery_id`) WHERE "gallery_item"."is_cover" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `galleryItem_trendingPosition_uq` ON `gallery_item` (`gallery_id`,`trending_position`) WHERE "gallery_item"."is_trending" = 1;--> statement-breakpoint
CREATE INDEX `galleryLink_gallery_idx` ON `gallery_link` (`gallery_id`);--> statement-breakpoint
CREATE INDEX `galleryLink_target_idx` ON `gallery_link` (`target`,`target_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `galleryLink_gallery_target_uq` ON `gallery_link` (`gallery_id`,`target`,`target_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `achievement_category_title_uq` ON `achievement` (`category`,`title`);--> statement-breakpoint
CREATE INDEX `achievement_published_idx` ON `achievement` (`published_at`);--> statement-breakpoint
CREATE INDEX `event_published_starts_idx` ON `event` (`published_at`,`starts_at`);--> statement-breakpoint
CREATE INDEX `person_published_idx` ON `person` (`published_at`);--> statement-breakpoint
DROP TABLE `class`;--> statement-breakpoint
DROP TABLE `grade_subject_config`;--> statement-breakpoint
DROP TABLE `subject_assignment`;--> statement-breakpoint
DROP TABLE `exam_type`;--> statement-breakpoint
DROP TABLE `grade_scale`;--> statement-breakpoint
DROP TABLE `student`;--> statement-breakpoint
DROP TABLE `student_admission`;--> statement-breakpoint
DROP TABLE `student_class_assignment`;--> statement-breakpoint
DROP TABLE `student_subject_selection`;--> statement-breakpoint
DROP TABLE `subject_mark`;--> statement-breakpoint
DROP TABLE `employment_verification`;--> statement-breakpoint
DROP TABLE `password_rotation_history`;--> statement-breakpoint
DROP TABLE `teacher_qualification`;--> statement-breakpoint
DROP TABLE `academic_year`;--> statement-breakpoint
DROP TABLE `staff`;--> statement-breakpoint
DROP TABLE `staff_position`;