CREATE TABLE `statement_files` (
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_uri` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`mime_type` text,
	`parse_method` text NOT NULL,
	`parse_status` text NOT NULL,
	`statement_id` text NOT NULL,
	FOREIGN KEY (`statement_id`) REFERENCES `statements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `statements` (
	`account_label` text,
	`closing_balance` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`currency` text NOT NULL,
	`currency_symbol` text NOT NULL,
	`fees` real DEFAULT 0 NOT NULL,
	`gross_expense` real DEFAULT 0 NOT NULL,
	`gross_income` real DEFAULT 0 NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`net_profit` real DEFAULT 0 NOT NULL,
	`notes` text,
	`opening_balance` real,
	`period_end` integer NOT NULL,
	`period_start` integer NOT NULL,
	`source_name` text,
	`source_type` text NOT NULL,
	`taxes` real DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
