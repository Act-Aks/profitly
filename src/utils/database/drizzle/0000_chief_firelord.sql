CREATE TABLE `accounts` (
	`account_type` text NOT NULL,
	`broker` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`initial_balance` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`name` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`color` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`icon` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import_logs` (
	`account_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`error_message` text,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`records_imported` integer DEFAULT 0 NOT NULL,
	`records_skipped` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`account_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`description` text,
	`end_time` integer,
	`id` text PRIMARY KEY NOT NULL,
	`start_time` integer NOT NULL,
	`title` text NOT NULL,
	`total_pnl` real DEFAULT 0 NOT NULL,
	`total_trades` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`win_rate` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`account_id` text NOT NULL,
	`commission` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`entry_price` real NOT NULL,
	`entry_time` integer NOT NULL,
	`exit_price` real,
	`exit_time` integer,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`pnl` real DEFAULT 0 NOT NULL,
	`quantity` real NOT NULL,
	`side` text NOT NULL,
	`status` text NOT NULL,
	`stop_loss` real,
	`swap` real DEFAULT 0 NOT NULL,
	`symbol` text NOT NULL,
	`tags` text,
	`take_profit` real,
	`trade_type` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
