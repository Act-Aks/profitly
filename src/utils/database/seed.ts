import type { InferInsertModel } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/expo-sqlite/migrator'
import migrations from './drizzle/migrations'
import { db } from './index'
import { categories } from './schema'

type NewCategory = InferInsertModel<typeof categories>

export async function initializeDatabase() {
    try {
        console.info('Running migrations...')
        await migrate(db, migrations)

        console.info('Seeding data...')
        await seedDefaultCategories(db)

        console.info('Database initialized successfully')
    } catch (error) {
        console.error('Database init failed:', error)
    }
}

async function seedDefaultCategories(dbInstance: typeof db) {
    const defaultCategories: NewCategory[] = [
        { color: '#22c55e', icon: 'briefcase', id: 'salary', name: 'Salary', type: 'income' },
        { color: '#10b981', icon: 'laptop', id: 'freelance', name: 'Freelance', type: 'income' },
        {
            color: '#14b8a6',
            icon: 'trending-up',
            id: 'investment',
            name: 'Investment',
            type: 'income',
        },
        { color: '#06b6d4', icon: 'shopping-bag', id: 'sales', name: 'Sales', type: 'income' },
        {
            color: '#0ea5e9',
            icon: 'plus-circle',
            id: 'other-income',
            name: 'Other Income',
            type: 'income',
        },
        { color: '#f97316', icon: 'utensils', id: 'food', name: 'Food & Dining', type: 'expense' },
        { color: '#eab308', icon: 'car', id: 'transport', name: 'Transport', type: 'expense' },
        { color: '#84cc16', icon: 'zap', id: 'utilities', name: 'Utilities', type: 'expense' },
        {
            color: '#ec4899',
            icon: 'shopping-cart',
            id: 'shopping',
            name: 'Shopping',
            type: 'expense',
        },
        {
            color: '#8b5cf6',
            icon: 'film',
            id: 'entertainment',
            name: 'Entertainment',
            type: 'expense',
        },
        { color: '#ef4444', icon: 'heart', id: 'health', name: 'Health', type: 'expense' },
        { color: '#6366f1', icon: 'book', id: 'education', name: 'Education', type: 'expense' },
        { color: '#78716c', icon: 'home', id: 'rent', name: 'Rent', type: 'expense' },
        { color: '#0891b2', icon: 'shield', id: 'insurance', name: 'Insurance', type: 'expense' },
        {
            color: '#64748b',
            icon: 'more-horizontal',
            id: 'other-expense',
            name: 'Other',
            type: 'expense',
        },
    ]

    // Explicit columns bypass order/partial issues
    await dbInstance.insert(categories).values(defaultCategories).onConflictDoNothing()
}

export const Database = {
    initialize: initializeDatabase,
}
