import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Statement summaries (bank/broker/manual)
export const statements = sqliteTable('statements', {
    accountLabel: text('account_label'),
    closingBalance: real('closing_balance'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    currency: text('currency').notNull(),
    currencySymbol: text('currency_symbol').notNull(),
    fees: real('fees').default(0).notNull(),
    grossExpense: real('gross_expense').default(0).notNull(),
    grossIncome: real('gross_income').default(0).notNull(),
    id: text('id').primaryKey(),
    netProfit: real('net_profit').default(0).notNull(),
    notes: text('notes'),
    openingBalance: real('opening_balance'),
    periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
    periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
    sourceName: text('source_name'),
    sourceType: text('source_type', { enum: ['bank', 'broker', 'manual', 'import'] }).notNull(),
    taxes: real('taxes').default(0).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// Uploaded files tied to statements
export const statementFiles = sqliteTable('statement_files', {
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    fileUri: text('file_uri').notNull(),
    id: text('id').primaryKey(),
    mimeType: text('mime_type'),
    parseMethod: text('parse_method', {
        enum: ['csv', 'ofx', 'qfx', 'pdf', 'image', 'manual', 'unknown'],
    }).notNull(),
    parseStatus: text('parse_status', { enum: ['success', 'partial', 'failed'] }).notNull(),
    statementId: text('statement_id')
        .references(() => statements.id, { onDelete: 'cascade' })
        .notNull(),
})

// Export DB types
export type Statement = typeof statements.$inferSelect
export type NewStatement = typeof statements.$inferInsert
export type StatementFile = typeof statementFiles.$inferSelect
export type NewStatementFile = typeof statementFiles.$inferInsert
