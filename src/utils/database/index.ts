import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
// biome-ignore lint/performance/noNamespaceImport: Ignore
import * as schema from './schema'

export const expo = openDatabaseSync('profitly.db', { enableChangeListener: true })
export const db = drizzle(expo, { schema })
