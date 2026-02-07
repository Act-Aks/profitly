import { migrate } from 'drizzle-orm/expo-sqlite/migrator'
import migrations from './drizzle/migrations'
import { db } from './index'

export async function initializeDatabase() {
    try {
        console.info('Running migrations...')
        await migrate(db, migrations)

        console.info('Database initialized successfully')
    } catch (error) {
        console.error('Database init failed:', error)
    }
}

export const Database = {
    initialize: initializeDatabase,
}
