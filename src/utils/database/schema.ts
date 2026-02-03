import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Users table for basic profile info
export const users = sqliteTable('users', {
    avatar: text('avatar'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    currency: text('currency').default('USD').notNull(),
    email: text('email'),
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// Trading accounts (for organizing trades)
export const accounts = sqliteTable('accounts', {
    accountType: text('account_type').notNull(), // 'demo', 'live', 'paper'
    broker: text('broker'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    currentBalance: real('current_balance').default(0).notNull(),
    id: text('id').primaryKey(),
    initialBalance: real('initial_balance').default(0).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    name: text('name').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    userId: text('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
})

// Individual trades
export const trades = sqliteTable('trades', {
    accountId: text('account_id')
        .references(() => accounts.id, { onDelete: 'cascade' })
        .notNull(),
    commission: real('commission').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    entryPrice: real('entry_price').notNull(),
    entryTime: integer('entry_time', { mode: 'timestamp' }).notNull(),
    exitPrice: real('exit_price'),
    exitTime: integer('exit_time', { mode: 'timestamp' }),
    id: text('id').primaryKey(),
    notes: text('notes'),
    pnl: real('pnl').default(0).notNull(),
    quantity: real('quantity').notNull(),
    side: text('side').notNull(), // 'buy', 'sell'
    status: text('status').notNull(), // 'open', 'closed', 'cancelled'
    stopLoss: real('stop_loss'),
    swap: real('swap').default(0).notNull(),
    symbol: text('symbol').notNull(),
    tags: text('tags'), // JSON array of tags
    takeProfit: real('take_profit'),
    tradeType: text('trade_type').notNull(), // 'market', 'limit', 'stop'
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// Trading sessions/journals
export const sessions = sqliteTable('sessions', {
    accountId: text('account_id')
        .references(() => accounts.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    description: text('description'),
    endTime: integer('end_time', { mode: 'timestamp' }),
    id: text('id').primaryKey(),
    startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
    title: text('title').notNull(),
    totalPnl: real('total_pnl').default(0).notNull(),
    totalTrades: integer('total_trades').default(0).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    winRate: real('win_rate').default(0).notNull(),
})

// Import logs for tracking uploaded files
export const importLogs = sqliteTable('import_logs', {
    accountId: text('account_id')
        .references(() => accounts.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    errorMessage: text('error_message'),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    id: text('id').primaryKey(),
    recordsImported: integer('records_imported').default(0).notNull(),
    recordsSkipped: integer('records_skipped').default(0).notNull(),
    status: text('status').notNull(), // 'success', 'partial', 'failed'
})

// Transaction categories for organizing trades and expenses
export const categories = sqliteTable('categories', {
    color: text('color').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    icon: text('icon').notNull(),
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'income', 'expense'
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// Export types for use in the app
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type ImportLog = typeof importLogs.$inferSelect
export type NewImportLog = typeof importLogs.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
