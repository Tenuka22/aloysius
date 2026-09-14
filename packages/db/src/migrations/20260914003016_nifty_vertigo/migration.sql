CREATE TABLE `class` (
	`id` text PRIMARY KEY,
	`academic_year_id` text NOT NULL,
	`grade_level` integer NOT NULL,
	`name` text NOT NULL,
	`medium` text DEFAULT 'sinhala' NOT NULL,
	`homeroom_teacher_id` text,
	`sub_homeroom_teacher_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_class_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_class_homeroom_teacher_id_staff_id_fk` FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_sub_homeroom_teacher_id_staff_id_fk` FOREIGN KEY (`sub_homeroom_teacher_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
	CONSTRAINT `class_unique` UNIQUE(`academic_year_id`,`grade_level`,`name`)
);
--> statement-breakpoint
CREATE TABLE `subject_assignment` (
	`id` text PRIMARY KEY,
	`staff_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`subject_key` text NOT NULL,
	`grade_level` integer NOT NULL,
	`class_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_subject_assignment_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subject_assignment_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subject_assignment_class_id_class_id_fk` FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`impersonated_by` text,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`type` text NOT NULL,
	`key` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_files_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `employment_verification` (
	`id` text PRIMARY KEY,
	`staff_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`review_note` text,
	`reviewed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_employment_verification_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_employment_verification_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_employment_verification_reviewed_by_staff_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `password_rotation_history` (
	`id` text PRIMARY KEY,
	`staff_id` text NOT NULL,
	`changed_by` text,
	`change_method` text NOT NULL,
	`changed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_password_rotation_history_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_password_rotation_history_changed_by_staff_id_fk` FOREIGN KEY (`changed_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_qualification` (
	`id` text PRIMARY KEY,
	`staff_id` text NOT NULL,
	`qualification` text NOT NULL,
	`year_obtained` integer,
	`institution` text,
	`subject_specialization` text,
	`specialization_category` text,
	`document_file_id` text,
	`document_status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`review_note` text,
	`reviewed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_teacher_qualification_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_qualification_document_file_id_files_id_fk` FOREIGN KEY (`document_file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_teacher_qualification_reviewed_by_staff_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
	CONSTRAINT `teacher_qualification_unique` UNIQUE(`staff_id`,`qualification`,`year_obtained`,`institution`)
);
--> statement-breakpoint
CREATE TABLE `academic_year` (
	`id` text PRIMARY KEY,
	`year` integer NOT NULL UNIQUE,
	`is_current` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text,
	`nic` text,
	`phone` text,
	`birth_date` text,
	`gender` text,
	`religion` text,
	`mother_tongue` text,
	`blood_group` text,
	`marital_status` text,
	`spouse_name` text,
	`address_line_1` text,
	`address_line_2` text,
	`city` text,
	`district` text,
	`grama_niladhari_division` text,
	`postal_code` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`appointment_type` text,
	`appointment_date` text,
	`teacher_service_no` text,
	`employment_status` text,
	`portrait_file_id` text,
	`national_identity_card_file_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_staff_portrait_file_id_files_id_fk` FOREIGN KEY (`portrait_file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_staff_national_identity_card_file_id_files_id_fk` FOREIGN KEY (`national_identity_card_file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `staff_position` (
	`id` text PRIMARY KEY,
	`staff_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`position` text NOT NULL,
	`sectional_scope` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_staff_position_staff_id_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_staff_position_academic_year_id_academic_year_id_fk` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_year`(`id`) ON DELETE CASCADE,
	CONSTRAINT `staff_position_unique` UNIQUE(`staff_id`,`academic_year_id`,`position`,`sectional_scope`)
);
--> statement-breakpoint
CREATE INDEX `class_year_idx` ON `class` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `class_grade_idx` ON `class` (`grade_level`);--> statement-breakpoint
CREATE INDEX `subject_assignment_staff_idx` ON `subject_assignment` (`staff_id`);--> statement-breakpoint
CREATE INDEX `subject_assignment_year_idx` ON `subject_assignment` (`academic_year_id`);--> statement-breakpoint
CREATE INDEX `subject_assignment_subject_idx` ON `subject_assignment` (`subject_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_providerId_accountId_uidx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `files_userId_idx` ON `files` (`user_id`);--> statement-breakpoint
CREATE INDEX `employment_verification_staff_idx` ON `employment_verification` (`staff_id`);--> statement-breakpoint
CREATE INDEX `employment_verification_status_idx` ON `employment_verification` (`status`);--> statement-breakpoint
CREATE INDEX `employment_verification_type_idx` ON `employment_verification` (`document_type`);--> statement-breakpoint
CREATE INDEX `password_rotation_staff_idx` ON `password_rotation_history` (`staff_id`);--> statement-breakpoint
CREATE INDEX `password_rotation_changed_by_idx` ON `password_rotation_history` (`changed_by`);--> statement-breakpoint
CREATE INDEX `teacher_qualification_staff_idx` ON `teacher_qualification` (`staff_id`);--> statement-breakpoint
CREATE INDEX `teacher_qualification_doc_status_idx` ON `teacher_qualification` (`document_status`);--> statement-breakpoint
CREATE INDEX `staff_email_idx` ON `staff` (`email`);--> statement-breakpoint
CREATE INDEX `staff_nic_idx` ON `staff` (`nic`);--> statement-breakpoint
CREATE INDEX `staff_appointment_type_idx` ON `staff` (`appointment_type`);--> statement-breakpoint
CREATE INDEX `staff_employment_status_idx` ON `staff` (`employment_status`);--> statement-breakpoint
CREATE INDEX `staff_position_staff_idx` ON `staff_position` (`staff_id`);--> statement-breakpoint
CREATE INDEX `staff_position_year_idx` ON `staff_position` (`academic_year_id`);