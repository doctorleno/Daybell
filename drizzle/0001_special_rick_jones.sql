ALTER TABLE `entries` ADD `owner_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_entries_owner_starts` ON `entries` (`owner_id`,`starts`);