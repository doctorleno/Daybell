CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`starts` text NOT NULL,
	`minutes` integer NOT NULL,
	`sound` text NOT NULL,
	`notes` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL
);
